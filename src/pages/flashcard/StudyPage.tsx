import { useState, useEffect, useCallback } from 'react';
import { Rating, Grade } from 'ts-fsrs';
import { Play, RotateCcw, X, GraduationCap, AlertTriangle } from 'lucide-react';
import type { Flashcard, FlashcardGroup } from '@/types/flashcard';
import { studySessionService, flashcardService } from '@/services/flashcard';
import { StudyCard } from '@/components/flashcard/StudyCard';
import { ProgressRing } from '@/components/flashcard/ProgressRing';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ratingButtons: Array<{ rating: Grade; label: string; shortcut: string; color: string }> = [
  { rating: Rating.Again as Grade, label: '重来', shortcut: '1', color: 'bg-red-500 hover:bg-red-600' },
  { rating: Rating.Hard as Grade, label: '困难', shortcut: '2', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { rating: Rating.Good as Grade, label: '良好', shortcut: '3', color: 'bg-blue-500 hover:bg-blue-600' },
  { rating: Rating.Easy as Grade, label: '简单', shortcut: '4', color: 'bg-green-500 hover:bg-green-600' },
];

export default function StudyPage() {
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [startTime, setStartTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [groups, setGroups] = useState<FlashcardGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedGroupName, setSelectedGroupName] = useState<string>('全部分组');
  const [newCardsCount, setNewCardsCount] = useState<number>(0);
  const [reviewCardsCount, setReviewCardsCount] = useState<number>(0);
  const [isCheckingCards, setIsCheckingCards] = useState(false);

  // 检查可学习的卡片数量
  const checkAvailableCards = useCallback(async (groupId: string) => {
    setIsCheckingCards(true);
    try {
      let dueCards: Flashcard[] = [];

      if (groupId === 'all') {
        // 获取所有到期卡片
        dueCards = await flashcardService.getDueCards();
      } else {
        // 获取特定分组的到期卡片
        const allDueCards = await flashcardService.getDueCards();
        dueCards = allDueCards.filter(card => card.groupId === groupId);
      }

      // 统计新卡片和复习卡片数量
      const newCards = dueCards.filter(card => card.proficiency === 'new' || card.totalReviews === 0);
      const reviewCards = dueCards.filter(card => card.proficiency !== 'new' && card.totalReviews > 0);

      setNewCardsCount(newCards.length);
      setReviewCardsCount(reviewCards.length);
    } catch (error) {
      console.error('Failed to check available cards:', error);
      setNewCardsCount(0);
      setReviewCardsCount(0);
    } finally {
      setIsCheckingCards(false);
    }
  }, []);

  // 加载分组列表
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const allGroups = await flashcardService.getAllGroups();
        setGroups(allGroups);
        // 初始加载时检查可学习的卡片数量
        await checkAvailableCards('all');
      } catch (error) {
        console.error('Failed to load groups:', error);
      }
    };
    loadGroups();
  }, [checkAvailableCards]);

  // 加载当前卡片
  const loadCurrentCard = useCallback(() => {
    const card = studySessionService.getCurrentCard();
    setCurrentCard(card);
    setIsFlipped(false);

    const currentProgress = studySessionService.getProgress();
    if (currentProgress) {
      setProgress({
        current: currentProgress.current,
        total: currentProgress.total,
      });
    }

    const currentStats = studySessionService.getSessionStats();
    if (currentStats) {
      setStats({
        correct: currentStats.correct,
        wrong: currentStats.wrong,
      });
    }
  }, []);

  // 开始学习会话
  const startSession = async () => {
    setIsLoading(true);
    try {
      if (selectedGroupId === 'all') {
        // 学习所有分组的到期卡片
        await studySessionService.createTodayReviewSession();
      } else {
        // 学习特定分组的到期卡片
        await studySessionService.createCustomSession({ groupId: selectedGroupId });
      }
      setIsSessionActive(true);
      setStartTime(Date.now());
      loadCurrentCard();
    } catch (error) {
      console.error('Failed to start session:', error);
      alert(error instanceof Error ? error.message : '无法开始学习会话');
    } finally {
      setIsLoading(false);
    }
  };

  // 提交答案
  const submitAnswer = useCallback(
    async (rating: Grade) => {
      if (!currentCard || !isFlipped) return;

      const responseTime = Date.now() - startTime;

      try {
        // 先获取当前统计，因为 submitAnswer 后会话可能被清空
        const currentStats = studySessionService.getSessionStats();

        await studySessionService.submitAnswer(rating, responseTime);

        // 检查是否还有下一张卡片
        const nextCard = studySessionService.getCurrentCard();
        if (!nextCard) {
          // 会话已完成
          setIsSessionActive(false);
          setCurrentCard(null);
          // 重新检查可学习的卡片数量
          checkAvailableCards(selectedGroupId);
          alert(
            `学习完成！\n✓ 答对：${currentStats?.correct || 0}\n✗ 答错：${currentStats?.wrong || 0}`
          );
        } else {
          // 加载下一张卡片
          setStartTime(Date.now());
          loadCurrentCard();
        }
      } catch (error) {
        console.error('Failed to submit answer:', error);
        alert('提交答案失败');
      }
    },
    [currentCard, isFlipped, startTime, loadCurrentCard, checkAvailableCards, selectedGroupId]
  );

  // 翻转卡片
  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  // 快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 只在有活动会话且当前卡片存在时响应
      if (!isSessionActive || !currentCard) return;

      // 空格键翻转卡片
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
        return;
      }

      // 数字键 1-4 答题（只有翻转后才能答题）
      if (!isFlipped) return;

      switch (e.key) {
        case '1':
          e.preventDefault();
          submitAnswer(Rating.Again);
          break;
        case '2':
          e.preventDefault();
          submitAnswer(Rating.Hard);
          break;
        case '3':
          e.preventDefault();
          submitAnswer(Rating.Good);
          break;
        case '4':
          e.preventDefault();
          submitAnswer(Rating.Easy);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSessionActive, currentCard, isFlipped, handleFlip, submitAnswer]);

  // 显示退出确认对话框
  const handleCancelSession = () => {
    setShowExitDialog(true);
  };

  // 确认退出学习
  const confirmExit = () => {
    studySessionService.cancelSession();
    setIsSessionActive(false);
    setCurrentCard(null);
    setShowExitDialog(false);
    // 重新检查可学习的卡片数量
    checkAvailableCards(selectedGroupId);
  };

  // 未开始状态
  if (!isSessionActive) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Icon icon={GraduationCap} size="xl" className="text-primary mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">开始学习</h2>

        {/* 分组选择器 */}
        <div className="mb-4 w-full max-w-xs">
          <label className="block text-sm font-medium text-foreground mb-2">
            选择学习范围
          </label>
          <select
            value={selectedGroupId}
            onChange={(e) => {
              const groupId = e.target.value;
              setSelectedGroupId(groupId);
              if (groupId === 'all') {
                setSelectedGroupName('全部分组');
              } else {
                const group = groups.find(g => g.id === groupId);
                setSelectedGroupName(group?.name || '');
              }
              // 更新可学习的卡片数量
              checkAvailableCards(groupId);
            }}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">全部分组</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        {/* 可学习卡片数量提示 */}
        {isCheckingCards ? (
          <div className="mb-4 p-4 bg-muted rounded-lg max-w-md">
            <p className="text-sm text-muted-foreground text-center">
              正在检查可学习的卡片...
            </p>
          </div>
        ) : newCardsCount + reviewCardsCount > 0 ? (
          <div className="mb-4 p-4 bg-muted rounded-lg max-w-md">
            <p className="text-sm text-muted-foreground text-center">
              {newCardsCount > 0 && reviewCardsCount > 0 && (
                <>
                  有 <span className="font-semibold text-green-600">{newCardsCount}</span> 张新卡片，
                  <span className="font-semibold text-orange-600">{reviewCardsCount}</span> 张卡片需要复习
                </>
              )}
              {newCardsCount > 0 && reviewCardsCount === 0 && (
                <>
                  有 <span className="font-semibold text-green-600">{newCardsCount}</span> 张新卡片待学习
                </>
              )}
              {newCardsCount === 0 && reviewCardsCount > 0 && (
                <>
                  有 <span className="font-semibold text-orange-600">{reviewCardsCount}</span> 张卡片需要复习
                </>
              )}
            </p>
          </div>
        ) : (
          <div className="mb-4 p-4 bg-muted rounded-lg max-w-md">
            <p className="text-sm text-muted-foreground text-center">
              暂时没有需要学习、复习的卡片 📚
            </p>
            <p className="text-xs text-muted-foreground text-center mt-2">
              所有卡片都已完成，明天再来吧！
            </p>
          </div>
        )}

        <button
          onClick={startSession}
          disabled={isLoading || isCheckingCards || (newCardsCount + reviewCardsCount === 0)}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon={Play} size="sm" />
          <span>{isLoading ? '加载中...' : '开始学习'}</span>
        </button>

        <div className="mt-8 p-4 bg-muted rounded-lg max-w-md">
          <h3 className="text-sm font-medium text-foreground mb-2">快捷键提示</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li><kbd className="px-1.5 py-0.5 bg-background border border-border rounded">空格</kbd> - 翻转卡片</li>
            <li><kbd className="px-1.5 py-0.5 bg-background border border-border rounded">1</kbd> - 重来（完全忘记）</li>
            <li><kbd className="px-1.5 py-0.5 bg-background border border-border rounded">2</kbd> - 困难（勉强记得）</li>
            <li><kbd className="px-1.5 py-0.5 bg-background border border-border rounded">3</kbd> - 良好（记得清楚）</li>
            <li><kbd className="px-1.5 py-0.5 bg-background border border-border rounded">4</kbd> - 简单（太简单了）</li>
          </ul>
        </div>
      </div>
    );
  }

  // 学习中状态
  if (!currentCard) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col overflow-hidden">
      {/* 头部：进度和统计 */}
      <div className="p-4 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          {/* 进度 */}
          <div className="flex items-center gap-3">
            <ProgressRing percentage={progressPercentage} size={40} showLabel={false} />
            <div>
              {/* 弱化显示分组名称 */}
              {selectedGroupId !== 'all' && (
                <p className="text-xs text-muted-foreground/60 mb-0.5">
                  {selectedGroupName}
                </p>
              )}
              <p className="text-sm font-medium text-foreground">
                {progress.current} / {progress.total}
              </p>
              <p className="text-xs text-muted-foreground">
                ✓ {stats.correct} · ✗ {stats.wrong}
              </p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            {isFlipped && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsFlipped(false);
                      loadCurrentCard();
                    }}
                  >
                    <Icon icon={RotateCcw} size="sm" className="text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>重新开始当前卡片</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancelSession}
                >
                  <Icon icon={X} size="sm" className="text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>退出学习</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* 卡片区域 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <StudyCard
          flashcard={currentCard}
          isFlipped={isFlipped}
          onFlip={handleFlip}
        />

        {/* 答题按钮（只在翻转后显示） */}
        {isFlipped && (
          <div className="mt-4 flex gap-3">
            {ratingButtons.map(({ rating, label, shortcut, color }) => (
              <button
                key={rating}
                onClick={() => submitAnswer(rating)}
                className={cn(
                  'px-6 py-3 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg',
                  color
                )}
              >
                <div className="text-center">
                  <div className="text-lg">{label}</div>
                  <div className="text-xs opacity-75">按 {shortcut}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 提示文字 */}
        {!isFlipped && (
          <div className="mt-6 text-sm text-muted-foreground">
            按<kbd className="px-1.5 py-0.5 mx-1 bg-muted border border-border rounded text-foreground">空格</kbd>或点击卡片查看答案
          </div>
        )}
      </div>

      {/* 退出确认对话框 */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon icon={AlertTriangle} size="sm" className="text-destructive" />
              退出学习
            </DialogTitle>
            <DialogDescription>
              确定要退出学习吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowExitDialog(false)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmExit}
            >
              确认退出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
