// Flashcard 业务逻辑服务
import { v4 as uuidv4 } from 'uuid';
import type {
  Flashcard,
  FlashcardGroup,
  CreateFlashcardParams,
  UpdateFlashcardParams,
  FlashcardSearchParams,
  ProficiencyLevel,
} from '@/types/flashcard';
import type { TranslateResult } from '@/types';
import { flashcardDB } from './FlashcardDB';
import { fsrsService } from './FSRSService';

/**
 * Flashcard 业务服务
 * 提供高层业务逻辑，协调 FlashcardDB 和 FSRS 服务
 */
export class FlashcardService {
  /**
   * 从翻译结果创建 Flashcard
   */
  async createFromTranslation(
    translation: TranslateResult,
    params?: Partial<CreateFlashcardParams>
  ): Promise<Flashcard> {
    const now = Date.now();
    const fsrsCard = fsrsService.createCard();

    // 如果有词典信息（meanings），将所有词性的翻译组合成完整的翻译文本
    let fullTranslation = translation.translation;
    if (translation.meanings && translation.meanings.length > 0) {
      fullTranslation = translation.meanings.map(meaning => {
        // 格式：词性. 翻译1；翻译2；翻译3
        const translations = meaning.translations.map(t => t.text).join('；');
        return `${meaning.partOfSpeech}. ${translations}`;
      }).join('\n');
    }

    // 处理 meanings，只保留每个词性中置信度最高的翻译的第一个示例
    let processedMeanings = translation.meanings;
    if (translation.meanings && translation.meanings.length > 0) {
      processedMeanings = translation.meanings.map(meaning => {
        // 找到置信度最高的翻译
        const highestConfidenceTranslation = meaning.translations.reduce((prev, current) => {
          return (current.confidence > prev.confidence) ? current : prev;
        });

        // 处理 translations，只保留置信度最高的翻译的第一个示例
        const processedTranslations = meaning.translations.map(trans => {
          if (trans === highestConfidenceTranslation) {
            // 只保留第一个示例
            return {
              ...trans,
              examples: trans.examples ? trans.examples.slice(0, 1) : []
            };
          } else {
            // 其他翻译清空示例
            return {
              ...trans,
              examples: []
            };
          }
        });

        return {
          ...meaning,
          translations: processedTranslations
        };
      });
    }

    const flashcard: Flashcard = {
      id: uuidv4(),
      word: translation.text,
      translation: fullTranslation,  // 保存所有词性的完整翻译
      pronunciation: translation.pronunciation,
      examples: translation.examples,
      notes: params?.notes,

      // 保存词典信息（多词性、多释义）
      phonetic: translation.phonetic,
      meanings: processedMeanings,  // 使用处理后的 meanings

      sourceLanguage: translation.from,
      targetLanguage: translation.to,
      engine: translation.engine,

      groupId: params?.groupId || 'default',
      tags: params?.tags || [],

      createdAt: now,
      updatedAt: now,
      favorite: false,

      // FSRS 数据
      fsrsCard,
      totalReviews: 0,
      correctCount: 0,
      wrongCount: 0,
      averageResponseTime: 0,
      nextReview: fsrsService.getNextReviewDate(fsrsCard),
      proficiency: fsrsService.calculateProficiency(fsrsCard),
    };

    await flashcardDB.addFlashcard(flashcard);
    await this.updateGroupCardCount(flashcard.groupId);

    return flashcard;
  }

  /**
   * 手动创建 Flashcard
   */
  async create(params: CreateFlashcardParams): Promise<Flashcard> {
    const now = Date.now();
    const fsrsCard = fsrsService.createCard();

    const flashcard: Flashcard = {
      id: uuidv4(),
      word: params.word,
      translation: params.translation,
      pronunciation: params.pronunciation,
      examples: params.examples,
      notes: params.notes,

      sourceLanguage: params.sourceLanguage,
      targetLanguage: params.targetLanguage,
      engine: params.engine,

      groupId: params.groupId || 'default',
      tags: params.tags || [],

      createdAt: now,
      updatedAt: now,
      favorite: false,

      // FSRS 数据
      fsrsCard,
      totalReviews: 0,
      correctCount: 0,
      wrongCount: 0,
      averageResponseTime: 0,
      nextReview: fsrsService.getNextReviewDate(fsrsCard),
      proficiency: fsrsService.calculateProficiency(fsrsCard),
    };

    await flashcardDB.addFlashcard(flashcard);
    await this.updateGroupCardCount(flashcard.groupId);

    return flashcard;
  }

  /**
   * 更新 Flashcard
   */
  async update(id: string, params: UpdateFlashcardParams): Promise<Flashcard> {
    const flashcard = await flashcardDB.getFlashcard(id);
    if (!flashcard) {
      throw new Error(`Flashcard not found: ${id}`);
    }

    const oldGroupId = flashcard.groupId;

    // 更新字段
    const updated: Flashcard = {
      ...flashcard,
      ...params,
      updatedAt: Date.now(),
    };

    await flashcardDB.updateFlashcard(updated);

    // 如果分组发生变化，更新两个分组的卡片计数
    if (params.groupId && params.groupId !== oldGroupId) {
      await this.updateGroupCardCount(oldGroupId);
      await this.updateGroupCardCount(params.groupId);
    }

    return updated;
  }

