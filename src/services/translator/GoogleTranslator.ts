// Google 翻译服务实现 - 使用官方 Cloud Translation API v2
import type { TranslateParams, TranslateResult, LanguageCode } from '@/types';
import type { ITranslator } from './ITranslator';
import { NetworkError, ApiError, EmptyResultError, TimeoutError } from './errors';
import { validateTranslateParams, normalizeText, retry } from './utils';

/**
 * Google Cloud Translation API v2 响应数据结构
 */
interface GoogleCloudTranslateResponse {
  data: {
    translations: Array<{
      translatedText: string;
      detectedSourceLanguage?: string;
      model?: string;
    }>;
  };
}

/**
 * Google 翻译服务 - 官方 Cloud Translation API v2
 * 使用 Google Cloud Translation API (Basic edition)
 */
export class GoogleTranslator implements ITranslator {
  private readonly baseUrl = 'https://translation.googleapis.com/language/translate/v2';
  private readonly timeout = 10000; // 10秒超时
  private readonly apiKey?: string;

  /**
   * Google 支持的语言代码映射
   */
  private readonly supportedLanguages = [
    'auto', 'zh-CN', 'zh-TW', 'en', 'ja', 'ko',
    'fr', 'de', 'es', 'ru', 'it', 'pt', 'ar',
    'nl', 'pl', 'th', 'vi', 'id', 'tr', 'hi'
  ];

  /**
   * 构造函数
   * @param apiKey Google Cloud Translation API Key
   */
  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * 翻译文本
   */
  async translate(params: TranslateParams): Promise<TranslateResult> {
    const { text, from, to } = params;

    // 检查 API Key
    if (!this.apiKey) {
      throw new ApiError(
        'Google Cloud Translation API Key 未配置。请在设置中添加您的 API Key。',
        401
      );
    }

    // 参数验证
    validateTranslateParams(text, from, to, this.supportedLanguages);

    // 文本标准化
    const normalizedText = normalizeText(text);

    // 使用重试机制执行翻译
    return retry(
      async () => {
        try {
          // 构建请求 URL（API Key 作为查询参数）
          const url = `${this.baseUrl}?key=${encodeURIComponent(this.apiKey!)}`;

          // 构建请求体
          const requestBody = {
            q: normalizedText,
            target: this.normalizeLanguageCode(to),
            format: 'text',
            // 只在非 auto 时添加 source 参数
            ...(from !== 'auto' && { source: this.normalizeLanguageCode(from) })
          };

          // 发送 POST 请求
          const response = await this.fetchWithTimeout(url, requestBody, this.timeout);

          if (!response.ok) {
            const errorText = await response.text();
            throw new ApiError(
              `Google Cloud Translation API 请求失败: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`,
              response.status
            );
          }

          const data: GoogleCloudTranslateResponse = await response.json();

          // 解析翻译结果
          return this.parseTranslateResponse(data, normalizedText, from, to);
        } catch (error) {
          // 转换错误类型
          if (error instanceof ApiError || error instanceof EmptyResultError) {
            throw error;
          }

          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              throw new TimeoutError();
            }

            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
              throw new NetworkError('网络连接失败，请检查网络设置', error);
            }
          }

          throw new NetworkError('Google 翻译服务请求失败', error);
        }
      },
      {
        maxRetries: 2,
        delay: 1000,
        // 只重试网络错误和 5xx 错误
        shouldRetry: (error) => {
          if (error instanceof NetworkError) return true;
          if (error instanceof ApiError && error.statusCode && error.statusCode >= 500) return true;
          return false;
        }
      }
    );
  }

  /**
   * 检测文本语言
   */
  async detectLanguage(text: string): Promise<string> {
    if (!text || text.trim().length === 0) {
      return 'auto';
    }

    if (!this.apiKey) {
      console.warn('Google API Key not configured, returning auto');
      return 'auto';
    }

    try {
      // 使用翻译接口进行语言检测（source 设为 auto）
      const url = `${this.baseUrl}?key=${encodeURIComponent(this.apiKey)}`;

      const requestBody = {
        q: text,
        target: 'en', // 目标语言任意
        format: 'text'
      };

      const response = await this.fetchWithTimeout(url, requestBody, this.timeout);

      if (!response.ok) {
        throw new Error('语言检测失败');
      }

      const data: GoogleCloudTranslateResponse = await response.json();

      // 返回检测到的源语言
      return data.data.translations[0]?.detectedSourceLanguage || 'auto';
    } catch (error) {
      console.error('Language detection error:', error);
      return 'auto';
    }
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages(): string[] {
    return [...this.supportedLanguages];
  }

  /**
   * 检查服务是否可用
   */
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const result = await this.translate({
        text: 'Hello',
        from: 'en',
        to: 'zh-CN'
      });
      return result.translation.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * 解析翻译响应
   */
  private parseTranslateResponse(
    data: GoogleCloudTranslateResponse,
    originalText: string,
    from: LanguageCode,
    to: LanguageCode
  ): TranslateResult {
    // 提取翻译文本
    const translation = data.data.translations[0]?.translatedText?.trim() || '';

    if (!translation) {
      throw new EmptyResultError('翻译结果为空');
    }

    // 检测到的源语言（如果 source 是 auto）
    const detectedLang = data.data.translations[0]?.detectedSourceLanguage || from;

    return {
      text: originalText,
      translation,
      from: detectedLang as LanguageCode,
      to,
      engine: 'google'
    };
  }

  /**
   * 标准化语言代码
   * 将我们的语言代码转换为 Google 支持的格式
   */
  private normalizeLanguageCode(code: LanguageCode): string {
    const mapping: Record<string, string> = {
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW',
      'en': 'en',
      'ja': 'ja',
      'ko': 'ko',
      'fr': 'fr',
      'de': 'de',
      'es': 'es',
      'ru': 'ru',
      'it': 'it',
      'auto': 'auto'
    };

    return mapping[code] || code;
  }

  /**
   * 带超时的 fetch POST 请求
   */
  private async fetchWithTimeout(
    url: string,
    body: Record<string, unknown>,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: JSON.stringify(body)
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error; // 让上层处理错误转换
    }
  }
}
