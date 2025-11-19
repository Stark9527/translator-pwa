import { useState, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import type { Flashcard } from '@/types/flashcard';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

interface StudyCardProps {
  flashcard: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
}

export function StudyCard({ flashcard, isFlipped, onFlip }: StudyCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleSpeak = (text: string, lang: string, e?: React.MouseEvent, audioUrl?: string) => {
    e?.stopPropagation();
    if (isPlaying) return;

    setIsPlaying(true);

    // 方案1: 优先使用真实音频
    if (audioUrl) {
      try {
        // 停止之前的音频
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }

        // 创建新的音频实例
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setIsPlaying(false);
          audioRef.current = null;
        };

        audio.onerror = () => {
          console.warn('音频播放失败，降级到TTS');
          // 降级到TTS
          playWithTTS(text, lang);
        };

        audio.play().catch(() => {
          console.warn('音频播放失败，降级到TTS');
          playWithTTS(text, lang);
        });

        return;
      } catch (error) {
        console.error('Audio error:', error);
      }
    }

    // 方案2: 降级使用浏览器TTS
    playWithTTS(text, lang);
  };

  const playWithTTS = (text: string, lang: string) => {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Speech error:', error);
      setIsPlaying(false);
    }
  };

  return (
    <div className="perspective-1000 w-full max-w-md mx-auto">
      <div
        onClick={onFlip}
        className={cn(
          'relative w-full h-80 transition-transform duration-500 transform-style-3d cursor-pointer',
          isFlipped && 'rotate-y-180'
        )}
      >
        {/* 正面 - 单词 */}
        <div className="absolute inset-0 backface-hidden bg-card border-2 border-primary rounded-xl shadow-lg flex flex-col items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-foreground mb-4">{flashcard.word}</h2>

            <div className="flex items-center justify-center gap-3 mb-6">
              {/* 音标 */}
              {flashcard.phonetic && (
                <span className="text-lg text-purple-600 dark:text-purple-400">
                  {flashcard.phonetic}
                </span>
              )}
              {/* 发声按钮 */}
              <button
                onClick={(e) => handleSpeak(flashcard.word, flashcard.sourceLanguage, e, flashcard.audioUrl)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                <Icon icon={Volume2} size="sm" className={isPlaying ? 'animate-pulse' : ''} />
                <span>朗读</span>
              </button>
            </div>
          </div>
        </div>

        {/* 背面 - 翻译和例句 */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-card border-2 border-green-500 rounded-xl shadow-lg flex flex-col p-5 overflow-auto">
          <div className="flex-1">
            {/* 原文 */}
            <div className="mb-3 pb-3 border-b border-border">
              <p className="text-xs text-muted-foreground mb-1">原文</p>
              <div className="flex items-center gap-3">
                <p className="text-xl font-medium text-foreground">{flashcard.word}</p>
                {/* 音标 */}
                {flashcard.phonetic && (
                  <span className="text-base text-purple-600 dark:text-purple-400">
                    {flashcard.phonetic}
                  </span>
                )}
                {/* 发声按钮 */}
                <button
                  onClick={(e) => handleSpeak(flashcard.word, flashcard.sourceLanguage, e, flashcard.audioUrl)}
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full hover:bg-accent transition-colors"
                >
                  <Icon icon={Volume2} size="sm" className={`text-muted-foreground ${isPlaying ? 'animate-pulse' : ''}`} />
                </button>
              </div>
            </div>

            {/* 翻译 - 显示词性和释义 */}
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-2">翻译</p>
              {flashcard.meanings && flashcard.meanings.length > 0 ? (
                <div className="space-y-3">
                  {flashcard.meanings.map((meaning, meaningIndex) => (
                    <div key={meaningIndex} className="space-y-1">
                      {/* 词性 */}
                      <div className="text-sm font-medium text-primary">
                        {meaning.partOfSpeech}. {meaning.translations.map(t => t.text).join('; ')}
                      </div>

                      {/* 示例 */}
                      {meaning.translations.some(t => t.examples && t.examples.length > 0) && (
                        <div className="bg-accent/50 rounded-lg p-2 space-y-1">
                          {meaning.translations
                            .filter(t => t.examples && t.examples.length > 0)
                            .slice(0, 1) // 只显示第一个有例句的翻译
                            .map((trans, transIndex) =>
                              trans.examples?.slice(0, 1).map((example, exIndex) => (
                                <div key={`${transIndex}-${exIndex}`} className="text-xs space-y-0.5">
                                  <p className="text-foreground leading-relaxed">
                                    {example.sourcePrefix}
                                    <span className="text-purple-600 font-medium">{example.sourceTerm}</span>
                                    {example.sourceSuffix}
                                  </p>
                                  <p className="text-muted-foreground leading-relaxed">
                                    {example.targetPrefix}
                                    <span className="text-purple-600 font-medium">{example.targetTerm}</span>
                                    {example.targetSuffix}
                                  </p>
                                </div>
                              ))
                            )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-foreground">{flashcard.translation}</p>
              )}
            </div>

            {/* 笔记 */}
            {flashcard.notes && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1">笔记</p>
                <p className="text-xs text-foreground bg-muted p-2 rounded-md">{flashcard.notes}</p>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground text-center mt-2">
            根据记忆程度选择答题按钮
          </div>
        </div>
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
