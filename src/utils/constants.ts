// 常量定义

// 支持的语言列表
export const SUPPORTED_LANGUAGES = [
  { code: 'auto', name: '自动检测' },
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁体中文' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'ru', name: 'Русский' },
  { code: 'it', name: 'Italiano' },
] as const;

// 翻译引擎列表
export const TRANSLATION_ENGINES = [
  {
    id: 'google',
    name: 'Google 翻译',
    description: '免费、支持语言多、无需API Key',
  },
  {
    id: 'deepl',
    name: 'DeepL',
    description: '翻译质量高、需要API Key',
  },
] as const;

// Storage Keys
export const STORAGE_KEYS = {
  CONFIG: 'translator_config',
  HISTORY: 'translator_history',
  FAVORITES: 'translator_favorites',
  CACHE: 'translator_cache',
} as const;

// 默认配置
export const DEFAULT_CONFIG = {
  engine: 'google' as const,
  defaultSourceLang: 'auto' as const,
  defaultTargetLang: 'zh-CN' as const,
  theme: 'auto' as const,
  enableShortcut: true,
  enableHistory: true,
};

// API 端点
export const API_ENDPOINTS = {
  GOOGLE_TRANSLATE: 'https://translate.googleapis.com/translate_a/single',
  DEEPL_FREE: 'https://api-free.deepl.com/v2/translate',
  DEEPL_PRO: 'https://api.deepl.com/v2/translate',
} as const;

// 限制常量
export const LIMITS = {
  MAX_TEXT_LENGTH: 5000,
  MAX_HISTORY_ITEMS: 1000,
  MAX_CACHE_SIZE: 100,
  DEBOUNCE_DELAY: 500,
} as const;
