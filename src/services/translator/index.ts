// 翻译服务统一导出
export type { ITranslator } from './ITranslator';
export { GoogleTranslator } from './GoogleTranslator';
export { TranslatorFactory } from './TranslatorFactory';

// 导出错误类
export {
  TranslationError,
  NetworkError,
  ApiError,
  ValidationError,
  TimeoutError,
  UnsupportedLanguageError,
  EmptyResultError
} from './errors';

// 导出工具函数
export {
  retry,
  sleep,
  withTimeout,
  validateLanguageCode,
  validateTranslateParams,
  normalizeText,
  isChineseText,
  isEnglishText,
  smartDetectTargetLanguage,
  truncateText,
  formatErrorMessage
} from './utils';

export type { RetryOptions } from './utils';
