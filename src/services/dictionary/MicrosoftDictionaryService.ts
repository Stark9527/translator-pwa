// Microsoft Translator Dictionary API 服务实现
import {
  MSDictionaryLookupParams,
  MSDictionaryLookupResponse,
  MSDictionaryExamplesParams,
  MSDictionaryExamplesResponse,
  MSTranslation,
} from './types';
import { ApiError, NetworkError, TimeoutError } from '../translator/errors';
import { retry } from '../translator/utils';

/**
 * Microsoft Translator Dictionary Service
 * 提供词典查询和例句获取功能
 */
export class MicrosoftDictionaryService {
  private readonly baseUrl = 'https://api.cognitive.microsofttranslator.com';
  private readonly timeout = 10000; // 10秒超时
  private readonly apiKey: string;
  private readonly region?: string;

  // 置信度阈值：只过滤掉置信度极低的噪音翻译（< 5%）
  private readonly confidenceThreshold = 0.05;

  /**
   * 构造函数
   * @param apiKey Microsoft Translator API Key
   * @param region Azure 资源区域（可选，默认 global）
   */
  constructor(apiKey: string, region?: string) {
    this.apiKey = apiKey;
    this.region = region || 'global';
  }

  /**
   * 词典查询：获取单词的多个翻译（按词性分类）
   */
  async lookup(params: MSDictionaryLookupParams): Promise<MSDictionaryLookupResponse> {
    const { text, from, to } = params;

    if (!text || text.trim().length === 0) {
      throw new Error('查询文本不能为空');
    }

    // 使用重试机制
    return retry(
      async () => {
        try {
          const url = `${this.baseUrl}/dictionary/lookup?api-version=3.0&from=${from}&to=${to}`;

          const response = await this.fetchWithTimeout(
            url,
            [{ Text: text }],
            this.timeout
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new ApiError(
              `Microsoft Dictionary Lookup 失败: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`,
              response.status
            );
          }

          const data: MSDictionaryLookupResponse[] = await response.json();


          if (!data || data.length === 0) {
            throw new Error('词典查询结果为空');
          }

          // 过滤低置信度的翻译
          const result = data[0];
          result.translations = this.filterLowConfidenceTranslations(result.translations);

          return result;
        } catch (error) {
          if (error instanceof ApiError) {
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

          throw new NetworkError('Microsoft Dictionary 查询失败', error);
        }
      },
      {
        maxRetries: 2,
        delay: 1000,
        shouldRetry: (error) => {
          if (error instanceof NetworkError) return true;
          if (error instanceof ApiError && error.statusCode && error.statusCode >= 500) return true;
          return false;
        }
      }
    );
  }

  /**
   * 获取例句：获取特定翻译对的双语例句
   */
  async getExamples(params: MSDictionaryExamplesParams): Promise<MSDictionaryExamplesResponse> {
    const { text, translation, from, to } = params;

    if (!text || !translation) {
      throw new Error('查询文本和翻译不能为空');
    }

    return retry(
      async () => {
        try {
          const url = `${this.baseUrl}/dictionary/examples?api-version=3.0&from=${from}&to=${to}`;

          const response = await this.fetchWithTimeout(
            url,
            [{ Text: text, Translation: translation }],
            this.timeout
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new ApiError(
              `Microsoft Dictionary Examples 失败: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`,
              response.status
            );
          }

          const data: MSDictionaryExamplesResponse[] = await response.json();

          if (!data || data.length === 0) {
            // 例句不是必须的，返回空结果而不是抛出错误
            return {
              normalizedSource: text,
              normalizedTarget: translation,
              examples: []
            };
          }

          return data[0];
        } catch (error) {
          // 例句查询失败不应阻止整体流程，返回空结果
          console.warn('Microsoft Dictionary Examples 查询失败:', error);
          return {
            normalizedSource: text,
            normalizedTarget: translation,
            examples: []
          };
        }
      },
      {
        maxRetries: 1,
        delay: 500,
        shouldRetry: (error) => {
          if (error instanceof NetworkError) return true;
          return false;
        }
      }
    );
  }

  /**
   * 批量获取例句：为每个翻译获取例句
   * 优化：只为置信度最高的翻译获取例句（按词性分组）
   */
  async getExamplesForTopTranslations(
    word: string,
    translations: MSTranslation[],
    from: string,
    to: string
  ): Promise<Map<string, MSDictionaryExamplesResponse>> {
    // 按词性分组
    const groupedByPOS = new Map<string, MSTranslation[]>();
    for (const trans of translations) {
      const existing = groupedByPOS.get(trans.posTag) || [];
      existing.push(trans);
      groupedByPOS.set(trans.posTag, existing);
    }

    // 获取每个词性中置信度最高的翻译
    const topTranslations: MSTranslation[] = [];
    for (const [_, group] of groupedByPOS) {
      const sorted = group.sort((a, b) => b.confidence - a.confidence);
      topTranslations.push(sorted[0]);
    }

    // 并行获取例句
    const examplesPromises = topTranslations.map(trans =>
      this.getExamples({
        text: word,
        translation: trans.normalizedTarget,
        from,
        to
      })
    );

    const results = await Promise.allSettled(examplesPromises);

    // 构建结果映射（normalizedTarget -> Examples）
    // 只保留每个翻译的第一个示例，减少数据量
    const examplesMap = new Map<string, MSDictionaryExamplesResponse>();
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const normalizedTarget = topTranslations[index].normalizedTarget;
        const examplesResponse = result.value;

        // 只保留第一个示例
        if (examplesResponse.examples.length > 0) {
          examplesMap.set(normalizedTarget, {
            ...examplesResponse,
            examples: [examplesResponse.examples[0]]
          });
        } else {
          examplesMap.set(normalizedTarget, examplesResponse);
        }
      }
    });

    return examplesMap;
  }

  /**
   * 过滤低置信度的翻译
   * 策略：保留所有翻译（Microsoft API 返回的翻译都是有价值的）
   * 只过滤掉置信度极低的噪音翻译
   */
  private filterLowConfidenceTranslations(translations: MSTranslation[]): MSTranslation[] {
    // 只过滤掉置信度极低的噪音翻译
    // Microsoft API 返回的大部分翻译都是有价值的，即使置信度较低
    return translations.filter(trans => trans.confidence >= this.confidenceThreshold);
  }

  /**
   * 带超时的 fetch 请求
   */
  private async fetchWithTimeout(
    url: string,
    body: unknown[],
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
          'Ocp-Apim-Subscription-Region': this.region!,
          'Content-Type': 'application/json; charset=utf-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: JSON.stringify(body)
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}