  /**
   * 删除 Flashcard
   */
  async delete(id: string): Promise<void> {
    const flashcard = await flashcardDB.getFlashcard(id);
    if (!flashcard) {
      throw new Error(`Flashcard not found: ${id}`);
    }

    await flashcardDB.deleteFlashcard(id);
    await this.updateGroupCardCount(flashcard.groupId);
  }

  /**
   * 批量删除 Flashcards
   */
  async batchDelete(ids: string[]): Promise<void> {
    const flashcards = await Promise.all(ids.map(id => flashcardDB.getFlashcard(id)));
    const groupIds = new Set(flashcards.filter(f => f).map(f => f!.groupId));

    await flashcardDB.deleteFlashcards(ids);

    // 更新所有涉及的分组
    for (const groupId of groupIds) {
      await this.updateGroupCardCount(groupId);
    }
  }

  /**
   * 获取 Flashcard
   */
  async get(id: string): Promise<Flashcard | null> {
    return flashcardDB.getFlashcard(id);
  }

  /**
   * 获取所有 Flashcards
   */
  async getAll(): Promise<Flashcard[]> {
    return flashcardDB.getAllFlashcards();
  }

  /**
   * 搜索 Flashcards
   */
  async search(params: FlashcardSearchParams): Promise<Flashcard[]> {
    return flashcardDB.searchFlashcards(params);
  }

  /**
   * 切换收藏状态
   */
  async toggleFavorite(id: string): Promise<Flashcard> {
    const flashcard = await flashcardDB.getFlashcard(id);
    if (!flashcard) {
      throw new Error(`Flashcard not found: ${id}`);
    }

    const updated: Flashcard = {
      ...flashcard,
      favorite: !flashcard.favorite,
      updatedAt: Date.now(),
    };

    await flashcardDB.updateFlashcard(updated);
    return updated;
  }

  /**
   * 移动到分组
   */
  async moveToGroup(id: string, groupId: string): Promise<Flashcard> {
    return this.update(id, { groupId });
  }

  /**
   * 批量移动到分组
   */
  async batchMoveToGroup(ids: string[], groupId: string): Promise<void> {
    const flashcards = await Promise.all(ids.map(id => flashcardDB.getFlashcard(id)));
    const oldGroupIds = new Set(flashcards.filter(f => f).map(f => f!.groupId));

    for (const id of ids) {
      await this.update(id, { groupId });
    }

    // 更新所有涉及的分组
    for (const oldGroupId of oldGroupIds) {
      await this.updateGroupCardCount(oldGroupId);
    }
    await this.updateGroupCardCount(groupId);
  }

  /**
   * 添加标签
   */
  async addTag(id: string, tag: string): Promise<Flashcard> {
    const flashcard = await flashcardDB.getFlashcard(id);
    if (!flashcard) {
      throw new Error(`Flashcard not found: ${id}`);
    }

    if (flashcard.tags.includes(tag)) {
      return flashcard;
    }

    const updated: Flashcard = {
      ...flashcard,
      tags: [...flashcard.tags, tag],
      updatedAt: Date.now(),
    };

    await flashcardDB.updateFlashcard(updated);
    return updated;
  }

  /**
   * 移除标签
   */
  async removeTag(id: string, tag: string): Promise<Flashcard> {
    const flashcard = await flashcardDB.getFlashcard(id);
    if (!flashcard) {
      throw new Error(`Flashcard not found: ${id}`);
    }

    const updated: Flashcard = {
      ...flashcard,
      tags: flashcard.tags.filter(t => t !== tag),
      updatedAt: Date.now(),
    };

    await flashcardDB.updateFlashcard(updated);
    return updated;
  }

  /**
   * 获取所有标签（去重）
   */
  async getAllTags(): Promise<string[]> {
    const flashcards = await flashcardDB.getAllFlashcards();
    const tagsSet = new Set<string>();

    flashcards.forEach(card => {
      card.tags.forEach(tag => tagsSet.add(tag));
    });

    return Array.from(tagsSet).sort();
  }

  // ==================== 分组管理 ====================

