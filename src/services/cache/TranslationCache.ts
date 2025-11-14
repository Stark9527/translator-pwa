// 翻译缓存服务
import type { TranslateResult, LanguageCode, TranslationEngine } from '@/types';

/**
 * 缓存项接口
 */
interface CacheEntry {
  result: TranslateResult;
  timestamp: number;
  expiresAt: number;
}

/**
 * 内存翻译缓存服务
 * 使用 LRU (最近最少使用) 策略
 */
export class TranslationCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly maxSize: number;
  private readonly ttl: number; // 缓存有效期（毫秒）

  /**
   * @param maxSize 最大缓存条目数
   * @param ttl 缓存有效期（毫秒），默认 1 小时
   */
  constructor(maxSize = 1000, ttl = 60 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;

    // 定期清理过期缓存
    this.startCleanupTimer();
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
    // 使用标准化的文本和参数生成唯一键
    const normalizedText = text.trim().toLowerCase();
    return `${engine}:${from}:${to}:${normalizedText}`;
  }

  /**
   * 获取缓存的翻译结果
   */
  get(
    text: string,
    from: LanguageCode,
    to: LanguageCode,
    engine: TranslationEngine
  ): TranslateResult | null {
    const key = this.generateKey(text, from, to, engine);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // LRU: 将访问的项移到最后
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.result;
  }

  /**
   * 设置缓存
   */
  set(
    text: string,
    from: LanguageCode,
    to: LanguageCode,
    engine: TranslationEngine,
    result: TranslateResult
  ): void {
    const key = this.generateKey(text, from, to, engine);

    // 如果缓存已满，删除最旧的项（LRU）
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const entry: CacheEntry = {
      result,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.ttl,
    };

    this.cache.set(key, entry);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * 启动定期清理定时器
   */
  private startCleanupTimer(): void {
    // 每 5 分钟清理一次过期缓存
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    size: number;
    maxSize: number;
    ttl: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
    };
  }
}

/**
 * 单例实例
 */
export const translationCache = new TranslationCache();
