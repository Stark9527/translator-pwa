# 翻译服务模块

> 提供多引擎翻译能力的服务层,支持 Google Translate、DeepL 等翻译引擎

## 📁 目录结构

```
translator/
├── ITranslator.ts          # 翻译引擎抽象接口
├── GoogleTranslator.ts     # Google 翻译实现
├── TranslatorFactory.ts    # 翻译引擎工厂
├── errors.ts               # 错误类定义
├── utils.ts                # 工具函数
├── index.ts                # 统一导出
└── README.md               # 本文档
```

## 🚀 快速开始

### 基本使用

```typescript
import { TranslatorFactory } from '@/services/translator';

// 获取 Google 翻译实例
const translator = TranslatorFactory.getTranslator('google');

// 翻译文本
const result = await translator.translate({
  text: 'Hello World',
  from: 'en',
  to: 'zh-CN'
});

console.log(result.translation); // "你好世界"
```

### 错误处理

```typescript
import {
  TranslatorFactory,
  NetworkError,
  ValidationError,
  formatErrorMessage
} from '@/services/translator';

try {
  const translator = TranslatorFactory.getTranslator('google');
  const result = await translator.translate({
    text: 'Hello',
    from: 'en',
    to: 'zh-CN'
  });
  console.log(result.translation);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('参数错误:', error.message);
  } else if (error instanceof NetworkError) {
    console.error('网络错误:', error.message);
  } else {
    // 格式化为用户友好的提示
    console.error(formatErrorMessage(error));
  }
}
```

### 语言检测

```typescript
const translator = TranslatorFactory.getTranslator('google');

// 检测文本语言
const lang = await translator.detectLanguage('Hello World');
console.log(lang); // "en"
```

### 智能目标语言

```typescript
import { smartDetectTargetLanguage } from '@/services/translator';

// 自动检测目标语言(中文→英文,其他→中文)
const targetLang = smartDetectTargetLanguage('你好');
console.log(targetLang); // "en"

const targetLang2 = smartDetectTargetLanguage('Hello');
console.log(targetLang2); // "zh-CN"
```

## 📝 API 文档

### ITranslator 接口

所有翻译引擎都实现此接口:

```typescript
interface ITranslator {
  // 翻译文本
  translate(params: TranslateParams): Promise<TranslateResult>;

  // 检测语言
  detectLanguage(text: string): Promise<string>;

  // 获取支持的语言列表
  getSupportedLanguages(): string[];

  // 检查服务是否可用
  isAvailable(): Promise<boolean>;
}
```

### TranslatorFactory 工厂类

```typescript
class TranslatorFactory {
  // 获取翻译引擎实例(单例)
  static getTranslator(engine: TranslationEngine): ITranslator;

  // 清除缓存的实例
  static clearCache(engine?: TranslationEngine): void;

  // 获取已初始化的引擎列表
  static getInitializedEngines(): TranslationEngine[];

  // 检查引擎是否可用
  static checkAvailability(engine: TranslationEngine): Promise<boolean>;
}
```

### GoogleTranslator 类

Google 翻译实现:

- 使用 Google Translate 公开 API
- 自动重试机制(最多 2 次)
- 10 秒请求超时
- 支持 20+ 种语言

## 🛠️ 工具函数

### retry - 重试机制

```typescript
import { retry } from '@/services/translator';

const result = await retry(
  async () => {
    // 可能失败的操作
    return await someAsyncOperation();
  },
  {
    maxRetries: 3,      // 最大重试次数
    delay: 1000,        // 初始延迟(毫秒)
    backoff: 2,         // 退避系数
    shouldRetry: (err) => true  // 自定义重试条件
  }
);
```

### validateTranslateParams - 参数验证

```typescript
import { validateTranslateParams } from '@/services/translator';

// 验证翻译参数
validateTranslateParams(
  'Hello',
  'en',
  'zh-CN',
  ['en', 'zh-CN', 'ja']
);
// 如果参数无效,会抛出 ValidationError
```

### normalizeText - 文本标准化

```typescript
import { normalizeText } from '@/services/translator';

const text = normalizeText('  Hello   World  ');
console.log(text); // "Hello World"
```

### 其他实用函数

```typescript
import {
  isChineseText,     // 判断是否为中文文本
  isEnglishText,     // 判断是否为英文文本
  truncateText,      // 截断长文本
  sleep,             // 延迟函数
  withTimeout        // Promise 超时包装
} from '@/services/translator';
```

## ⚠️ 错误类型

| 错误类型 | 说明 | 错误代码 |
|---------|------|---------|
| `TranslationError` | 翻译错误基类 | - |
| `NetworkError` | 网络连接错误 | `NETWORK_ERROR` |
| `ApiError` | API 请求错误 | `API_ERROR` |
| `ValidationError` | 参数验证错误 | `VALIDATION_ERROR` |
| `TimeoutError` | 请求超时错误 | `TIMEOUT_ERROR` |
| `UnsupportedLanguageError` | 不支持的语言 | `UNSUPPORTED_LANGUAGE` |
| `EmptyResultError` | 翻译结果为空 | `EMPTY_RESULT` |

## 🌍 支持的语言

Google 翻译支持的语言代码:

| 代码 | 语言 | 代码 | 语言 |
|-----|------|-----|------|
| `auto` | 自动检测 | `zh-CN` | 简体中文 |
| `zh-TW` | 繁体中文 | `en` | 英语 |
| `ja` | 日语 | `ko` | 韩语 |
| `fr` | 法语 | `de` | 德语 |
| `es` | 西班牙语 | `ru` | 俄语 |
| `it` | 意大利语 | `pt` | 葡萄牙语 |
| `ar` | 阿拉伯语 | `nl` | 荷兰语 |
| `pl` | 波兰语 | `th` | 泰语 |
| `vi` | 越南语 | `id` | 印尼语 |
| `tr` | 土耳其语 | `hi` | 印地语 |

## 🔧 在 Background Script 中使用

```typescript
// background/index.ts
import { TranslatorFactory, formatErrorMessage } from '@/services/translator';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRANSLATE') {
    const { text, from, to, engine } = message.payload;

    // 获取翻译引擎
    const translator = TranslatorFactory.getTranslator(engine || 'google');

    // 执行翻译
    translator.translate({ text, from, to })
      .then(result => {
        sendResponse({ success: true, data: result });
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: formatErrorMessage(error)
        });
      });

    return true; // 异步响应
  }
});
```

## 🚧 待实现功能

- [ ] DeepL 翻译引擎
- [ ] OpenAI/LLM 翻译引擎
- [ ] 翻译缓存机制
- [ ] 批量翻译支持
- [ ] 翻译质量评分
- [ ] 更多语言支持

## 📖 相关类型定义

```typescript
// 翻译参数
interface TranslateParams {
  text: string;
  from: LanguageCode;
  to: LanguageCode;
}

// 翻译结果
interface TranslateResult {
  text: string;           // 原文
  translation: string;    // 译文
  from: LanguageCode;     // 源语言
  to: LanguageCode;       // 目标语言
  engine: TranslationEngine;  // 使用的引擎
  pronunciation?: string;     // 发音
  examples?: string[];        // 例句
  alternatives?: string[];    // 备选翻译
}

// 语言代码
type LanguageCode = 'auto' | 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko' | ...;

// 翻译引擎类型
type TranslationEngine = 'google' | 'deepl' | 'openai';
```

## 📄 License

MIT
