// 翻译管理器 - 整合翻译器、配置和缓存
import type { TranslateParams, TranslateResult, TranslationEngine } from '@/types';
import { TranslatorFactory } from '../translator/TranslatorFactory';
import { ConfigService } from '../config/ConfigService';
import { translationCache } from '../cache/TranslationCache';
import { indexedDBCache } from '../cache/IndexedDBCache';
import { formatErrorMessage } from '../translator/utils';

/**
 * 翻译管理器
 * 负责协调翻译器、配置管理和缓存
 */
export class TranslationManager {
  /**
   * 执行翻译
   * @param params 翻译参数
   * @returns 翻译结果
   */
  static async translate(params: TranslateParams): Promise<TranslateResult> {
    const { text, from, to } = params;

    try {
      // 获取当前配置
      const config = await ConfigService.getConfig();
      const engine = config.engine;

      // 1. 检查 L1 内存缓存
      const l1CachedResult = translationCache.get(text, from, to, engine);
      if (l1CachedResult) {
        return l1CachedResult;
      }

      // 2. 检查 L2 IndexedDB 缓存
      const l2CachedResult = await indexedDBCache.get(text, from, to, engine);
      if (l2CachedResult) {
        // 回填到 L1 缓存
        translationCache.set(text, from, to, engine, l2CachedResult);
        return l2CachedResult;
      }

      // 3. 执行翻译（传递配置到工厂）
      const translator = TranslatorFactory.getTranslator(engine, config);
      const result = await translator.translate({ text, from, to });

      // 4. 同时缓存到 L1 和 L2
      translationCache.set(text, from, to, engine, result);
      await indexedDBCache.set(text, from, to, engine, result);

      return result;
    } catch (error) {
      console.error('Translation error:', error);

      // 格式化错误消息
      const errorMessage = formatErrorMessage(error);

      throw new Error(errorMessage);
    }
  }

  /**
   * 检测语言
   * @param text 待检测文本
   * @returns 语言代码
   */
  static async detectLanguage(text: string): Promise<string> {
    try {
      const config = await ConfigService.getConfig();
      const translator = TranslatorFactory.getTranslator(config.engine, config);

      return await translator.detectLanguage(text);
    } catch (error) {
      console.error('Language detection error:', error);
      return 'auto';
    }
  }

  /**
   * 获取支持的语言列表
   * @param engine 翻译引擎，默认使用配置中的引擎
   * @returns 语言代码数组
   */
  static async getSupportedLanguages(engine?: TranslationEngine): Promise<string[]> {
    try {
      const config = await ConfigService.getConfig();
      const targetEngine = engine || config.engine;
      const translator = TranslatorFactory.getTranslator(targetEngine, config);

      return translator.getSupportedLanguages();
    } catch (error) {
      console.error('Failed to get supported languages:', error);
      return ['auto', 'zh-CN', 'en']; // 返回最基本的语言列表
    }
  }

  /**
   * 检查翻译引擎是否可用
   * @param engine 翻译引擎，默认使用配置中的引擎
   * @returns 是否可用
   */
  static async checkAvailability(engine?: TranslationEngine): Promise<boolean> {
    try {
      const config = await ConfigService.getConfig();
      const targetEngine = engine || config.engine;

      return await TranslatorFactory.checkAvailability(targetEngine, config);
    } catch (error) {
      console.error('Availability check error:', error);
      return false;
    }
  }

  /**
   * 切换翻译引擎
   * @param engine 新的翻译引擎
   */
  static async switchEngine(engine: TranslationEngine): Promise<void> {
    try {
      // 保存新配置
      await ConfigService.saveConfig({ engine });
    } catch (error) {
      console.error('Failed to switch engine:', error);
      throw new Error('切换翻译引擎失败');
    }
  }

  /**
   * 清除翻译缓存（同时清除 L1 和 L2）
   */
  static async clearCache(): Promise<void> {
    translationCache.clear();
    await indexedDBCache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  static async getCacheStats() {
    const l1Stats = translationCache.getStats();
    const l2Stats = await indexedDBCache.getStats();

    return {
      l1: {
        name: 'Memory Cache',
        ...l1Stats,
      },
      l2: {
        name: 'IndexedDB Cache',
        ...l2Stats,
      },
      totalSize: l1Stats.size + l2Stats.size,
    };
  }
}
