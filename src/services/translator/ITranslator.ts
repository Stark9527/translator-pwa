// 翻译引擎抽象接口
import type { TranslateParams, TranslateResult } from '@/types';

/**
 * 翻译引擎接口
 * 所有翻译服务必须实现此接口
 */
export interface ITranslator {
  /**
   * 翻译文本
   * @param params 翻译参数
   * @returns 翻译结果
   */
  translate(params: TranslateParams): Promise<TranslateResult>;

  /**
   * 检测文本语言
   * @param text 待检测文本
   * @returns 语言代码
   */
  detectLanguage(text: string): Promise<string>;

  /**
   * 获取支持的语言列表
   * @returns 语言代码数组
   */
  getSupportedLanguages(): string[];

  /**
   * 检查服务是否可用
   * @returns 是否可用
   */
  isAvailable(): Promise<boolean>;
}
