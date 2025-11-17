// 统计分析服务
import { format, subDays } from 'date-fns';
import type { Flashcard, OverallStats } from '@/types/flashcard';
import { flashcardDB } from './FlashcardDB';
import { flashcardService } from './FlashcardService';
import { studySessionService } from './StudySessionService';

/**
 * 学习曲线数据点
 */
export interface LearningCurveData {
  date: string;
  newCards: number;
  reviewedCards: number;
  masteredCards: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
}

/**
 * 掌握度分布数据
 */
export interface ProficiencyDistribution {
  new: number;
  learning: number;
  review: number;
  mastered: number;
  total: number;
}

/**
 * 热力图数据（用于展示学习频率）
 */
export interface HeatmapData {
  date: string;
  count: number;
  level: number; // 0-4 强度级别
}

/**
 * 统计分析服务
 * 提供各种学习数据的统计和分析功能
 */
export class AnalyticsService {
  /**
   * 获取整体统计数据
   */
  async getOverallStats(): Promise<OverallStats> {
    const flashcards = await flashcardDB.getAllFlashcards();
    const todayStats = await studySessionService.getTodayStats();
    const streak = await studySessionService.getStreak();

    // 按熟练度分组统计
    const proficiencyCounts = await flashcardService.getCardCountByProficiency();

    // 计算今日到期数量，并区分新卡片和复习卡片
    const dueCards = await flashcardService.getDueCards();
    const dueNewCards = dueCards.filter(card => card.proficiency === 'new' || card.totalReviews === 0);
    const dueReviewCards = dueCards.filter(card => card.proficiency !== 'new' && card.totalReviews > 0);

    const todayDueNew = dueNewCards.length;
    const todayDueReview = dueReviewCards.length;
    const todayDue = dueCards.length;

    // 计算总复习次数和学习时长
    let totalReviews = 0;
    let totalCorrect = 0;

    flashcards.forEach(card => {
      totalReviews += card.totalReviews;
      totalCorrect += card.correctCount;
    });

    // 计算平均正确率
    const averageCorrectRate = totalReviews > 0
      ? Math.round((totalCorrect / totalReviews) * 100)
      : 0;

    // 今日正确率
    const todayCorrectRate = todayStats && todayStats.totalAnswers > 0
      ? Math.round((todayStats.correctCount / todayStats.totalAnswers) * 100)
      : 0;

    // 今日新学数
    const todayNewLearned = todayStats?.newCards || 0;

    // 今日复习数
    const todayReviewed = todayStats?.reviewedCards || 0;

    // 今日精通数
    const todayMastered = todayStats?.masteredCards || 0;

    // 今日答题次数
    const todayTotalAnswers = todayStats?.totalAnswers || 0;

    return {
      totalCards: flashcards.length,
      newCards: proficiencyCounts.new,
      learningCards: proficiencyCounts.learning,
      reviewCards: proficiencyCounts.review,
      masteredCards: proficiencyCounts.mastered,

      todayDueNew,
      todayDueReview,
      todayDue,
      todayNewLearned,
      todayReviewed,
      todayMastered,
      todayTotalAnswers,
      todayCorrectRate,

      totalReviews,
      totalStudyTime: todayStats?.totalStudyTime || 0,
      averageCorrectRate,

      streak: streak.current,
      longestStreak: streak.longest,
      totalStudyDays: streak.total,
    };
  }

  /**
   * 获取掌握度分布
   */
  async getProficiencyDistribution(): Promise<ProficiencyDistribution> {
    const counts = await flashcardService.getCardCountByProficiency();

    return {
      ...counts,
      total: counts.new + counts.learning + counts.review + counts.mastered,
    };
  }

