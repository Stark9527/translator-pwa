// Flashcard IndexedDB 数据库服务
import type {
  Flashcard,
  FlashcardGroup,
  FlashcardSearchParams,
  ReviewRecord,
  DailyStats,
} from '@/types/flashcard';

/**
 * Flashcard IndexedDB 数据库服务
 * 提供持久化的 Flashcard 存储，支持高效查询和统计
 */
export class FlashcardDB {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'FlashcardDB';
  private readonly version = 2;
  private initPromise: Promise<void> | null = null;

  // ObjectStore 名称
  private readonly STORES = {
    flashcards: 'flashcards',
    groups: 'groups',
    reviews: 'reviews',
    dailyStats: 'dailyStats',
  };

  constructor() {
    this.initPromise = this.init();
  }

  /**
   * 初始化 IndexedDB
   */
  private async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('FlashcardDB open error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.info('FlashcardDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const oldVersion = event.oldVersion;

        // 创建 flashcards 存储
        if (!db.objectStoreNames.contains(this.STORES.flashcards)) {
          const flashcardStore = db.createObjectStore(this.STORES.flashcards, {
            keyPath: 'id',
          });

          // 创建索引
          flashcardStore.createIndex('groupId', 'groupId', { unique: false });
          flashcardStore.createIndex('proficiency', 'proficiency', { unique: false });
          flashcardStore.createIndex('nextReview', 'nextReview', { unique: false });
          flashcardStore.createIndex('createdAt', 'createdAt', { unique: false });
          flashcardStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          flashcardStore.createIndex('favorite', 'favorite', { unique: false });
          flashcardStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }

        // 创建 groups 存储
        if (!db.objectStoreNames.contains(this.STORES.groups)) {
          const groupStore = db.createObjectStore(this.STORES.groups, {
            keyPath: 'id',
          });
          groupStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 创建 reviews 存储（复习记录）
        if (!db.objectStoreNames.contains(this.STORES.reviews)) {
          const reviewStore = db.createObjectStore(this.STORES.reviews, {
            autoIncrement: true,
          });
          reviewStore.createIndex('flashcardId', 'flashcardId', { unique: false });
          reviewStore.createIndex('review', 'review', { unique: false });
        }

        // 创建 dailyStats 存储（每日统计）
        if (!db.objectStoreNames.contains(this.STORES.dailyStats)) {
          db.createObjectStore(this.STORES.dailyStats, {
            keyPath: 'date',
          });
        }

        // 版本 1 -> 2：迁移 dailyStats 数据结构
        if (oldVersion < 2 && db.objectStoreNames.contains(this.STORES.dailyStats)) {
          const dailyStatsStore = transaction.objectStore(this.STORES.dailyStats);
          const getAllRequest = dailyStatsStore.getAll();

          getAllRequest.onsuccess = () => {
            const allStats = getAllRequest.result;
            console.info(`Migrating ${allStats.length} dailyStats records to v2...`);

            allStats.forEach((stats: any) => {
              // 添加新字段
              const updatedStats = {
                ...stats,
                masteredCards: 0,
                totalAnswers: stats.reviewedCards || 0,
                // 重置旧的计数器，因为旧逻辑是答题次数，新逻辑是去重的卡片数
                newCards: 0,
                reviewedCards: 0,
                studiedCardIds: [],
                newCardIds: [],
                masteredCardIds: [],
              };

              dailyStatsStore.put(updatedStats);
            });

            console.info('DailyStats migration to v2 completed');
          };

          getAllRequest.onerror = () => {
            console.error('Failed to migrate dailyStats:', getAllRequest.error);
          };
        }
      };
    });
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureInitialized(): Promise<void> {
    // 如果正在初始化，等待完成
    if (this.initPromise) {
      await this.initPromise;
    }

    // 如果数据库不存在或连接已关闭，重新初始化
    if (!this.db || this.db.name === '' || !this.db.objectStoreNames.length) {
      console.warn('数据库连接无效，正在重新初始化...');
      this.db = null;
      this.initPromise = this.init();
      await this.initPromise;
    }

    if (!this.db) {
      throw new Error('FlashcardDB is not initialized');
    }
  }

  /**
   * 包装数据库操作，自动处理连接错误并重试
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryCount = 1
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const errorMessage = (error as Error).message || '';

      // 检查是否是数据库连接关闭错误
      if (
        errorMessage.includes('connection is closing') ||
        errorMessage.includes('connection was closed') ||
        errorMessage.includes('database connection')
      ) {
        if (retryCount > 0) {
          console.warn('数据库连接错误，正在重新初始化并重试...', errorMessage);
          // 重置数据库连接
          this.db = null;
          await this.ensureInitialized();
          // 重试操作
          return this.executeWithRetry(operation, retryCount - 1);
        }
      }

      // 其他错误或重试次数用尽，直接抛出
      throw error;
    }
  }

  // ==================== Flashcard CRUD ====================

  /**
   * 添加 Flashcard
   */
  async addFlashcard(flashcard: Flashcard): Promise<void> {
    return this.executeWithRetry(async () => {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORES.flashcards], 'readwrite');
        const store = transaction.objectStore(this.STORES.flashcards);
        const request = store.add(flashcard);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * 获取单个 Flashcard
   */
  async getFlashcard(id: string): Promise<Flashcard | null> {
    return this.executeWithRetry(async () => {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORES.flashcards], 'readonly');
        const store = transaction.objectStore(this.STORES.flashcards);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * 更新 Flashcard
   */
  async updateFlashcard(flashcard: Flashcard): Promise<void> {
    return this.executeWithRetry(async () => {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORES.flashcards], 'readwrite');
        const store = transaction.objectStore(this.STORES.flashcards);
        const request = store.put(flashcard);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * 删除 Flashcard
   */
  async deleteFlashcard(id: string): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.flashcards], 'readwrite');
      const store = transaction.objectStore(this.STORES.flashcards);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 批量添加 Flashcards
   */
  async addFlashcards(flashcards: Flashcard[]): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.flashcards], 'readwrite');
      const store = transaction.objectStore(this.STORES.flashcards);

      let completed = 0;
      flashcards.forEach(flashcard => {
        const request = store.add(flashcard);
        request.onsuccess = () => {
          completed++;
          if (completed === flashcards.length) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });

      if (flashcards.length === 0) {
        resolve();
      }
    });
  }

  /**
   * 批量删除 Flashcards
   */
  async deleteFlashcards(ids: string[]): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.flashcards], 'readwrite');
      const store = transaction.objectStore(this.STORES.flashcards);

      let completed = 0;
      ids.forEach(id => {
        const request = store.delete(id);
        request.onsuccess = () => {
          completed++;
          if (completed === ids.length) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });

      if (ids.length === 0) {
        resolve();
      }
    });
  }

  /**
   * 获取所有 Flashcards
   */
  async getAllFlashcards(): Promise<Flashcard[]> {
    return this.executeWithRetry(async () => {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORES.flashcards], 'readonly');
        const store = transaction.objectStore(this.STORES.flashcards);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * 搜索和筛选 Flashcards
   */
  async searchFlashcards(params: FlashcardSearchParams): Promise<Flashcard[]> {
    await this.ensureInitialized();

    let cards = await this.getAllFlashcards();

    // 关键词搜索
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      cards = cards.filter(
        card =>
          card.word.toLowerCase().includes(keyword) ||
          card.translation.toLowerCase().includes(keyword)
      );
    }

    // 按分组筛选
    if (params.groupId) {
      cards = cards.filter(card => card.groupId === params.groupId);
    }

    // 按标签筛选
    if (params.tags && params.tags.length > 0) {
      cards = cards.filter(card =>
        params.tags!.some(tag => card.tags.includes(tag))
      );
    }

    // 按熟练度筛选
    if (params.proficiency && params.proficiency.length > 0) {
      cards = cards.filter(card => params.proficiency!.includes(card.proficiency));
    }

    // 按收藏筛选
    if (params.favorite !== undefined) {
      cards = cards.filter(card => card.favorite === params.favorite);
    }

    // 按源语言筛选
    if (params.sourceLanguage) {
      cards = cards.filter(card => card.sourceLanguage === params.sourceLanguage);
    }

    // 按目标语言筛选
    if (params.targetLanguage) {
      cards = cards.filter(card => card.targetLanguage === params.targetLanguage);
    }

    // 排序
    if (params.sortBy) {
      const sortOrder = params.sortOrder || 'desc';
      cards.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (params.sortBy === 'nextReview') {
          aValue = new Date(a.nextReview).getTime();
          bValue = new Date(b.nextReview).getTime();
        } else if (params.sortBy === 'word') {
          aValue = a.word.toLowerCase();
          bValue = b.word.toLowerCase();
        } else {
          aValue = a[params.sortBy!];
          bValue = b[params.sortBy!];
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    return cards;
  }

  /**
   * 获取今日到期的 Flashcards
   */
  async getDueFlashcards(): Promise<Flashcard[]> {
    await this.ensureInitialized();

    const now = new Date();
    const cards = await this.getAllFlashcards();

    return cards.filter(card => new Date(card.nextReview) <= now);
  }

  /**
   * 按分组获取 Flashcards
   */
  async getFlashcardsByGroup(groupId: string): Promise<Flashcard[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.flashcards], 'readonly');
      const store = transaction.objectStore(this.STORES.flashcards);
      const index = store.index('groupId');
      const request = index.getAll(groupId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== Group CRUD ====================

  /**
   * 添加分组
   */
  async addGroup(group: FlashcardGroup): Promise<void> {
    return this.executeWithRetry(async () => {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORES.groups], 'readwrite');
        const store = transaction.objectStore(this.STORES.groups);
        const request = store.add(group);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * 获取单个分组
   */
  async getGroup(id: string): Promise<FlashcardGroup | null> {
    return this.executeWithRetry(async () => {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORES.groups], 'readonly');
        const store = transaction.objectStore(this.STORES.groups);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * 更新分组
   */
  async updateGroup(group: FlashcardGroup): Promise<void> {
    return this.executeWithRetry(async () => {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORES.groups], 'readwrite');
        const store = transaction.objectStore(this.STORES.groups);
        const request = store.put(group);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * 删除分组
   */
  async deleteGroup(id: string): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.groups], 'readwrite');
      const store = transaction.objectStore(this.STORES.groups);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取所有分组
   */
  async getAllGroups(): Promise<FlashcardGroup[]> {
    return this.executeWithRetry(async () => {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORES.groups], 'readonly');
        const store = transaction.objectStore(this.STORES.groups);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  }

  // ==================== Review Records ====================

  /**
   * 添加复习记录
   */
  async addReviewRecord(record: ReviewRecord): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.reviews], 'readwrite');
      const store = transaction.objectStore(this.STORES.reviews);
      const request = store.add(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取某个卡片的复习记录
   */
  async getReviewRecords(flashcardId: string): Promise<ReviewRecord[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.reviews], 'readonly');
      const store = transaction.objectStore(this.STORES.reviews);
      const index = store.index('flashcardId');
      const request = index.getAll(flashcardId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== Daily Stats ====================

  /**
   * 保存每日统计
   */
  async saveDailyStats(stats: DailyStats): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.dailyStats], 'readwrite');
      const store = transaction.objectStore(this.STORES.dailyStats);
      const request = store.put(stats);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取每日统计
   */
  async getDailyStats(date: string): Promise<DailyStats | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.dailyStats], 'readonly');
      const store = transaction.objectStore(this.STORES.dailyStats);
      const request = store.get(date);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取一段时间内的统计
   */
  async getDailyStatsRange(startDate: string, endDate: string): Promise<DailyStats[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.dailyStats], 'readonly');
      const store = transaction.objectStore(this.STORES.dailyStats);
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = store.getAll(range);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== Utility ====================

  /**
   * 清空所有数据
   */
  async clearAll(): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [
          this.STORES.flashcards,
          this.STORES.groups,
          this.STORES.reviews,
          this.STORES.dailyStats,
        ],
        'readwrite'
      );

      // 清空所有数据库
      transaction.objectStore(this.STORES.flashcards).clear();
      transaction.objectStore(this.STORES.groups).clear();
      transaction.objectStore(this.STORES.reviews).clear();
      transaction.objectStore(this.STORES.dailyStats).clear();

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        console.error('FlashcardDB clear error:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{
    totalCards: number;
    totalGroups: number;
    totalReviews: number;
  }> {
    await this.ensureInitialized();

    const [cards, groups, reviews] = await Promise.all([
      this.getAllFlashcards(),
      this.getAllGroups(),
      new Promise<ReviewRecord[]>((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORES.reviews], 'readonly');
        const store = transaction.objectStore(this.STORES.reviews);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
    ]);

    return {
      totalCards: cards.length,
      totalGroups: groups.length,
      totalReviews: reviews.length,
    };
  }

  /**
   * 清除所有每日统计数据
   */
  async clearDailyStats(): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.dailyStats], 'readwrite');
      const store = transaction.objectStore(this.STORES.dailyStats);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/**
 * 单例实例
 */
export const flashcardDB = new FlashcardDB();
