// 智能词典翻译器 - 结合词典API和翻译API
import type { TranslateParams, TranslateResult, LanguageCode, DictionaryMeaning } from '@/types';
import type { ITranslator } from './ITranslator';
import { GoogleTranslator } from './GoogleTranslator';
import { MicrosoftDictionaryService, FreeDictionaryService, POS_TAG_MAP } from '../dictionary';
import { AzureTTSService, AZURE_VOICES } from '../audio/AzureTTSService';
import { isWord } from '@/utils/textAnalyzer';

/**
 * 词典翻译器
 * 智能判断输入类型：
 * - 英文单词：使用词典API（Microsoft + Free Dictionary + Azure TTS）
 * - 句子/短语/非英文：使用翻译API（Google）
 */
export class DictionaryTranslator implements ITranslator {
  private readonly googleTranslator: GoogleTranslator;
  private readonly microsoftDictService?: MicrosoftDictionaryService;
  private readonly freeDictService: FreeDictionaryService;
  private readonly azureTTSService?: AzureTTSService;
  private readonly enableDictionary: boolean;

  /**
   * 构造函数
   * @param googleApiKey Google Translation API Key
   * @param microsoftApiKey Microsoft Translator API Key（可选）
   * @param microsoftRegion Microsoft Azure 区域（可选）
   * @param enableDictionary 是否启用词典功能（默认 true）
   * @param azureSpeechKey Azure Speech API Key（可选）
   * @param azureSpeechRegion Azure Speech 区域（可选）
   * @param azureVoiceName Azure 语音名称（可选，默认美式英语女声）
   */
  constructor(
    googleApiKey: string,
    microsoftApiKey?: string,
    microsoftRegion?: string,
    enableDictionary = true,
    azureSpeechKey?: string,
    azureSpeechRegion?: string,
    azureVoiceName?: string
  ) {
    this.googleTranslator = new GoogleTranslator(googleApiKey);
    this.freeDictService = new FreeDictionaryService();
    this.enableDictionary = enableDictionary && !!microsoftApiKey;

    if (microsoftApiKey) {
      this.microsoftDictService = new MicrosoftDictionaryService(
        microsoftApiKey,
        microsoftRegion
      );
    }

    // 初始化 Azure TTS 服务
    if (azureSpeechKey && azureSpeechRegion) {
      try {
        const voice = azureVoiceName
          ? { name: azureVoiceName, lang: azureVoiceName.split('-').slice(0, 2).join('-') }
          : AZURE_VOICES.EN_US_ARIA; // 默认美式英语女声

        this.azureTTSService = new AzureTTSService(azureSpeechKey, azureSpeechRegion, voice);
        console.log('[DictionaryTranslator] Azure TTS 服务已初始化:', voice.name);
      } catch (error) {
        console.warn('[DictionaryTranslator] Azure TTS 服务初始化失败:', error);
      }
    }
  }

  /**
   * 翻译文本（智能选择词典或翻译API）
   */
  async translate(params: TranslateParams): Promise<TranslateResult> {
    const { text, from, to } = params;

    // 调试日志：输入参数
    console.log('[DictionaryTranslator] 翻译参数:', { text, from, to });
    console.log('[DictionaryTranslator] 词典功能状态:', {
      enableDictionary: this.enableDictionary,
      hasMicrosoftService: !!this.microsoftDictService,
      isWord: isWord(text),
      isFromEnOrAuto: from === 'en' || from === 'auto',
      isToZhCN: to === 'zh-CN'
    });

    // 判断是否应该使用词典API
    // 条件：启用词典 && 有MS服务 && 是单词 && (源语言是en或auto) && 目标是zh-CN
    const shouldUseDictionary =
      this.enableDictionary &&
      this.microsoftDictService &&
      isWord(text) &&
      (from === 'en' || from === 'auto') &&  // 允许 auto，因为单词通常是英文
      to === 'zh-CN';

    console.log('[DictionaryTranslator] 是否使用词典API:', shouldUseDictionary);

    if (shouldUseDictionary) {
      try {
        console.log('[DictionaryTranslator] 开始调用词典API...');
        // 尝试使用词典API
        const result = await this.dictionaryTranslate(params);
        console.log('[DictionaryTranslator] 词典API返回结果:', {
          hasPhonetic: !!result.phonetic,
          hasMeanings: !!result.meanings,
          meaningsCount: result.meanings?.length || 0
        });
        return result;
      } catch (error) {
        // 词典查询失败，降级到Google翻译
        console.warn('[DictionaryTranslator] 词典查询失败，降级到Google翻译:', error);
        return await this.googleTranslator.translate(params);
      }
    }

    // 使用Google翻译
    console.log('[DictionaryTranslator] 使用普通Google翻译');
    return await this.googleTranslator.translate(params);
  }