  /**
   * 获取学习曲线数据（最近 N 天）
   */
  async getLearningCurve(days: number = 30): Promise<LearningCurveData[]> {
    const recentStats = await studySessionService.getRecentStats(days);

    // 生成完整的日期列表（包含没有学习记录的日期）
    const curveData: LearningCurveData[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const stats = recentStats.find(s => s.date === dateStr);

      if (stats) {
        curveData.push({
          date: dateStr,
          newCards: stats.newCards,
          reviewedCards: stats.reviewedCards,
          masteredCards: stats.masteredCards || 0,
          correctCount: stats.correctCount,
          wrongCount: stats.wrongCount,
          accuracy: stats.totalAnswers > 0
            ? Math.round((stats.correctCount / stats.totalAnswers) * 100)
            : 0,
        });
      } else {
        curveData.push({
          date: dateStr,
          newCards: 0,
          reviewedCards: 0,
          masteredCards: 0,
          correctCount: 0,
          wrongCount: 0,
          accuracy: 0,
        });
      }
    }

    return curveData;
  }

  /**
   * 获取热力图数据（一年的学习频率）
   */
  async getHeatmapData(): Promise<HeatmapData[]> {
    const yearStats = await studySessionService.getRecentStats(365);

    // 计算强度级别的阈值
    const maxCount = Math.max(...yearStats.map(s => s.reviewedCards), 1);
    const threshold = maxCount / 4;

    const heatmapData: HeatmapData[] = yearStats.map(stats => {
      let level = 0;
      if (stats.reviewedCards > 0) {
        level = Math.min(4, Math.ceil(stats.reviewedCards / threshold));
      }

      return {
        date: stats.date,
        count: stats.reviewedCards,
        level,
      };
    });

    return heatmapData;
  }

  /**
   * 获取特定分组的整体统计数据
   */
  async getOverallStatsByGroup(groupId: string): Promise<OverallStats> {
    const flashcards = await flashcardDB.getFlashcardsByGroup(groupId);
    const todayStats = await studySessionService.getTodayStats();
    const streak = await studySessionService.getStreak();

    // 计算各熟练度的卡片数量
    const proficiencyCounts = {
      new: flashcards.filter(c => c.proficiency === 'new').length,
      learning: flashcards.filter(c => c.proficiency === 'learning').length,
      review: flashcards.filter(c => c.proficiency === 'review').length,
      mastered: flashcards.filter(c => c.proficiency === 'mastered').length,
    };

    // 计算今日到期数量（该分组），并区分新卡片和复习卡片
    const now = new Date();
    const dueCards = flashcards.filter(c => new Date(c.nextReview) <= now);
    const dueNewCards = dueCards.filter(card => card.proficiency === 'new' || card.totalReviews === 0);
    const dueReviewCards = dueCards.filter(card => card.proficiency !== 'new' && card.totalReviews > 0);

    const todayDueNew = dueNewCards.length;
    const todayDueReview = dueReviewCards.length;
    const todayDue = dueCards.length;

    // 计算总复习次数
    let totalReviews = 0;
    let totalCorrect = 0;

    flashcards.forEach(card => {
      totalReviews += card.totalReviews;
      totalCorrect += card.correctCount;
    });

    // 计算平均正确率
    const averageCorrectRate = totalReviews > 0
      ? Math.round((totalCorrect / totalReviews) * 100)
      : 0;

    // 今日正确率（全局的，因为没有按分组的每日统计）
    const todayCorrectRate = todayStats && todayStats.totalAnswers > 0
      ? Math.round((todayStats.correctCount / todayStats.totalAnswers) * 100)
      : 0;

    // 今日新学数
    const todayNewLearned = todayStats?.newCards || 0;

    // 今日复习数
    const todayReviewed = todayStats?.reviewedCards || 0;

    // 今日精通数
    const todayMastered = todayStats?.masteredCards || 0;

    // 今日答题次数
    const todayTotalAnswers = todayStats?.totalAnswers || 0;

    return {
      totalCards: flashcards.length,
      newCards: proficiencyCounts.new,
      learningCards: proficiencyCounts.learning,
      reviewCards: proficiencyCounts.review,
      masteredCards: proficiencyCounts.mastered,

      todayDueNew,
      todayDueReview,
      todayDue,
      todayNewLearned,
      todayReviewed,
      todayMastered,
      todayTotalAnswers,
      todayCorrectRate,

      totalReviews,
      totalStudyTime: todayStats?.totalStudyTime || 0,
      averageCorrectRate,

      streak: streak.current,
      longestStreak: streak.longest,
      totalStudyDays: streak.total,
    };
  }

