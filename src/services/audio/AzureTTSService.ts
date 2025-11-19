// Azure Text-to-Speech Service
// API: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech
import { NetworkError, TimeoutError } from '../translator/errors';

/**
 * Azure 语音配置
 */
export interface AzureVoiceConfig {
  /** 语音名称，如 'en-US-AriaNeural', 'en-US-JennyNeural' */
  name: string;
  /** 语言代码，如 'en-US' */
  lang: string;
}

/**
 * 预定义的语音配置
 */
export const AZURE_VOICES = {
  /** 美式英语 - Aria (女声) */
  EN_US_ARIA: { name: 'en-US-AriaNeural', lang: 'en-US' },
  /** 美式英语 - Jenny (女声) */
  EN_US_JENNY: { name: 'en-US-JennyNeural', lang: 'en-US' },
  /** 美式英语 - Guy (男声) */
  EN_US_GUY: { name: 'en-US-GuyNeural', lang: 'en-US' },
  /** 英式英语 - Sonia (女声) */
  EN_GB_SONIA: { name: 'en-GB-SoniaNeural', lang: 'en-GB' },
} as const;

/**
 * Azure TTS Service
 * 提供文本转语音功能
 */
export class AzureTTSService {
  private readonly timeout = 15000; // 15秒超时
  private readonly audioFormat = 'audio-24khz-48kbitrate-mono-mp3';

  constructor(
    private apiKey: string,
    private region: string,
    private defaultVoice: AzureVoiceConfig = AZURE_VOICES.EN_US_ARIA
  ) {
    if (!apiKey || !region) {
      throw new Error('Azure API Key 和 Region 不能为空');
    }
  }

  /**
   * 获取 TTS API 端点
   */
  private get endpoint(): string {
    return `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  }

  /**
   * 生成 SSML 格式的请求体
   */
  private generateSSML(text: string, voice?: AzureVoiceConfig): string {
    const voiceConfig = voice || this.defaultVoice;
    return `<speak version='1.0' xml:lang='${voiceConfig.lang}'>
  <voice xml:lang='${voiceConfig.lang}' name='${voiceConfig.name}'>
    ${this.escapeXml(text)}
  </voice>
</speak>`;
  }

  /**
   * XML 转义
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * 将文本转换为语音
   * @param text 要转换的文本
   * @param voice 可选的语音配置，如果不提供则使用默认语音
   * @returns Base64 编码的音频数据（data URI 格式）
   */
  async textToSpeech(text: string, voice?: AzureVoiceConfig): Promise<string> {
    if (!text || text.trim().length === 0) {
      throw new Error('文本不能为空');
    }

    try {
      const ssml = this.generateSSML(text, voice);
      const audioData = await this.fetchAudio(ssml);

      // 将二进制数据转换为 Base64
      const base64Audio = this.arrayBufferToBase64(audioData);

      // 返回 data URI 格式
      return `data:audio/mpeg;base64,${base64Audio}`;
    } catch (error) {
      console.error('Azure TTS 转换失败:', error);
      throw error;
    }
  }

  /**
   * 调用 Azure TTS API 获取音频数据
   */
  private async fetchAudio(ssml: string): Promise<ArrayBuffer> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': this.audioFormat,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: ssml
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Azure TTS API 请求失败 (${response.status}): ${errorText}`);
      }

      const audioData = await response.arrayBuffer();
      return audioData;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new TimeoutError('Azure TTS 请求超时');
        }

        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new NetworkError('网络连接失败，请检查网络设置', error);
        }
      }

      throw error;
    }
  }

  /**
   * 将 ArrayBuffer 转换为 Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;

    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
  }

  /**
   * 批量转换文本为语音（带限速）
   * @param texts 文本数组
   * @param voice 可选的语音配置
   * @param delayMs 每次请求之间的延迟（毫秒），默认 300ms
   * @returns 音频数据数组（data URI 格式）
   */
  async batchTextToSpeech(
    texts: string[],
    voice?: AzureVoiceConfig,
    delayMs = 300
  ): Promise<(string | null)[]> {
    const results: (string | null)[] = [];

    for (let i = 0; i < texts.length; i++) {
      try {
        const audioUrl = await this.textToSpeech(texts[i], voice);
        results.push(audioUrl);
      } catch (error) {
        console.warn(`批量转换失败 [${i}/${texts.length}]: ${texts[i]}`, error);
        results.push(null);
      }

      // 延迟，避免频率限制
      if (i < texts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }
}
