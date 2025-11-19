/**
 * Azure TTS 音频迁移服务
 * 用于批量为已有单词卡片重新生成 Azure 音频
 */

import { AzureTTSService, AZURE_VOICES, type AzureVoiceConfig } from '../audio/AzureTTSService';
import { supabaseService } from '../sync/SupabaseService';
import { flashcardDB } from '../flashcard/FlashcardDB';
import type { Flashcard } from '@/types/flashcard';

/**
 * 迁移进度回调函数类型
 */
export type AzureMigrationProgressCallback = (progress: AzureMigrationProgress) => void;

/**
 * 迁移进度信息
 */
export interface AzureMigrationProgress {
  phase: 'fetching' | 'processing' | 'completed' | 'error';
  total: number;           // 总共需要处理的卡片数
  processed: number;       // 已处理的卡片数
  updated: number;         // 成功更新的数量
  skipped: number;         // 跳过的数量
  failed: number;          // 失败的数量
  currentWord?: string;    // 当前正在处理的单词
  errors: Array<{          // 错误列表
    cardId: string;
    word: string;
    error: string;
  }>;
}

/**
 * Azure TTS 音频迁移服务
 */
export class AzureAudioMigrationService {
  private azureTTSService?: AzureTTSService;
  private isRunning = false;

  // 配置参数
  private readonly API_DELAY = 500; // API 调用间隔（毫秒），Azure TTS 需要更长的延迟