  /**
   * 获取特定分组的熟练度分布
   */
  async getProficiencyDistributionByGroup(groupId: string): Promise<ProficiencyDistribution> {
    const flashcards = await flashcardDB.getFlashcardsByGroup(groupId);

    const counts = {
      new: flashcards.filter(c => c.proficiency === 'new').length,
      learning: flashcards.filter(c => c.proficiency === 'learning').length,
      review: flashcards.filter(c => c.proficiency === 'review').length,
      mastered: flashcards.filter(c => c.proficiency === 'mastered').length,
    };

    return {
      ...counts,
      total: counts.new + counts.learning + counts.review + counts.mastered,
    };
  }

  /**
   * 获取特定分组的学习曲线（最近 N 天）
   * 注意：由于当前没有按分组的每日统计，这里返回全局的学习曲线
   * TODO: 在未来版本中实现按分组的每日统计
   */
  async getLearningCurveByGroup(_groupId: string, days: number = 30): Promise<LearningCurveData[]> {
    // 目前返回全局学习曲线，因为没有按分组的每日统计
    return this.getLearningCurve(days);
  }

  /**
   * 获取按分组的统计
   */
  async getStatsByGroup(): Promise<Array<{
    groupId: string;
    groupName: string;
    totalCards: number;
    newCards: number;
    learningCards: number;
    reviewCards: number;
    masteredCards: number;
    dueCards: number;
  }>> {
    const groups = await flashcardService.getAllGroups();
    const results = [];

    for (const group of groups) {
      const cards = await flashcardDB.getFlashcardsByGroup(group.id);
      const now = new Date();

      const stats = {
        groupId: group.id,
        groupName: group.name,
        totalCards: cards.length,
        newCards: cards.filter(c => c.proficiency === 'new').length,
        learningCards: cards.filter(c => c.proficiency === 'learning').length,
        reviewCards: cards.filter(c => c.proficiency === 'review').length,
        masteredCards: cards.filter(c => c.proficiency === 'mastered').length,
        dueCards: cards.filter(c => new Date(c.nextReview) <= now).length,
      };

      results.push(stats);
    }

    return results;
  }

  /**
   * 获取学习时间分布（按小时）
   */
  async getStudyTimeDistribution(): Promise<Array<{ hour: number; count: number }>> {
    // 这个功能需要在复习记录中存储时间戳
    // 目前先返回空数组，可以在后续版本中实现
    // TODO: 实现学习时间分布统计
    return [];
  }

  /**
   * 获取难度卡片 Top N
   */
  async getDifficultCards(limit: number = 10): Promise<Flashcard[]> {
    const flashcards = await flashcardDB.getAllFlashcards();

    // 按错误率排序
    const sorted = flashcards
      .filter(card => card.totalReviews > 0)
      .sort((a, b) => {
        const aErrorRate = a.wrongCount / a.totalReviews;
        const bErrorRate = b.wrongCount / b.totalReviews;
        return bErrorRate - aErrorRate;
      });

    return sorted.slice(0, limit);
  }

  /**
   * 获取即将到期的卡片
   */
  async getUpcomingCards(days: number = 7): Promise<Flashcard[]> {
    const flashcards = await flashcardDB.getAllFlashcards();
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);