  /**
   * 创建分组
   */
  async createGroup(
    name: string,
    options?: { description?: string; color?: string; icon?: string }
  ): Promise<FlashcardGroup> {
    const now = Date.now();

    const group: FlashcardGroup = {
      id: uuidv4(),
      name,
      description: options?.description,
      color: options?.color,
      icon: options?.icon,
      cardCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await flashcardDB.addGroup(group);
    return group;
  }

  /**
   * 更新分组
   */
  async updateGroup(
    id: string,
    params: Partial<Omit<FlashcardGroup, 'id' | 'cardCount' | 'createdAt' | 'updatedAt'>>
  ): Promise<FlashcardGroup> {
    const group = await flashcardDB.getGroup(id);
    if (!group) {
      throw new Error(`Group not found: ${id}`);
    }

    const updated: FlashcardGroup = {
      ...group,
      ...params,
      updatedAt: Date.now(),
    };

    await flashcardDB.updateGroup(updated);
    return updated;
  }

  /**
   * 删除分组（会将分组内的卡片移到默认分组）
   */
  async deleteGroup(id: string): Promise<void> {
    if (id === 'default') {
      throw new Error('Cannot delete default group');
    }

    const cardsInGroup = await flashcardDB.getFlashcardsByGroup(id);

    // 将卡片移到默认分组
    for (const card of cardsInGroup) {
      await this.update(card.id, { groupId: 'default' });
    }

    await flashcardDB.deleteGroup(id);
  }

  /**
   * 获取分组
   */
  async getGroup(id: string): Promise<FlashcardGroup | null> {
    return flashcardDB.getGroup(id);
  }

  /**
   * 获取所有分组
   */
  async getAllGroups(): Promise<FlashcardGroup[]> {
    return flashcardDB.getAllGroups();
  }

  /**
   * 更新分组的卡片计数
   */
  private async updateGroupCardCount(groupId: string): Promise<void> {
    const group = await flashcardDB.getGroup(groupId);
    if (!group) {
      return;
    }

    const cards = await flashcardDB.getFlashcardsByGroup(groupId);

    const updated: FlashcardGroup = {
      ...group,
      cardCount: cards.length,
      updatedAt: Date.now(),
    };

    await flashcardDB.updateGroup(updated);
  }

  /**
   * 确保默认分组存在
   */
  async ensureDefaultGroup(): Promise<void> {
    const defaultGroup = await flashcardDB.getGroup('default');

    if (!defaultGroup) {
      const now = Date.now();
      const group: FlashcardGroup = {
        id: 'default',
        name: '默认分组',
        description: '默认的卡片分组',
        cardCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      await flashcardDB.addGroup(group);
    }
  }

  // ==================== 统计查询 ====================

  /**
   * 按熟练度获取卡片数量
   */
  async getCardCountByProficiency(): Promise<Record<ProficiencyLevel, number>> {
    const flashcards = await flashcardDB.getAllFlashcards();

    const counts: Record<ProficiencyLevel, number> = {
      new: 0,
      learning: 0,
      review: 0,
      mastered: 0,
    };

    flashcards.forEach(card => {
      counts[card.proficiency]++;
    });

    return counts;
  }

  /**
   * 获取今日到期的卡片
   */
  async getDueCards(): Promise<Flashcard[]> {
    return flashcardDB.getDueFlashcards();
  }

  /**
   * 获取今日到期数量
   */
  async getDueCount(): Promise<number> {
    const dueCards = await this.getDueCards();
    return dueCards.length;
  }

  /**
   * 按分组获取卡片
   */
  async getCardsByGroup(groupId: string): Promise<Flashcard[]> {
    return flashcardDB.getFlashcardsByGroup(groupId);
  }

  /**
   * 检查卡片是否存在（避免重复收藏）
   * 使用完全匹配（区分大小写）
   */
  async exists(word: string, sourceLanguage: string, targetLanguage: string): Promise<boolean> {
    const allCards = await flashcardDB.getAllFlashcards();
    return allCards.some(
      card =>
        card.word === word &&
        card.sourceLanguage === sourceLanguage &&
        card.targetLanguage === targetLanguage
    );
  }

  /**
   * 导出所有 Flashcards（JSON 格式）
   */
  async exportAll(): Promise<string> {
    const flashcards = await flashcardDB.getAllFlashcards();
    const groups = await flashcardDB.getAllGroups();

    const exportData = {
      version: 1,
      exportedAt: Date.now(),
      flashcards,
      groups,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 导入 Flashcards（JSON 格式）
   */
  async importFromJSON(jsonStr: string): Promise<{ flashcards: number; groups: number }> {
    try {
      const importData = JSON.parse(jsonStr);

      if (!importData.flashcards || !Array.isArray(importData.flashcards)) {
        throw new Error('Invalid import data format');
      }

      // 导入分组
      let groupsCount = 0;
      if (importData.groups && Array.isArray(importData.groups)) {
        for (const group of importData.groups) {
          const exists = await flashcardDB.getGroup(group.id);
          if (!exists) {
            await flashcardDB.addGroup(group);
            groupsCount++;
          }
        }
      }

      // 导入卡片
      let flashcardsCount = 0;
      for (const flashcard of importData.flashcards) {
        const exists = await flashcardDB.getFlashcard(flashcard.id);
        if (!exists) {
          await flashcardDB.addFlashcard(flashcard);
          flashcardsCount++;
        }
      }

      return {
        flashcards: flashcardsCount,
        groups: groupsCount,
      };
    } catch (error) {
      console.error('Import error:', error);
      throw new Error('导入失败: ' + (error as Error).message);
    }
  }

  /**
   * 清空所有数据
   */
  async clearAll(): Promise<void> {
    await flashcardDB.clearAll();
    await this.ensureDefaultGroup();
  }
}

/**
 * 单例实例
 */
export const flashcardService = new FlashcardService();
