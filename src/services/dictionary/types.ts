// 词典服务类型定义

// ============ Microsoft Translator Dictionary API 类型 ============

// Microsoft Dictionary Lookup 请求参数
export interface MSDictionaryLookupParams {
  text: string;
  from: string; // 语言代码，如 'en'
  to: string;   // 语言代码，如 'zh-Hans'
}

// Microsoft Dictionary Lookup 反向翻译
export interface MSBackTranslation {
  normalizedText: string;
  displayText: string;
  numExamples: number;      // 可用例句数量
  frequencyCount: number;   // 在语料库中的频率
}

// Microsoft Dictionary Lookup 翻译项
export interface MSTranslation {
  normalizedTarget: string;  // 规范化的目标文本
  displayTarget: string;     // 显示用的目标文本
  posTag: string;            // 词性标签：NOUN, VERB, ADJ, ADV, etc.
  confidence: number;        // 置信度 0.0-1.0
  prefixWord?: string;       // 性别决定符（如西班牙语）
  backTranslations: MSBackTranslation[];
}

// Microsoft Dictionary Lookup 响应
export interface MSDictionaryLookupResponse {
  normalizedSource: string;
  displaySource: string;
  translations: MSTranslation[];
}

// Microsoft Dictionary Examples 请求参数
export interface MSDictionaryExamplesParams {
  text: string;        // 源语言术语（来自 lookup 的 normalizedSource）
  translation: string; // 目标语言翻译（来自 lookup 的 normalizedTarget）
  from: string;
  to: string;
}

// Microsoft Dictionary Examples 例句项
export interface MSExample {
  sourcePrefix: string;   // 例句前缀
  sourceTerm: string;     // 高亮的源语言术语
  sourceSuffix: string;   // 例句后缀
  targetPrefix: string;   // 目标语言例句前缀
  targetTerm: string;     // 高亮的目标语言术语
  targetSuffix: string;   // 目标语言例句后缀
}

// Microsoft Dictionary Examples 响应
export interface MSDictionaryExamplesResponse {
  normalizedSource: string;
  normalizedTarget: string;
  examples: MSExample[];
}

// ============ Free Dictionary API 类型 ============

// Free Dictionary 音标
export interface FreeDictPhonetic {
  text?: string;       // 音标文本，如 "[laɪt]"
  audio?: string;      // 音频URL
  sourceUrl?: string;
  license?: {
    name: string;
    url: string;
  };
}

// Free Dictionary 定义
export interface FreeDictDefinition {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

// Free Dictionary 词义（按词性）
export interface FreeDictMeaning {
  partOfSpeech: string;  // "noun", "verb", "adjective", etc.
  definitions: FreeDictDefinition[];
  synonyms?: string[];
  antonyms?: string[];
}

// Free Dictionary 响应
export interface FreeDictionaryResponse {
  word: string;
  phonetic?: string;
  phonetics: FreeDictPhonetic[];
  meanings: FreeDictMeaning[];
  license?: {
    name: string;
    url: string;
  };
  sourceUrls?: string[];
}

// ============ 内部词典数据结构 ============

// 词性映射表
export const POS_TAG_MAP: Record<string, string> = {
  'NOUN': '名词',
  'VERB': '动词',
  'ADJ': '形容词',
  'ADV': '副词',
  'PRON': '代词',
  'PREP': '介词',
  'CONJ': '连词',
  'DET': '限定词',
  'MODAL': '情态动词',
  'OTHER': '其他',

  // Free Dictionary API 使用小写
  'noun': '名词',
  'verb': '动词',
  'adjective': '形容词',
  'adverb': '副词',
  'pronoun': '代词',
  'preposition': '介词',
  'conjunction': '连词',
  'determiner': '限定词',
  'interjection': '感叹词',
};

// 例句
export interface DictionaryExample {
  source: string;    // 英文例句（完整）
  target: string;    // 中文例句（完整）
  sourceTerm?: string;  // 高亮的英文术语
  targetTerm?: string;  // 高亮的中文术语
  sourcePrefix?: string;  // 英文例句前缀
  sourceSuffix?: string;  // 英文例句后缀
  targetPrefix?: string;  // 中文例句前缀
  targetSuffix?: string;  // 中文例句后缀
}

// 翻译项（包含定义和例句）
export interface DictionaryTranslationItem {
  text: string;           // 中文翻译
  normalizedText: string; // 规范化文本
  confidence: number;     // 置信度 0-1
  definition?: string;    // 英文定义
  examples?: DictionaryExample[];  // 双语例句
  synonyms?: string[];    // 同义词
  antonyms?: string[];    // 反义词
}

// 词义（按词性分组）
export interface DictionaryMeaning {
  partOfSpeech: string;      // "NOUN", "VERB", "ADJ"
  partOfSpeechCN: string;    // "名词", "动词", "形容词"
  translations: DictionaryTranslationItem[];
}

// 完整词典结果
export interface DictionaryResult {
  word: string;
  phonetic?: string;         // 音标
  audioUrl?: string;         // 发音音频URL
  meanings: DictionaryMeaning[];
}
