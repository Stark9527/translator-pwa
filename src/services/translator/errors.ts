// 翻译服务相关错误定义

/**
 * 翻译错误基类
 */
export class TranslationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'TranslationError';
  }
}

/**
 * 网络请求错误
 */
export class NetworkError extends TranslationError {
  constructor(message: string, details?: unknown) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

/**
 * API 错误
 */
export class ApiError extends TranslationError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    details?: unknown
  ) {
    super(message, 'API_ERROR', details);
    this.name = 'ApiError';
  }
}

/**
 * 参数验证错误
 */
export class ValidationError extends TranslationError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * 超时错误
 */
export class TimeoutError extends TranslationError {
  constructor(message = '请求超时', details?: unknown) {
    super(message, 'TIMEOUT_ERROR', details);
    this.name = 'TimeoutError';
  }
}

/**
 * 不支持的语言错误
 */
export class UnsupportedLanguageError extends TranslationError {
  constructor(language: string) {
    super(`不支持的语言: ${language}`, 'UNSUPPORTED_LANGUAGE', { language });
    this.name = 'UnsupportedLanguageError';
  }
}

/**
 * 翻译结果为空错误
 */
export class EmptyResultError extends TranslationError {
  constructor(message = '翻译结果为空') {
    super(message, 'EMPTY_RESULT');
    this.name = 'EmptyResultError';
  }
}