  /**
   * 词典翻译：结合 Microsoft Dictionary 和 Free Dictionary
   */
  private async dictionaryTranslate(params: TranslateParams): Promise<TranslateResult> {
    const { text, to } = params;
    let { from } = params;

    // 如果源语言是 auto，对于单词查询，默认视为英文
    if (from === 'auto') {
      from = 'en';
      console.log('[DictionaryTranslator] 源语言从 auto 转换为 en');
    }

    // 并行调用两个词典API
    const [msResult, freeDictResult] = await Promise.allSettled([
      // Microsoft Dictionary Lookup
      this.microsoftDictService!.lookup({
        text: text.trim(),
        from: this.normalizeLanguageCodeForMS(from),
        to: this.normalizeLanguageCodeForMS(to)
      }),

      // Free Dictionary
      this.freeDictService.lookup(text.trim(), 'en')
    ]);

    // 如果 Microsoft Dictionary 失败，降级到 Google 翻译
    if (msResult.status === 'rejected') {
      console.warn('Microsoft Dictionary 查询失败，降级到Google翻译');
      return await this.googleTranslator.translate(params);
    }

    const msLookupResponse = msResult.value;

    // 提取Free Dictionary的音标（仅用于音标，不再用于音频）
    let phonetic: string | undefined;
    let freeDictMeaningsMap: Map<string, string> | undefined;

    if (freeDictResult.status === 'fulfilled' && freeDictResult.value) {
      phonetic = this.freeDictService.extractPhonetic(freeDictResult.value);
      freeDictMeaningsMap = this.freeDictService.extractAllMeanings(freeDictResult.value);
    } else {
      // Free Dictionary查询失败（可能是复数/变形），尝试查询标准形式
      // Microsoft Dictionary返回的normalizedSource就是词根形式
      const normalizedWord = msLookupResponse.normalizedSource;
      if (normalizedWord && normalizedWord.toLowerCase() !== text.trim().toLowerCase()) {
        try {
          const fallbackResult = await this.freeDictService.lookup(normalizedWord, 'en');
          if (fallbackResult) {
            phonetic = this.freeDictService.extractPhonetic(fallbackResult);
            freeDictMeaningsMap = this.freeDictService.extractAllMeanings(fallbackResult);
          }
        } catch (error) {
          console.warn('查询词根形式失败:', error);
        }
      }
    }

    // 使用 Azure TTS 生成音频（替代 Free Dictionary 音频）
    let audioUrl: string | undefined;
    if (this.azureTTSService) {
      try {
        // 使用标准化的单词（词根形式）生成音频
        const wordToSpeak = msLookupResponse.normalizedSource || text.trim();
        audioUrl = await this.azureTTSService.textToSpeech(wordToSpeak);
        console.log('[DictionaryTranslator] Azure TTS 音频生成成功');
      } catch (error) {
        console.warn('[DictionaryTranslator] Azure TTS 音频生成失败:', error);
        // 失败时 audioUrl 保持为 undefined，播放时会降级到浏览器 TTS
      }
    }

    // 获取例句（只为每个词性的最高置信度翻译）
    const examplesMap = await this.microsoftDictService!.getExamplesForTopTranslations(
      msLookupResponse.normalizedSource,
      msLookupResponse.translations,
      this.normalizeLanguageCodeForMS(from),
      this.normalizeLanguageCodeForMS(to)
    );

    // 合并结果
    const meanings = this.mergeResults(
      msLookupResponse.translations,
      examplesMap,
      freeDictMeaningsMap
    );

    // 提取主要翻译（第一个翻译的第一个中文释义）
    let mainTranslation = '';
    if (meanings.length > 0 && meanings[0].translations.length > 0) {
      mainTranslation = meanings[0].translations[0].text;
    }

    // 如果没有翻译结果，降级到Google翻译
    if (!mainTranslation) {
      console.warn('词典无翻译结果，降级到Google翻译');
      return await this.googleTranslator.translate(params);
    }

    return {
      text: msLookupResponse.displaySource,
      translation: mainTranslation,
      from,
      to,
      engine: 'google', // 保持引擎标识为google（避免UI显示问题）
      phonetic,
      audioUrl,
      meanings
    };
  }