  constructor(
    azureSpeechKey?: string,
    azureSpeechRegion?: string,
    azureVoiceName?: string
  ) {
    if (azureSpeechKey && azureSpeechRegion) {
      try {
        const voice: AzureVoiceConfig = azureVoiceName
          ? { name: azureVoiceName, lang: azureVoiceName.split('-').slice(0, 2).join('-') }
          : AZURE_VOICES.EN_US_ARIA; // 默认美式英语女声

        this.azureTTSService = new AzureTTSService(azureSpeechKey, azureSpeechRegion, voice);
        console.log('[AzureAudioMigration] Azure TTS 服务已初始化:', voice.name);
      } catch (error) {
        console.warn('[AzureAudioMigration] Azure TTS 服务初始化失败:', error);
      }
    }
  }

  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return !!this.azureTTSService;
  }

  /**
   * 检查是否正在运行
   */
  isProcessing(): boolean {
    return this.isRunning;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取本地需要更新的卡片
   * 获取所有英文单词卡片（无论是否已有 audioUrl，都重新生成）
   */
  private async fetchLocalCardsNeedingAudioUrl(): Promise<Flashcard[]> {
    const allCards = await flashcardDB.getAllFlashcards();

    // 筛选出英文单词的卡片（重新生成所有音频）
    return allCards.filter(
      card => card.sourceLanguage === 'en'
    );
  }

  /**
   * 从云端获取需要更新的卡片
   * 获取所有卡片（通过 API 判断是否是英文单词）
   */
  private async fetchCloudCardsNeedingAudioUrl(): Promise<Array<{ id: string; word: string }>> {
    const client = supabaseService.getClient();
    const userId = supabaseService.getUserId();

    // 获取所有卡片，不过滤 audio_url（重新生成所有音频）
    const { data, error } = await client
      .from('flashcards')
      .select('id, word')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`获取云端卡片失败: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 更新本地卡片的 audio_url
   */
  private async updateLocalCardAudioUrl(card: Flashcard, audioUrl: string): Promise<void> {
    const updated: Flashcard = {
      ...card,
      audioUrl,
      updatedAt: Date.now(),
    };

    await flashcardDB.updateFlashcard(updated);
  }

  /**
   * 更新云端卡片的 audio_url
   */
  private async updateCloudCardAudioUrl(cardId: string, audioUrl: string): Promise<void> {
    const client = supabaseService.getClient();

    const { error } = await client
      .from('flashcards')
      .update({
        audio_url: audioUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cardId);

    if (error) {
      throw new Error(`更新云端卡片失败: ${error.message}`);
    }
  }

  /**
   * 处理单个卡片（本地模式）
   */
  private async processLocalCard(
    card: Flashcard,
    progress: AzureMigrationProgress
  ): Promise<void> {
    if (!this.azureTTSService) {
      throw new Error('Azure TTS 服务未初始化');
    }

    try {
      progress.currentWord = card.word;

      // 使用 Azure TTS 生成音频
      const audioUrl = await this.azureTTSService.textToSpeech(card.word);

      // 更新本地数据库
      await this.updateLocalCardAudioUrl(card, audioUrl);
      progress.updated++;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      progress.failed++;
      progress.errors.push({
        cardId: card.id,
        word: card.word,
        error: errorMsg,
      });
    } finally {
      progress.processed++;
    }
  }

  /**
   * 处理单个卡片（云端模式）
   * 注意：由于云端没有存储语言信息，我们假设所有单词都是英文
   * 非英文单词的 TTS 可能会有口音，但不会失败
   */
  private async processCloudCard(
    cardInfo: { id: string; word: string },
    progress: AzureMigrationProgress
  ): Promise<void> {
    if (!this.azureTTSService) {
      throw new Error('Azure TTS 服务未初始化');
    }

    try {
      progress.currentWord = cardInfo.word;

      // 使用 Azure TTS 生成音频
      const audioUrl = await this.azureTTSService.textToSpeech(cardInfo.word);

      // 更新云端数据库
      await this.updateCloudCardAudioUrl(cardInfo.id, audioUrl);
      progress.updated++;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      progress.failed++;
      progress.errors.push({
        cardId: cardInfo.id,
        word: cardInfo.word,
        error: errorMsg,
      });
    } finally {
      progress.processed++;
    }
  }

  /**
   * 执行本地迁移
   * 只更新本地 IndexedDB 中的数据
   */
  async migrateLocal(
    onProgress?: AzureMigrationProgressCallback
  ): Promise<AzureMigrationProgress> {
    if (this.isRunning) {
      throw new Error('迁移正在进行中');
    }

    if (!this.azureTTSService) {
      throw new Error('Azure TTS 服务未配置，请先在设置中配置 Azure API Key 和 Region');
    }

    this.isRunning = true;

    const progress: AzureMigrationProgress = {
      phase: 'fetching',
      total: 0,
      processed: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    try {
      // 获取需要处理的卡片
      onProgress?.({ ...progress });
      const cards = await this.fetchLocalCardsNeedingAudioUrl();

      progress.total = cards.length;
      progress.phase = 'processing';
      onProgress?.({ ...progress });

      if (cards.length === 0) {
        progress.phase = 'completed';
        onProgress?.({ ...progress });
        return progress;
      }

      // 分批处理
      for (let i = 0; i < cards.length; i++) {
        await this.processLocalCard(cards[i], progress);
        // 传递新对象以触发 React 重新渲染
        onProgress?.({ ...progress, errors: [...progress.errors] });

        // API 调用延迟
        if (i < cards.length - 1) {
          await this.delay(this.API_DELAY);
        }
      }

      progress.phase = 'completed';
      onProgress?.({ ...progress, errors: [...progress.errors] });
      return progress;

    } catch (error) {
      progress.phase = 'error';
      const errorMsg = error instanceof Error ? error.message : String(error);
      progress.errors.push({
        cardId: '',
        word: '系统错误',
        error: errorMsg,
      });
      onProgress?.({ ...progress, errors: [...progress.errors] });
      throw error;

    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 执行云端迁移
   * 只更新 Supabase 云端数据库中的数据
   */
  async migrateCloud(
    onProgress?: AzureMigrationProgressCallback
  ): Promise<AzureMigrationProgress> {
    if (this.isRunning) {
      throw new Error('迁移正在进行中');
    }

    if (!this.azureTTSService) {
      throw new Error('Azure TTS 服务未配置，请先在设置中配置 Azure API Key 和 Region');
    }

    if (!supabaseService.isAuthenticated()) {
      throw new Error('用户未登录，无法更新云端数据');
    }

    this.isRunning = true;

    const progress: AzureMigrationProgress = {
      phase: 'fetching',
      total: 0,
      processed: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    try {
      // 获取需要处理的卡片
      onProgress?.({ ...progress });
      const cards = await this.fetchCloudCardsNeedingAudioUrl();

      progress.total = cards.length;
      progress.phase = 'processing';
      onProgress?.({ ...progress });

      if (cards.length === 0) {
        progress.phase = 'completed';
        onProgress?.({ ...progress });
        return progress;
      }

      // 分批处理
      for (let i = 0; i < cards.length; i++) {
        await this.processCloudCard(cards[i], progress);
        // 传递新对象以触发 React 重新渲染
        onProgress?.({ ...progress, errors: [...progress.errors] });

        // API 调用延迟
        if (i < cards.length - 1) {
          await this.delay(this.API_DELAY);
        }
      }

      progress.phase = 'completed';
      onProgress?.({ ...progress, errors: [...progress.errors] });
      return progress;

    } catch (error) {
      progress.phase = 'error';
      const errorMsg = error instanceof Error ? error.message : String(error);
      progress.errors.push({
        cardId: '',
        word: '系统错误',
        error: errorMsg,
      });
      onProgress?.({ ...progress, errors: [...progress.errors] });
      throw error;

    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 执行完整迁移（本地 + 云端）
   * 先更新本地，再更新云端
   */
  async migrateBoth(
    onProgress?: AzureMigrationProgressCallback
  ): Promise<{ local: AzureMigrationProgress; cloud: AzureMigrationProgress }> {
    // 先执行本地迁移
    const localProgress = await this.migrateLocal(onProgress);

    // 如果已登录，再执行云端迁移
    let cloudProgress: AzureMigrationProgress = {
      phase: 'completed',
      total: 0,
      processed: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    if (supabaseService.isAuthenticated()) {
      cloudProgress = await this.migrateCloud(onProgress);
    }

    return { local: localProgress, cloud: cloudProgress };
  }
}
