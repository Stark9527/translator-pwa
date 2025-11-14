// IndexedDB 持久化翻译缓存
import type { TranslateResult, LanguageCode, TranslationEngine } from '@/types';

/**
 * IndexedDB 缓存项接口
 */
interface IDBCacheEntry {
  key: string;
  text: string;
  from: LanguageCode;
  to: LanguageCode;
  engine: TranslationEngine;
  result: TranslateResult;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * IndexedDB 翻译缓存服务
 * 提供持久化的翻译缓存，跨浏览器会话保留数据
 */
export class IndexedDBCache {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'TranslatorDB';
  private readonly storeName = 'translations';
  private readonly version = 1;
  private readonly maxSize: number;
  private readonly ttl: number;
  private initPromise: Promise<void> | null = null;

  /**
   * @param maxSize 最大缓存条目数
   * @param ttl 缓存有效期（毫秒），默认 7 天
   */
  constructor(maxSize = 10000, ttl = 7 * 24 * 60 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.initPromise = this.init();
  }

  /**
   * 初始化 IndexedDB
   */
  private async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('IndexedDB open error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();

        // 启动后台清理任务
        this.scheduleCleanup();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建对象存储
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });

          // 创建索引以支持高效查询
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
          store.createIndex('engine', 'engine', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        }
      };
    });
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
    if (!this.db) {
      throw new Error('IndexedDB is not initialized');
    }
  }

  /**
   * 生成缓存键
   */
  private generateKey(
    text: string,
    from: LanguageCode,
    to: LanguageCode,
    engine: TranslationEngine
  ): string {
    const normalizedText = text.trim().toLowerCase();
    return `${engine}:${from}:${to}:${normalizedText}`;
  }

  /**
   * 获取缓存的翻译结果
   */
  async get(
    text: string,
    from: LanguageCode,
    to: LanguageCode,
    engine: TranslationEngine
  ): Promise<TranslateResult | null> {
    try {
      await this.ensureInitialized();

      const key = this.generateKey(text, from, to, engine);
      const entry = await this.getEntry(key);

      if (!entry) {
        return null;
      }

      // 检查是否过期
      if (Date.now() > entry.expiresAt) {
        await this.deleteEntry(key);
        return null;
      }

      // 更新访问统计
      await this.updateAccessStats(entry);

      return entry.result;
    } catch (error) {
      console.error('IndexedDB get error:', error);
      return null;
    }
  }

  /**
   * 设置缓存
   */
  async set(
    text: string,
    from: LanguageCode,
    to: LanguageCode,
    engine: TranslationEngine,
    result: TranslateResult
  ): Promise<void> {
    try {
      await this.ensureInitialized();

      const key = this.generateKey(text, from, to, engine);
      const now = Date.now();

      const entry: IDBCacheEntry = {
        key,
        text: text.trim(),
        from,
        to,
        engine,
        result,
        timestamp: now,
        expiresAt: now + this.ttl,
        accessCount: 0,
        lastAccessed: now,
      };

      // 检查缓存大小，必要时清理
      await this.ensureCapacity();

      // 保存到 IndexedDB
      await this.putEntry(entry);
    } catch (error) {
      console.error('IndexedDB set error:', error);
    }
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    try {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          console.error('IndexedDB clear error:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('IndexedDB clear error:', error);
    }
  }

  /**
   * 获取缓存大小
   */
  async size(): Promise<number> {
    try {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.count();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB size error:', error);
      return 0;
    }
  }

  /**
   * 获取缓存条目
   */
  private async getEntry(key: string): Promise<IDBCacheEntry | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 保存缓存条目
   */
  private async putEntry(entry: IDBCacheEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 删除缓存条目
   */
  private async deleteEntry(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 更新访问统计
   */
  private async updateAccessStats(entry: IDBCacheEntry): Promise<void> {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    await this.putEntry(entry);
  }

  /**
   * 确保缓存容量不超限
   * 使用 LRU 策略删除最少使用的项
   */
  private async ensureCapacity(): Promise<void> {
    const currentSize = await this.size();

    if (currentSize >= this.maxSize) {
      // 获取所有条目并按最后访问时间排序
      const entries = await this.getAllEntries();
      entries.sort((a, b) => a.lastAccessed - b.lastAccessed);

      // 删除最旧的 10% 条目
      const deleteCount = Math.ceil(this.maxSize * 0.1);
      const toDelete = entries.slice(0, deleteCount);

      for (const entry of toDelete) {
        await this.deleteEntry(entry.key);
      }
    }
  }

  /**
   * 获取所有缓存条目
   */
  private async getAllEntries(): Promise<IDBCacheEntry[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 清理过期缓存
   */
  async cleanup(): Promise<void> {
    try {
      await this.ensureInitialized();

      const now = Date.now();
      const entries = await this.getAllEntries();
      const expiredKeys = entries
        .filter(entry => now > entry.expiresAt)
        .map(entry => entry.key);

      for (const key of expiredKeys) {
        await this.deleteEntry(key);
      }
    } catch (error) {
      console.error('IndexedDB cleanup error:', error);
    }
  }

  /**
   * 定期清理任务
   */
  private scheduleCleanup(): void {
    // 每小时清理一次过期缓存
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<{
    size: number;
    maxSize: number;
    ttl: number;
    oldestEntry?: number;
    newestEntry?: number;
  }> {
    try {
      await this.ensureInitialized();

      const entries = await this.getAllEntries();
      const size = entries.length;

      if (size === 0) {
        return { size, maxSize: this.maxSize, ttl: this.ttl };
      }

      const timestamps = entries.map(e => e.timestamp);
      const oldestEntry = Math.min(...timestamps);
      const newestEntry = Math.max(...timestamps);

      return {
        size,
        maxSize: this.maxSize,
        ttl: this.ttl,
        oldestEntry,
        newestEntry,
      };
    } catch (error) {
      console.error('IndexedDB getStats error:', error);
      return { size: 0, maxSize: this.maxSize, ttl: this.ttl };
    }
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
export const indexedDBCache = new IndexedDBCache();
