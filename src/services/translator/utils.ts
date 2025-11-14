// 翻译服务工具函数
import type { LanguageCode } from '@/types';
import { ValidationError, TimeoutError } from './errors';

/**
 * 重试选项
 */
export interface RetryOptions {
  maxRetries?: number; // 最大重试次数,默认 3
  delay?: number; // 重试延迟(毫秒),默认 1000
  backoff?: number; // 退避系数,默认 2
  shouldRetry?: (error: Error) => boolean; // 是否应该重试的判断函数
}

/**
 * 带重试机制的异步函数执行器
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    shouldRetry = (error: Error) => !(error instanceof ValidationError)
  } = options;

  let lastError: Error;
  let currentDelay = delay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 最后一次尝试失败或不应该重试,直接抛出错误
      if (attempt === maxRetries || !shouldRetry(lastError)) {
        throw lastError;
      }

      // 等待后重试
      console.warn(
        `操作失败,${currentDelay}ms 后进行第 ${attempt + 1}/${maxRetries} 次重试:`,
        lastError.message
      );

      await sleep(currentDelay);
      currentDelay *= backoff;
    }
  }

  throw lastError!;
}

/**
 * 延迟函数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 带超时的 Promise 包装器
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError?: Error
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(timeoutError || new TimeoutError()),
        timeoutMs
      )
    )
  ]);
}

/**
 * 验证语言代码是否有效
 */
export function validateLanguageCode(code: string, supportedCodes: string[]): void {
  if (!supportedCodes.includes(code)) {
    throw new ValidationError(
      `不支持的语言代码: ${code}`,
      { code, supported: supportedCodes }
    );
  }
}

/**
 * 验证翻译参数
 */
export function validateTranslateParams(
  text: string,
  from: LanguageCode,
  to: LanguageCode,
  supportedLanguages: string[]
): void {
  // 检查文本
  if (!text || typeof text !== 'string') {
    throw new ValidationError('翻译文本必须是非空字符串');
  }

  if (text.trim().length === 0) {
    throw new ValidationError('翻译文本不能为空白字符');
  }

  if (text.length > 5000) {
    throw new ValidationError('翻译文本长度不能超过 5000 字符', {
      length: text.length
    });
  }

  // 检查语言代码
  if (from !== 'auto') {
    validateLanguageCode(from, supportedLanguages);
  }

  validateLanguageCode(to, supportedLanguages);

  // 检查源语言和目标语言是否相同(auto 除外)
  if (from !== 'auto' && from === to) {
    throw new ValidationError('源语言和目标语言不能相同');
  }
}

/**
 * 清理和标准化文本
 */
export function normalizeText(text: string): string {
  return text
    .trim()
    // 替换多个连续空格为单个空格
    .replace(/\s+/g, ' ')
    // 移除零宽字符
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
}

/**
 * 检测文本是否主要为中文
 */
export function isChineseText(text: string): boolean {
  const chineseRegex = /[\u4e00-\u9fa5]/g;
  const chineseChars = text.match(chineseRegex);
  const chineseRatio = chineseChars ? chineseChars.length / text.length : 0;
  return chineseRatio > 0.3; // 超过 30% 为中文字符
}

/**
 * 检测文本是否主要为英文
 */
export function isEnglishText(text: string): boolean {
  const englishRegex = /[a-zA-Z]/g;
  const englishChars = text.match(englishRegex);
  const englishRatio = englishChars ? englishChars.length / text.length : 0;
  return englishRatio > 0.5; // 超过 50% 为英文字符
}

/**
 * 智能检测目标语言
 * 如果源文本是中文,返回英文;否则返回中文
 */
export function smartDetectTargetLanguage(text: string): LanguageCode {
  if (isChineseText(text)) {
    return 'en';
  }
  return 'zh-CN';
}

/**
 * 截断长文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

/**
 * 格式化错误消息为用户友好的提示
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    return error.message;
  }

  if (error instanceof TimeoutError) {
    return '翻译请求超时,请检查网络连接';
  }

  if (error instanceof Error) {
    // 移除技术细节
    const message = error.message;

    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return '网络连接失败,请检查网络设置';
    }

    if (message.includes('429') || message.includes('Too Many Requests')) {
      return '请求过于频繁,请稍后再试';
    }

    if (message.includes('503') || message.includes('Service Unavailable')) {
      return '翻译服务暂时不可用,请稍后再试';
    }

    return message;
  }

  return '翻译失败,请稍后重试';
}
