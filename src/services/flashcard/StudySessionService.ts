// 学习会话管理服务
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import type { Flashcard, StudySession, ReviewRecord, DailyStats } from '@/types/flashcard';
import type { Grade } from 'ts-fsrs';
import { flashcardDB } from './FlashcardDB';
import { flashcardService } from './FlashcardService';
import { fsrsService } from './FSRSService';

/**
 * 学习会话服务
 * 管理学习会话、复习记录和每日统计
 */
export class StudySessionService {
  private currentSession: StudySession | null = null;

  /**
   * 创建新的学习会话
   * @param cards 本次学习的卡片列表
   * @returns 学习会话对象
   */
  async createSession(cards: Flashcard[]): Promise<StudySession> {
    if (cards.length === 0) {
      throw new Error('No cards to study');
    }

    this.currentSession = {
      id: uuidv4(),
      startTime: Date.now(),
      cards,
      currentIndex: 0,
      totalCards: cards.length,
      reviewedCount: 0,
      correctCount: 0,
      wrongCount: 0,
      status: 'active',
    };

    return this.currentSession;
  }

  /**
   * 创建今日复习会话（所有到期的卡片）
   */
  async createTodayReviewSession(): Promise<StudySession> {
    const dueCards = await flashcardService.getDueCards();

    if (dueCards.length === 0) {
      throw new Error('No cards due for review today');
    }

    return this.createSession(dueCards);
  }

  /**
   * 创建新卡片学习会话
   * @param limit 新卡片数量限制
   */
  async createNewCardsSession(limit: number = 20): Promise<StudySession> {
    const allCards = await flashcardService.getAll();
    const newCards = allCards
      .filter(card => card.proficiency === 'new')
      .slice(0, limit);

    if (newCards.length === 0) {
      throw new Error('No new cards available');
    }

    return this.createSession(newCards);
  }

  /**
   * 创建自定义会话（按分组或标签）
   */
  async createCustomSession(params: {
    groupId?: string;
    tags?: string[];
    limit?: number;
  }): Promise<StudySession> {
    let cards = await flashcardService.search({
      groupId: params.groupId,
      tags: params.tags,
    });

    if (params.limit) {
      cards = cards.slice(0, params.limit);
    }

    if (cards.length === 0) {
      throw new Error('No cards found with the specified criteria');
    }

    return this.createSession(cards);
  }

  /**
   * 获取当前会话
   */
  getCurrentSession(): StudySession | null {
    return this.currentSession;
  }

  /**
   * 获取当前卡片
   */
  getCurrentCard(): Flashcard | null {
    if (!this.currentSession) {
      return null;
    }

    return this.currentSession.cards[this.currentSession.currentIndex] || null;
  }

  /**
   * 处理答题（核心方法）
   * @param rating 用户评分 (Again/Hard/Good/Easy)
   * @param responseTime 答题时长（毫秒）
   */
  async submitAnswer(rating: Grade, responseTime: number): Promise<void> {
    if (!this.currentSession || this.currentSession.status !== 'active') {
      throw new Error('No active study session');
    }

    const currentCard = this.getCurrentCard();
    if (!currentCard) {
      throw new Error('No current card');
    }

    // 判断是否是新卡片（在答题前判断）
    const isNewCard = currentCard.totalReviews === 0;

    // 使用 FSRS 算法更新卡片状态
    const { card: updatedFsrsCard, log } = fsrsService.review(currentCard.fsrsCard, rating);

    // 更新卡片数据
    const isCorrect = rating >= 3; // Good 或 Easy 视为答对
    const newTotalReviews = currentCard.totalReviews + 1;
    const newCorrectCount = currentCard.correctCount + (isCorrect ? 1 : 0);
    const newWrongCount = currentCard.wrongCount + (isCorrect ? 0 : 1);

    // 计算平均答题时间
    const totalTime = currentCard.averageResponseTime * currentCard.totalReviews + responseTime;
    const newAverageResponseTime = totalTime / newTotalReviews;

    const updatedCard: Flashcard = {
      ...currentCard,
      fsrsCard: updatedFsrsCard,
      totalReviews: newTotalReviews,
      correctCount: newCorrectCount,
      wrongCount: newWrongCount,
      averageResponseTime: newAverageResponseTime,
      nextReview: fsrsService.getNextReviewDate(updatedFsrsCard),
      proficiency: fsrsService.calculateProficiency(updatedFsrsCard),
      updatedAt: Date.now(),
    };

    // 保存到数据库
    await flashcardDB.updateFlashcard(updatedCard);

    // 保存复习记录
    const reviewRecord: ReviewRecord = {
      ...log,
      flashcardId: currentCard.id,
      responseTime,
    };
    await flashcardDB.addReviewRecord(reviewRecord);

    // 更新会话统计
    this.currentSession.reviewedCount++;
    if (isCorrect) {
      this.currentSession.correctCount++;
    } else {
      this.currentSession.wrongCount++;
    }

    // 移动到下一张卡片
    this.currentSession.currentIndex++;

    // 检查是否完成
    if (this.currentSession.currentIndex >= this.currentSession.totalCards) {
      await this.completeSession();
    }

    // 更新每日统计
    await this.updateDailyStats(
      currentCard.id,
      isCorrect,
      responseTime,
      isNewCard,
      updatedCard.proficiency
    );
  }

  /**
   * 跳过当前卡片
   */
  skipCard(): void {
    if (!this.currentSession || this.currentSession.status !== 'active') {
      throw new Error('No active study session');
    }

    this.currentSession.currentIndex++;

    if (this.currentSession.currentIndex >= this.currentSession.totalCards) {
      this.completeSession();
    }
  }