  /**
   * 合并 Microsoft Dictionary 和 Free Dictionary 的结果
   */
  private mergeResults(
    msTranslations: Array<{
      normalizedTarget: string;
      displayTarget: string;
      posTag: string;
      confidence: number;
    }>,
    examplesMap: Map<string, { examples: Array<{
      sourcePrefix: string;
      sourceTerm: string;
      sourceSuffix: string;
      targetPrefix: string;
      targetTerm: string;
      targetSuffix: string;
    }> }>,
    freeDictMeaningsMap?: Map<string, string>
  ): DictionaryMeaning[] {
    // 按词性分组
    const groupedByPOS = new Map<string, typeof msTranslations>();

    for (const trans of msTranslations) {
      const existing = groupedByPOS.get(trans.posTag) || [];
      existing.push(trans);
      groupedByPOS.set(trans.posTag, existing);
    }

    // 转换为 DictionaryMeaning 数组
    const meanings: DictionaryMeaning[] = [];

    for (const [posTag, translations] of groupedByPOS) {
      // 按置信度排序
      const sortedTranslations = translations.sort((a, b) => b.confidence - a.confidence);

      // 获取对应的英文定义
      const normalizedPOS = this.normalizePOSTag(posTag);
      const definition = freeDictMeaningsMap?.get(normalizedPOS);

      meanings.push({
        partOfSpeech: posTag,
        partOfSpeechCN: POS_TAG_MAP[posTag] || posTag,
        translations: sortedTranslations.map(trans => {
          // 查找例句（仅最高置信度的翻译有例句）
          const examples = examplesMap.get(trans.normalizedTarget);

          return {
            text: trans.displayTarget,
            confidence: trans.confidence,
            definition: definition, // 所有该词性的翻译共享同一个英文定义
            examples: examples?.examples.map(ex => ({
              source: ex.sourcePrefix + ex.sourceTerm + ex.sourceSuffix,
              target: ex.targetPrefix + ex.targetTerm + ex.targetSuffix,
              sourceTerm: ex.sourceTerm,
              targetTerm: ex.targetTerm,
              targetSuffix: ex.targetSuffix,
              targetPrefix: ex.targetPrefix,
              sourcePrefix: ex.sourcePrefix,
              sourceSuffix: ex.sourceSuffix
            })) || []
          };
        })
      });
    }

    return meanings;
  }

  /**
   * 标准化词性标签
   * Microsoft 使用大写（NOUN），Free Dictionary 使用小写（noun）
   */
  private normalizePOSTag(posTag: string): string {
    const mapping: Record<string, string> = {
      'NOUN': 'noun',
      'VERB': 'verb',
      'ADJ': 'adjective',
      'ADV': 'adverb',
      'PRON': 'pronoun',
      'PREP': 'preposition',
      'CONJ': 'conjunction',
      'DET': 'determiner',
      'MODAL': 'modal'
    };

    return mapping[posTag] || posTag.toLowerCase();
  }

  /**
   * 标准化语言代码（Microsoft API 格式）
   */
  private normalizeLanguageCodeForMS(code: LanguageCode): string {
    const mapping: Record<string, string> = {
      'zh-CN': 'zh-Hans', // Microsoft 使用 zh-Hans
      'zh-TW': 'zh-Hant',
      'en': 'en',
      'ja': 'ja',
      'ko': 'ko',
      'fr': 'fr',
      'de': 'de',
      'es': 'es',
      'ru': 'ru',
      'it': 'it'
    };

    return mapping[code] || code;
  }

  /**
   * 检测文本语言（委托给 Google 翻译）
   */
  async detectLanguage(text: string): Promise<string> {
    return await this.googleTranslator.detectLanguage(text);
  }

  /**
   * 获取支持的语言列表（委托给 Google 翻译）
   */
  getSupportedLanguages(): string[] {
    return this.googleTranslator.getSupportedLanguages();
  }

  /**
   * 检查服务是否可用
   */
  async isAvailable(): Promise<boolean> {
    // 至少 Google 翻译可用即可
    return await this.googleTranslator.isAvailable();
  }
}
