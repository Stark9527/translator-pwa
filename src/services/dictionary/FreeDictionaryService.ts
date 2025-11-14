// Free Dictionary API 服务实现
// API: https://dictionaryapi.dev/
import { FreeDictionaryResponse } from './types';
import { NetworkError, TimeoutError } from '../translator/errors';

/**
 * Free Dictionary Service
 * 提供音标、发音和英文定义查询功能
 */
export class FreeDictionaryService {
  private readonly baseUrl = 'https://api.dictionaryapi.dev/api/v2/entries';
  private readonly timeout = 10000; // 10秒超时

  /**
   * 查询单词
   * @param word 英文单词
   * @param language 语言代码，默认 'en'
   */
  async lookup(word: string, language = 'en'): Promise<FreeDictionaryResponse | null> {
    if (!word || word.trim().length === 0) {
      throw new Error('查询单词不能为空');
    }

    try {
      const url = `${this.baseUrl}/${language}/${encodeURIComponent(word.trim().toLowerCase())}`;
      const response = await this.fetchWithTimeout(url, this.timeout);

      // 404 表示单词不在词典中，这是正常情况
      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Free Dictionary API 请求失败: ${response.statusText}`);
      }

      const data: FreeDictionaryResponse[] = await response.json();

      if (!data || data.length === 0) {
        return null;
      }

      return data[0];
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new TimeoutError();
        }

        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new NetworkError('网络连接失败，请检查网络设置', error);
        }
      }

      // 对于 Free Dictionary 的错误，我们不抛出异常，而是返回 null
      // 因为这个 API 是辅助性的，失败不应阻止整体流程
      console.warn('Free Dictionary lookup 失败:', error);
      return null;
    }
  }

  /**
   * 提取音标
   */
  extractPhonetic(response: FreeDictionaryResponse): string | undefined {
    // 优先使用顶级的 phonetic 字段
    if (response.phonetic) {
      return response.phonetic;
    }

    // 否则从 phonetics 数组中查找
    if (response.phonetics && response.phonetics.length > 0) {
      // 优先使用有音频的音标
      const phoneticWithAudio = response.phonetics.find(p => p.text && p.audio);
      if (phoneticWithAudio?.text) {
        return phoneticWithAudio.text;
      }

      // 否则返回第一个有文本的音标
      const phoneticWithText = response.phonetics.find(p => p.text);
      if (phoneticWithText?.text) {
        return phoneticWithText.text;
      }
    }

    return undefined;
  }

  /**
   * 提取音频 URL
   */
  extractAudioUrl(response: FreeDictionaryResponse): string | undefined {
    if (!response.phonetics || response.phonetics.length === 0) {
      return undefined;
    }

    // 查找第一个有音频的发音
    const phoneticWithAudio = response.phonetics.find(p => p.audio);
    return phoneticWithAudio?.audio;
  }

  /**
   * 按词性提取英文定义
   * @param response Free Dictionary 响应
   * @param partOfSpeech 词性（小写，如 "noun", "verb"）
   * @returns 该词性的第一个定义，如果没有则返回 undefined
   */
  extractDefinitionByPOS(response: FreeDictionaryResponse, partOfSpeech: string): string | undefined {
    const meaning = response.meanings?.find(
      m => m.partOfSpeech.toLowerCase() === partOfSpeech.toLowerCase()
    );

    if (meaning && meaning.definitions && meaning.definitions.length > 0) {
      return meaning.definitions[0].definition;
    }

    return undefined;
  }

  /**
   * 获取所有词性的定义（用于匹配）
   */
  extractAllMeanings(response: FreeDictionaryResponse): Map<string, string> {
    const meaningsMap = new Map<string, string>();

    if (!response.meanings) {
      return meaningsMap;
    }

    for (const meaning of response.meanings) {
      if (meaning.definitions && meaning.definitions.length > 0) {
        // 将词性统一为小写
        const pos = meaning.partOfSpeech.toLowerCase();
        const definition = meaning.definitions[0].definition;
        meaningsMap.set(pos, definition);
      }
    }

    return meaningsMap;
  }

  /**
   * 带超时的 fetch GET 请求
   */
  private async fetchWithTimeout(url: string, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}
