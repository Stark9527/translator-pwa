import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Volume2, BookmarkPlus, BookmarkCheck, Loader2, AlertCircle, Settings, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { SUPPORTED_LANGUAGES } from '@/utils/constants';
import { TranslatorFactory } from '@/services/translator/TranslatorFactory';
import { ConfigService } from '@/services/config/ConfigService';
import { flashcardService } from '@/services/flashcard/FlashcardService';
import { useToast } from '@/hooks/useToast';
import type { TranslateResult, LanguageCode, UserConfig } from '@/types';

/**
 * 翻译页面
 * 全屏翻译界面，底部输入框，翻译结果展示
 */
export function TranslatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [translationResult, setTranslationResult] = useState<TranslateResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [sourceLang, setSourceLang] = useState<LanguageCode>('auto');
  const [targetLang, setTargetLang] = useState<LanguageCode>('zh-CN');
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [addingToFlashcard, setAddingToFlashcard] = useState(false);
  const [isCardExists, setIsCardExists] = useState(false);

  // 加载配置
  useEffect(() => {
    ConfigService.getConfig().then(setConfig);
  }, []);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    if (!config) {
      setError('配置未加载，请稍后再试');
      return;
    }

    setIsTranslating(true);
    setError(null);
    setNeedsApiKey(false);

    try {
      // 创建翻译器实例
      const translator = TranslatorFactory.getTranslator(config.engine, config);

      // 检查翻译器是否可用
      const isAvailable = await translator.isAvailable();
      if (!isAvailable) {
        // 检查是否缺少 API Key
        if (!config.googleApiKey && config.engine === 'google') {
          setNeedsApiKey(true);
          throw new Error(`需要配置 Google API Key 才能使用翻译服务`);
        }
        throw new Error(`翻译服务不可用，请检查 API 配置`);
      }

      // 调用翻译服务
      const result = await translator.translate({
        text: sourceText,
        from: sourceLang,
        to: targetLang,
      });

      // 更新翻译结果
      setTranslationResult(result);
      setTranslatedText(result.translation);

      // 检查卡片是否已存在
      const exists = await flashcardService.exists(
        result.text,
        result.from,
        result.to
      );
      setIsCardExists(exists);
    } catch (error) {
      console.error('Translation error:', error);
      const errorMessage = error instanceof Error ? error.message : '翻译失败，请重试';
      setError(errorMessage);

      // 检查是否是 API Key 相关错误
      if (errorMessage.includes('API Key') || errorMessage.includes('401')) {
        setNeedsApiKey(true);
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') return;
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleAddToFlashcard = async () => {
    if (!translationResult) {
      toast({
        variant: 'destructive',
        title: '请先进行翻译',
        duration: 2000,
      });
      return;
    }

    // 如果卡片已存在,不允许添加
    if (isCardExists) {
      toast({
        variant: 'destructive',
        title: '该卡片已存在',
        duration: 2000,
      });
      return;
    }

    setAddingToFlashcard(true);
    setError(null);

    try {
      // 从翻译结果创建 Flashcard
      await flashcardService.createFromTranslation(translationResult);

      // 标记卡片已存在
      setIsCardExists(true);

      toast({
        variant: 'success',
        title: '已成功添加到学习卡片',
        duration: 2000,
      });
    } catch (error) {
      console.error('Add to flashcard error:', error);
      toast({
        variant: 'destructive',
        title: '添加失败',
        description: error instanceof Error ? error.message : '请重试',
        duration: 3000,
      });
    } finally {
      setAddingToFlashcard(false);
    }
  };

  const handleClearInput = () => {
    setSourceText('');
    setTranslatedText('');
    setTranslationResult(null);
    setError(null);
    setIsCardExists(false);
    // 重新聚焦到输入框
    textareaRef.current?.focus();
  };

  const handlePlayAudio = (text: string, lang?: LanguageCode, audioUrl?: string) => {
    if (!text) return;

    // 方案1: 优先使用 Azure TTS 音频（如果有）
    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);

        audio.onerror = () => {
          console.warn('Azure 音频播放失败，降级到浏览器 TTS');
          playWithBrowserTTS(text, lang);
        };

        audio.play().catch(() => {
          console.warn('Azure 音频播放失败，降级到浏览器 TTS');
          playWithBrowserTTS(text, lang);
        });

        return;
      } catch (error) {
        console.error('Azure audio error:', error);
        // 降级到浏览器 TTS
      }
    }

    // 方案2: 使用浏览器 TTS
    playWithBrowserTTS(text, lang);
  };

  const playWithBrowserTTS = (text: string, lang?: LanguageCode) => {
    try {
      // 检查浏览器是否支持 Web Speech API
      if (!('speechSynthesis' in window)) {
        setError('您的浏览器不支持语音朗读功能');
        return;
      }

      // 停止当前朗读
      window.speechSynthesis.cancel();

      // 创建语音合成实例
      const utterance = new SpeechSynthesisUtterance(text);

      // 根据语言设置朗读语言
      const language = lang || (text === sourceText ? sourceLang : targetLang);
      switch (language) {
        case 'en':
          utterance.lang = 'en-US';
          break;
        case 'zh-CN':
          utterance.lang = 'zh-CN';
          break;
        case 'zh-TW':
          utterance.lang = 'zh-TW';
          break;
        case 'ja':
          utterance.lang = 'ja-JP';
          break;
        case 'ko':
          utterance.lang = 'ko-KR';
          break;
        case 'fr':
          utterance.lang = 'fr-FR';
          break;
        case 'de':
          utterance.lang = 'de-DE';
          break;
        case 'es':
          utterance.lang = 'es-ES';
          break;
        case 'ru':
          utterance.lang = 'ru-RU';
          break;
        case 'it':
          utterance.lang = 'it-IT';
          break;
        default:
          utterance.lang = 'en-US';
      }

      // 设置朗读参数
      utterance.rate = 0.9; // 朗读速度（0.1 - 10）
      utterance.pitch = 1; // 音调（0 - 2）
      utterance.volume = 1; // 音量（0 - 1）

      // 开始朗读
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('TTS error:', error);
      setError('朗读失败，请重试');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 错误提示 */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <button
              onClick={() => {
                setError(null);
                setNeedsApiKey(false);
              }}
              className="text-destructive hover:text-destructive/80 text-xl leading-none"
            >
              ×
            </button>
          </div>
          {needsApiKey && (
            <button
              onClick={() => navigate('/settings')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              <Settings className="w-4 h-4" />
              前往设置页面配置 API Key
            </button>
          )}
        </div>
      )}

      {/* 语言选择栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <select
          value={sourceLang}
          onChange={(e) => setSourceLang(e.target.value as LanguageCode)}
          className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleSwapLanguages}
          disabled={sourceLang === 'auto'}
          className={cn(
            'p-2 rounded-lg transition-colors',
            sourceLang === 'auto'
              ? 'text-muted-foreground cursor-not-allowed'
              : 'text-foreground hover:bg-accent'
          )}
          aria-label="交换语言"
        >
          <ArrowLeftRight className="w-5 h-5" />
        </button>

        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value as LanguageCode)}
          className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {SUPPORTED_LANGUAGES.filter((lang) => lang.code !== 'auto').map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* 翻译结果区域 */}
      <div className="flex-1 overflow-y-auto">
        {translatedText ? (
          <div className="p-4 space-y-4">
            {/* 原文 */}
            <div className="bg-muted/50 rounded-lg py-2 px-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">原文</span>
                <button
                  onClick={() => handlePlayAudio(
                    sourceText,
                    translationResult?.from,
                    translationResult?.audioUrl
                  )}
                  className="p-1 hover:bg-accent rounded transition-colors"
                  aria-label="朗读原文"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-foreground leading-relaxed">{sourceText}</p>
            </div>

            {/* 译文 */}
            <div className="bg-primary/5 rounded-lg py-2 px-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">译文</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePlayAudio(
                      translatedText,
                      translationResult?.to
                    )}
                    className="p-1 hover:bg-accent rounded transition-colors"
                    aria-label="朗读译文"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  {/* 只有在没有字典信息时才显示添加按钮 */}
                  {(!translationResult?.meanings || translationResult.meanings.length === 0) && (
                    <button
                      onClick={handleAddToFlashcard}
                      disabled={addingToFlashcard || isCardExists}
                      className={cn(
                        'p-1 rounded transition-colors',
                        addingToFlashcard || isCardExists
                          ? 'cursor-not-allowed opacity-50'
                          : 'hover:bg-accent'
                      )}
                      aria-label={isCardExists ? '已添加到卡片' : '添加到 Flashcard'}
                    >
                      {addingToFlashcard ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isCardExists ? (
                        <BookmarkCheck className="w-4 h-4 text-primary" />
                      ) : (
                        <BookmarkPlus className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-foreground leading-relaxed font-medium">
                {translatedText}
              </p>
            </div>

            {/* 字典信息区域 */}
            {translationResult?.meanings && translationResult.meanings.length > 0 && (
              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {translationResult.text}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {translationResult.phonetic && (
                        <span className="text-sm text-muted-foreground">
                          {translationResult.phonetic}
                        </span>
                      )}
                      <button
                        onClick={() => handlePlayAudio(
                          translationResult.text,
                          translationResult.from,
                          translationResult.audioUrl
                        )}
                        className="p-1 hover:bg-accent rounded transition-colors"
                        aria-label="发音"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={handleAddToFlashcard}
                        disabled={addingToFlashcard || isCardExists}
                        className={cn(
                          'p-1 rounded transition-colors',
                          addingToFlashcard || isCardExists
                            ? 'cursor-not-allowed opacity-50'
                            : 'hover:bg-accent'
                        )}
                        aria-label={isCardExists ? '已添加到卡片' : '添加到卡片'}
                      >
                        {addingToFlashcard ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isCardExists ? (
                          <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <BookmarkPlus className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 按词性分组的释义 */}
                <div className="space-y-3">
                  {translationResult.meanings.map((meaning, idx) => (
                    <div key={idx} className="space-y-1.5">
                      {/* 词性和翻译内容 - 单行显示 */}
                      <div className="text-foreground">
                        <span className="font-medium text-primary mr-1">
                          {meaning.partOfSpeech}.
                        </span>
                        <span className="leading-relaxed">
                          {meaning.translations.map((trans, transIdx) => (
                            <span key={transIdx}>
                              {transIdx > 0 && '；'}
                              {trans.text}
                            </span>
                          ))}
                        </span>
                      </div>

                      {/* 例句展示 - 收集所有例句统一显示 */}
                      {(() => {
                        // 收集该词性下所有翻译项的例句
                        const allExamples = meaning.translations
                          .flatMap(trans => trans.examples || []);

                        return allExamples.length > 0 && (
                          <div className="bg-accent/50 rounded-lg p-1 space-y-2 mt-2">
                            {allExamples.map((example, exIdx) => (
                              <div key={exIdx} className="pl-2 space-y-0.5">
                                {/* 英文例句 - 高亮关键词 */}
                                <div className="text-sm text-muted-foreground leading-relaxed">
                                  {example.sourceTerm ? (
                                    <>
                                      {example.sourcePrefix}
                                      <span className="font-semibold text-foreground">
                                        {example.sourceTerm}
                                      </span>
                                      {example.sourceSuffix}
                                    </>
                                  ) : (
                                    example.source
                                  )}
                                </div>
                                {/* 中文例句 - 高亮关键词 */}
                                <div className="text-sm text-muted-foreground leading-relaxed">
                                  {example.targetTerm ? (
                                    <>
                                      {example.targetPrefix}
                                      <span className="font-semibold text-foreground">
                                        {example.targetTerm}
                                      </span>
                                      {example.targetSuffix}
                                    </>
                                  ) : (
                                    example.target
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-center">
              在下方输入要翻译的文本
              <br />
              <span className="text-sm">支持多种语言互译</span>
            </p>
          </div>
        )}
      </div>

      {/* 输入框区域 */}
      <div className="border-t border-border bg-background p-4 space-y-2">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="输入要翻译的文本..."
            className="w-full min-h-[60px] p-2 pr-8 bg-muted/50 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleTranslate();
              }
            }}
          />
          {sourceText && (
            <button
              onClick={handleClearInput}
              className="absolute top-2 right-2 p-1 hover:bg-accent rounded-full transition-colors"
              aria-label="清除输入"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {sourceText.length} 字符
          </span>

          <button
            onClick={handleTranslate}
            disabled={!sourceText.trim() || isTranslating}
            className={cn(
              'px-4 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm',
              !sourceText.trim() || isTranslating
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {isTranslating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                翻译中...
              </>
            ) : (
              '翻译'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