    return flashcards.filter(card => {
      const nextReview = new Date(card.nextReview);
      return nextReview > now && nextReview <= futureDate;
    });
  }

  /**
   * 获取学习效率统计
   */
  async getEfficiencyStats(): Promise<{
    averageResponseTime: number; // 平均答题时间（毫秒）
    fastestCard: Flashcard | null;
    slowestCard: Flashcard | null;
    averageInterval: number; // 平均复习间隔（天）
  }> {
    const flashcards = await flashcardDB.getAllFlashcards();

    if (flashcards.length === 0) {
      return {
        averageResponseTime: 0,
        fastestCard: null,
        slowestCard: null,
        averageInterval: 0,
      };
    }

    // 只统计有复习记录的卡片
    const reviewedCards = flashcards.filter(card => card.totalReviews > 0);

    if (reviewedCards.length === 0) {
      return {
        averageResponseTime: 0,
        fastestCard: null,
        slowestCard: null,
        averageInterval: 0,
      };
    }

    // 平均答题时间
    const totalTime = reviewedCards.reduce((sum, card) => sum + card.averageResponseTime, 0);
    const averageResponseTime = totalTime / reviewedCards.length;

    // 最快和最慢的卡片
    const sortedByTime = [...reviewedCards].sort(
      (a, b) => a.averageResponseTime - b.averageResponseTime
    );
    const fastestCard = sortedByTime[0];
    const slowestCard = sortedByTime[sortedByTime.length - 1];

    // 平均复习间隔
    const totalInterval = flashcards.reduce((sum, card) => {
      const now = new Date();
      const nextReview = new Date(card.nextReview);
      const intervalMs = nextReview.getTime() - now.getTime();
      const intervalDays = Math.max(0, intervalMs / (1000 * 60 * 60 * 24));
      return sum + intervalDays;
    }, 0);
    const averageInterval = totalInterval / flashcards.length;

    return {
      averageResponseTime,
      fastestCard,
      slowestCard,
      averageInterval,
    };
  }

  /**
   * 导出学习报告（JSON）
   */
  async exportReport(): Promise<string> {
    const [
      overall,
      proficiency,
      curve,
      byGroup,
      difficult,
      efficiency,
    ] = await Promise.all([
      this.getOverallStats(),
      this.getProficiencyDistribution(),
      this.getLearningCurve(30),
      this.getStatsByGroup(),
      this.getDifficultCards(10),
      this.getEfficiencyStats(),
    ]);

    const report = {
      generatedAt: new Date().toISOString(),
      overall,
      proficiency,
      learningCurve: curve,
      byGroup,
      difficultCards: difficult.map(card => ({
        word: card.word,
        translation: card.translation,
        totalReviews: card.totalReviews,
        correctCount: card.correctCount,
        wrongCount: card.wrongCount,
        errorRate: Math.round((card.wrongCount / card.totalReviews) * 100),
      })),
      efficiency,
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * 获取学习建议
   */
  async getRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];

    const overall = await this.getOverallStats();
    const dueCards = await flashcardService.getDueCards();

    // 建议 1：每日复习
    if (dueCards.length > 0) {
      recommendations.push(`今天有 ${dueCards.length} 张卡片需要复习，建议尽快完成。`);
    }

    // 建议 2：学习新卡片
    if (overall.newCards > 0 && dueCards.length === 0) {
      recommendations.push(`所有到期卡片已复习完成！可以学习 ${Math.min(20, overall.newCards)} 张新卡片。`);
    }

    // 建议 3：正确率偏低
    if (overall.todayCorrectRate > 0 && overall.todayCorrectRate < 70) {
      recommendations.push(`今日正确率为 ${overall.todayCorrectRate}%，建议放慢学习节奏，加强记忆。`);
    }

    // 建议 4：连续学习
    if (overall.streak === 0) {
      recommendations.push('开始你的学习之旅吧！坚持每天学习可以保持记忆新鲜。');
    } else if (overall.streak < 7) {
      recommendations.push(`已连续学习 ${overall.streak} 天，再坚持 ${7 - overall.streak} 天达成一周目标！`);
    }

    // 建议 5：难度卡片
    const difficultCards = await this.getDifficultCards(5);
    if (difficultCards.length > 0 && difficultCards[0].totalReviews >= 3) {
      const errorRate = Math.round((difficultCards[0].wrongCount / difficultCards[0].totalReviews) * 100);
      if (errorRate > 50) {
        recommendations.push(`"${difficultCards[0].word}" 的错误率较高（${errorRate}%），建议添加笔记或例句加深理解。`);
      }
    }

    return recommendations;
  }
}

/**
 * 单例实例
 */
export const analyticsService = new AnalyticsService();