  /**
   * 暂停会话
   */
  pauseSession(): void {
    if (!this.currentSession) {
      throw new Error('No active study session');
    }

    this.currentSession.status = 'paused';
  }

  /**
   * 恢复会话
   */
  resumeSession(): void {
    if (!this.currentSession) {
      throw new Error('No study session to resume');
    }

    this.currentSession.status = 'active';
  }

  /**
   * 完成会话
   */
  async completeSession(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active study session');
    }

    this.currentSession.status = 'completed';
    this.currentSession.endTime = Date.now();

    // 这里可以添加会话结束的额外逻辑，比如保存会话记录等
    this.currentSession = null;
  }

  /**
   * 取消会话
   */
  cancelSession(): void {
    this.currentSession = null;
  }

  /**
   * 获取会话进度
   */
  getProgress(): {
    current: number;
    total: number;
    percentage: number;
    reviewed: number;
    correct: number;
    wrong: number;
  } | null {
    if (!this.currentSession) {
      return null;
    }

    return {
      current: this.currentSession.currentIndex + 1,
      total: this.currentSession.totalCards,
      percentage: Math.round(
        (this.currentSession.currentIndex / this.currentSession.totalCards) * 100
      ),
      reviewed: this.currentSession.reviewedCount,
      correct: this.currentSession.correctCount,
      wrong: this.currentSession.wrongCount,
    };
  }

  /**
   * 获取会话统计
   */
  getSessionStats(): {
    duration: number;
    reviewed: number;
    correct: number;
    wrong: number;
    accuracy: number;
  } | null {
    if (!this.currentSession) {
      return null;
    }

    const duration = Date.now() - this.currentSession.startTime;
    const accuracy =
      this.currentSession.reviewedCount > 0
        ? Math.round(
            (this.currentSession.correctCount / this.currentSession.reviewedCount) * 100
          )
        : 0;

    return {
      duration,
      reviewed: this.currentSession.reviewedCount,
      correct: this.currentSession.correctCount,
      wrong: this.currentSession.wrongCount,
      accuracy,
    };
  }

  /**
   * 更新每日统计
   */
  private async updateDailyStats(
    cardId: string,
    isCorrect: boolean,
    responseTime: number,
    isNewCard: boolean,
    newProficiency: string
  ): Promise<void> {
    const today = format(new Date(), 'yyyy-MM-dd');
    let stats = await flashcardDB.getDailyStats(today);

    if (!stats) {
      stats = {
        date: today,
        newCards: 0,
        reviewedCards: 0,
        masteredCards: 0,
        totalAnswers: 0,
        correctCount: 0,
        wrongCount: 0,
        totalStudyTime: 0,
        averageResponseTime: 0,
        studiedCardIds: [],
        newCardIds: [],
        masteredCardIds: [],
      };
    }

    // 每次答题，总答题次数 +1
    stats.totalAnswers++;

    // 统计正确/错误次数
    if (isCorrect) {
      stats.correctCount++;
    } else {
      stats.wrongCount++;
    }

    // 更新学习时长
    stats.totalStudyTime += responseTime;
    stats.averageResponseTime = stats.totalStudyTime / stats.totalAnswers;

    // 如果是第一次学习这张卡片（今天）
    if (!stats.studiedCardIds.includes(cardId)) {
      stats.studiedCardIds.push(cardId);

      if (isNewCard) {
        // 新学卡片
        stats.newCards++;
        stats.newCardIds.push(cardId);
      } else {
        // 复习卡片
        stats.reviewedCards++;
      }
    }

    // 如果卡片达到精通状态，且今天还没统计过
    if (newProficiency === 'mastered' && !stats.masteredCardIds.includes(cardId)) {
      stats.masteredCards++;
      stats.masteredCardIds.push(cardId);
    }

    await flashcardDB.saveDailyStats(stats);
  }

  /**
   * 获取今日统计
   */
  async getTodayStats(): Promise<DailyStats | null> {
    const today = format(new Date(), 'yyyy-MM-dd');
    return flashcardDB.getDailyStats(today);
  }

  /**
   * 获取一段时间的统计
   */
  async getStatsRange(startDate: string, endDate: string): Promise<DailyStats[]> {
    return flashcardDB.getDailyStatsRange(startDate, endDate);
  }

  /**
   * 获取最近 N 天的统计
   */
  async getRecentStats(days: number): Promise<DailyStats[]> {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days + 1);

    const start = format(startDate, 'yyyy-MM-dd');
    const end = format(today, 'yyyy-MM-dd');

    return this.getStatsRange(start, end);
  }

  /**
   * 获取学习连续天数（streak）
   */
  async getStreak(): Promise<{ current: number; longest: number }> {
    const recentStats = await this.getRecentStats(365); // 查看过去一年

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // 从今天开始往前计算
    let checkDate = new Date();

    // 计算当前连续天数
    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const stats = recentStats.find(s => s.date === dateStr);

      if (stats && (stats.newCards > 0 || stats.reviewedCards > 0)) {
        currentStreak++;
      } else {
        break;
      }

      checkDate.setDate(checkDate.getDate() - 1);
    }

    // 计算最长连续天数
    checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 364);

    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const stats = recentStats.find(s => s.date === dateStr);

      if (stats && (stats.newCards > 0 || stats.reviewedCards > 0)) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }

      checkDate.setDate(checkDate.getDate() + 1);
    }

    return {
      current: currentStreak,
      longest: longestStreak,
    };
  }
}

/**
 * 单例实例
 */
export const studySessionService = new StudySessionService();
