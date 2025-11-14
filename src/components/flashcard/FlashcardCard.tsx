import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Star, Trash2, Edit2, Volume2, Folder, FolderInput } from 'lucide-react';
import type { Flashcard } from '@/types/flashcard';
import { Icon } from '@/components/ui/icon';
import { ProficiencyBadge } from './ProficiencyBadge';
import { cn } from '@/utils/cn';
import { Checkbox } from '@/components/ui/checkbox';

interface FlashcardCardProps {
  flashcard: Flashcard;
  groupName?: string;       // 分组名称
  onToggleFavorite?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onMoveToGroup?: (id: string) => void;  // 移动到分组
  onClick?: (id: string) => void;
  // 批量操作相关
  batchMode?: boolean;  // 是否处于批量操作模式
  isSelected?: boolean; // 是否被选中
  onToggleSelect?: (id: string) => void; // 切换选中状态
}

export function FlashcardCard({
  flashcard,
  groupName,
  onToggleFavorite,
  onDelete,
  onEdit,
  onMoveToGroup,
  onClick,
  batchMode = false,
  isSelected = false,
  onToggleSelect,
}: FlashcardCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = (text: string, lang: string) => {
    if (isPlaying) return;

    setIsPlaying(true);
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

  // 计算下次复习时间
  const nextReviewText = formatDistanceToNow(new Date(flashcard.nextReview), {
    addSuffix: true,
    locale: zhCN,
  });

  // 计算创建时间显示
  const getCreatedAtText = () => {
    const createdDate = new Date(flashcard.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      // 小于1小时
      return '刚刚添加';
    } else if (diffHours < 24) {
      // 1-24小时
      return `${diffHours}小时前添加`;
    } else if (diffDays <= 7) {
      // 1-7天
      return `${diffDays}天前添加`;
    } else {
      // 超过7天显示具体日期
      return `${format(createdDate, 'yyyy-MM-dd')}添加`;
    }
  };

  const createdAtText = getCreatedAtText();

  // 判断是否是新卡片
  const isNewCard = flashcard.proficiency === 'new' || flashcard.totalReviews === 0;

  // 判断是否逾期
  const isOverdue = new Date(flashcard.nextReview) < new Date();

  return (
    <div
      className={cn(
        'group relative p-3 border border-border rounded-lg bg-card hover:shadow-md transition-all',
        batchMode ? 'cursor-pointer' : onClick && 'cursor-pointer hover:border-primary/50',
        isSelected && 'border-primary bg-primary/5'
      )}
      onClick={() => {
        if (batchMode) {
          onToggleSelect?.(flashcard.id);
        } else {
          onClick?.(flashcard.id);
        }
      }}
    >
      <div className="flex gap-3">
        {/* 批量选择 checkbox */}
        {batchMode && (
          <div className="flex-shrink-0 pt-1.5" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect?.(flashcard.id)}
            />
          </div>
        )}

        {/* 卡片主体内容 */}
        <div className="flex-1 min-w-0">
          {/* 头部：单词 + 音标 + 发音 + 收藏 */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex-1 flex items-center gap-2">
              <h3 className="text-lg font-medium text-foreground">{flashcard.word}</h3>
              {/* 音标 - 在发声按钮左边 */}
              {flashcard.phonetic && (
                <span className="text-sm text-purple-600 dark:text-purple-400">
                  {flashcard.phonetic}
                </span>
              )}
              {/* 发声按钮 - 常驻 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeak(flashcard.word, flashcard.sourceLanguage);
                }}
                className="p-1 hover:bg-accent rounded transition-colors"
                title="朗读"
              >
                <Icon icon={Volume2} size="xs" className={cn('text-muted-foreground', isPlaying && 'text-primary')} />
              </button>
            </div>

            {!batchMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite?.(flashcard.id);
                }}
                className="p-1 hover:bg-accent rounded transition-colors"
                title={flashcard.favorite ? '取消收藏' : '收藏'}
              >
                <Icon
                  icon={Star}
                  size="sm"
                  className={cn(
                    'transition-colors',
                    flashcard.favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                  )}
                />
              </button>
            )}
          </div>

          {/* 翻译 */}
          <p className="text-xs text-muted-foreground mb-2 whitespace-pre-line">{flashcard.translation}</p>

          {/* 例句（如果有，只显示第一条） */}
          {flashcard.examples && flashcard.examples.length > 0 && (
            <p className="text-xs text-muted-foreground italic mb-2 line-clamp-2">
              &quot;{flashcard.examples[0]}&quot;
            </p>
          )}

          {/* 底部：徽章 + 分组 + 标签 + 操作 */}
          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border">
            <div className="flex items-center gap-2 flex-wrap">
              <ProficiencyBadge level={flashcard.proficiency} />

              {/* 分组标签 */}
              {groupName && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 text-xs rounded border border-border">
                  <Icon icon={Folder} size="xs" className="text-muted-foreground" />
                  <span className="text-muted-foreground">{groupName}</span>
                </div>
              )}

              <span
                className={cn(
                  'text-xs',
                  isOverdue ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-muted-foreground'
                )}
              >
                {isOverdue ? (isNewCard ? '待学习' : '待复习') : nextReviewText}
              </span>

              {/* 创建时间 */}
              <span className="text-xs text-muted-foreground">
                {createdAtText}
              </span>

              {/* 标签 */}
              {flashcard.tags.length > 0 && (
                <div className="flex gap-1">
                  {flashcard.tags.slice(0, 2).map(tag => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 text-xs bg-accent text-accent-foreground rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {flashcard.tags.length > 2 && (
                    <span className="px-1.5 py-0.5 text-xs text-muted-foreground">
                      +{flashcard.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 操作按钮 - 批量模式下隐藏 */}
            {!batchMode && (
              <div className="flex items-center gap-1">
                {onMoveToGroup && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveToGroup(flashcard.id);
                    }}
                    className="p-1.5 hover:bg-accent rounded transition-colors"
                    title="移动到分组"
                  >
                    <Icon icon={FolderInput} size="xs" className="text-muted-foreground" />
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(flashcard.id);
                    }}
                    className="p-1.5 hover:bg-accent rounded transition-colors"
                    title="编辑"
                  >
                    <Icon icon={Edit2} size="xs" className="text-muted-foreground" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(flashcard.id);
                    }}
                    className="p-1.5 hover:bg-destructive/10 rounded transition-colors"
                    title="删除"
                  >
                    <Icon icon={Trash2} size="xs" className="text-destructive" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
