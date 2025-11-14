// 全局类型定义

// 翻译引擎类型
export type TranslationEngine = 'google' | 'deepl' | 'openai';

// 语言代码类型
export type LanguageCode = 'auto' | 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'ru' | 'it';

// 翻译请求参数
export interface TranslateParams {
  text: string;
  from: LanguageCode;
  to: LanguageCode;
}

// 词典例句
export interface DictionaryExample {
  source: string;         // 英文例句（完整）
  target: string;         // 中文例句（完整）
  sourceTerm?: string;    // 高亮的英文术语
  targetTerm?: string;    // 高亮的中文术语
  sourcePrefix?: string;  // 英文例句前缀
  sourceSuffix?: string;  // 英文例句后缀
  targetPrefix?: string;  // 中文例句前缀
  targetSuffix?: string;  // 中文例句后缀
}

// 词典翻译项
export interface DictionaryTranslationItem {
  text: string;           // 中文翻译
  confidence: number;     // 置信度 0-1
  definition?: string;    // 英文定义
  examples?: DictionaryExample[];  // 双语例句
}

// 词典词义（按词性分组）
export interface DictionaryMeaning {
  partOfSpeech: string;      // "NOUN", "VERB", "ADJ"
  partOfSpeechCN: string;    // "名词", "动词", "形容词"
  translations: DictionaryTranslationItem[];
}

// 翻译结果
export interface TranslateResult {
  text: string;           // 原文
  translation: string;    // 译文（主要翻译）
  from: LanguageCode;     // 源语言
  to: LanguageCode;       // 目标语言
  engine: TranslationEngine; // 使用的引擎
  pronunciation?: string; // 发音（保留兼容性）
  examples?: string[];    // 例句（保留兼容性）
  alternatives?: string[]; // 备选翻译（保留兼容性）

  // 词典功能扩展字段
  phonetic?: string;      // 音标，如 "[laɪt]"
  audioUrl?: string;      // 发音音频URL
  meanings?: DictionaryMeaning[];  // 词典词义（多词性、多释义）
}

// 用户配置
export interface UserConfig {
  engine: TranslationEngine;
  defaultSourceLang: LanguageCode;
  defaultTargetLang: LanguageCode;
  googleApiKey?: string;
  deeplApiKey?: string;
  deeplPro?: boolean;
  microsoftApiKey?: string;    // Microsoft Translator API Key
  microsoftRegion?: string;    // Microsoft Azure 区域（如 global）
  enableDictionary?: boolean;  // 是否启用词典功能（默认 true）
  theme?: 'light' | 'dark' | 'auto';
  enableShortcut?: boolean;
  enableHistory?: boolean;
  defaultFlashcardGroupId?: string;  // 默认的 Flashcard 分组 ID
}

// 翻译历史记录
export interface TranslationHistory {
  id: string;
  text: string;
  translation: string;
  from: LanguageCode;
  to: LanguageCode;
  engine: TranslationEngine;
  timestamp: number;
  favorite?: boolean;
}

// 导出 Flashcard 相关类型
export * from './flashcard';
