// 翻译引擎工厂
import type { TranslationEngine, UserConfig } from '@/types';
import type { ITranslator } from './ITranslator';
import { GoogleTranslator } from './GoogleTranslator';
import { DictionaryTranslator } from './DictionaryTranslator';

/**
 * 翻译引擎工厂
 * 根据引擎类型和配置创建相应的翻译实例
 */
export class TranslatorFactory {
  /**
   * 获取翻译引擎实例
   * @param engine 引擎类型
   * @param config 用户配置
   * @returns 翻译器实例
   */
  static getTranslator(engine: TranslationEngine, config: UserConfig): ITranslator {
    // 创建新实例（不再使用单例模式，因为配置可能变化）
    let translator: ITranslator;

    switch (engine) {
      case 'google': {
        // 如果配置了 Microsoft API Key 且启用词典功能，使用智能词典翻译器
        const enableDictionary = config.enableDictionary !== false; // 默认启用
        const hasMicrosoftKey = !!config.microsoftApiKey;

        if (enableDictionary && hasMicrosoftKey && config.googleApiKey) {
          translator = new DictionaryTranslator(
            config.googleApiKey,
            config.microsoftApiKey,
            config.microsoftRegion,
            true
          );
        } else {
          // 否则使用普通的 Google 翻译器
          translator = new GoogleTranslator(config.googleApiKey);
        }
        break;
      }

      case 'deepl':
        // TODO: 实现 DeepL 翻译器
        throw new Error('DeepL 翻译引擎尚未实现');

      case 'openai':
        // TODO: 实现 OpenAI 翻译器
        throw new Error('OpenAI 翻译引擎尚未实现');

      default:
        throw new Error(`不支持的翻译引擎: ${engine}`);
    }

    return translator;
  }

  /**
   * 检查引擎是否可用
   * @param engine 引擎类型
   * @param config 用户配置
   */
  static async checkAvailability(engine: TranslationEngine, config: UserConfig): Promise<boolean> {
    try {
      const translator = this.getTranslator(engine, config);
      return await translator.isAvailable();
    } catch {
      return false;
    }
  }
}
