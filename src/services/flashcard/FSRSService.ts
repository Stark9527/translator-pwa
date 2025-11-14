// FSRS 算法服务
import {
  FSRS,
  generatorParameters,
  createEmptyCard,
  type Card,
  Rating,
  State,
  type RecordLog,
  type RecordLogItem,
  type Grade
} from 'ts-fsrs';
import { ProficiencyLevel, type FSRSConfig } from '@/types/flashcard';

/**
 * FSRS 服务
 * 封装 ts-fsrs 库，提供简化的 API
 */
export class FSRSService {
  private fsrs: FSRS;

  constructor(config?: FSRSConfig) {
    const params = config?.w ? generatorParameters({ w: config.w }) : generatorParameters();

    this.fsrs = new FSRS({
      ...params,
      request_retention: config?.requestRetention || 0.9,
      maximum_interval: config?.maximumInterval || 36500,
      enable_fuzz: config?.enableFuzz || false,
      enable_short_term: config?.enableShortTerm !== false, // 默认 true
    });
  }

  /**
   * 创建新卡片
   */
  createCard(): Card {
    return createEmptyCard();
  }

  /**
   * 处理复习（核心方法）
   * @param card 当前卡片状态
   * @param rating 用户评分（Again/Hard/Good/Easy）
   * @returns 更新后的卡片状态和复习记录
   */
  review(card: Card, rating: Grade, now?: Date): RecordLogItem {
    const reviewDate = now || new Date();
    const recordLog = this.fsrs.repeat(card, reviewDate);

    // 根据评分获取对应的卡片状态
    // Again (1): 重新学习
    // Hard (2): 困难
    // Good (3): 良好
    // Easy (4): 简单
    return recordLog[rating];
  }

  /**
   * 批量获取所有评分选项的结果（用于预览）
   * @param card 当前卡片
   * @returns 四个选项的结果
   */
  getSchedulingInfo(card: Card, now?: Date): RecordLog {
    const reviewDate = now || new Date();
    return this.fsrs.repeat(card, reviewDate);
  }

  /**
   * 计算卡片的熟练度级别
   * @param card FSRS 卡片
   * @returns 熟练度级别
   */
  calculateProficiency(card: Card): ProficiencyLevel {
    // 新卡片
    if (card.state === State.New) {
      return ProficiencyLevel.New;
    }

    // 学习中
    if (card.state === State.Learning || card.state === State.Relearning) {
      return ProficiencyLevel.Learning;
    }

    // 复习中
    if (card.state === State.Review) {
      // 如果复习间隔超过 30 天，认为已精通
      const now = new Date();
      const nextReview = new Date(card.due);
      const intervalDays = (nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      if (intervalDays > 30) {
        return ProficiencyLevel.Mastered;
      }

      return ProficiencyLevel.Review;
    }

    return ProficiencyLevel.New;
  }

  /**
   * 获取下次复习时间
   * @param card FSRS 卡片
   * @returns 下次复习的 Date 对象
   */
  getNextReviewDate(card: Card): Date {
    return new Date(card.due);
  }

  /**
   * 检查卡片是否到期（需要复习）
   * @param card FSRS 卡片
   * @param now 当前时间（可选）
   * @returns 是否到期
   */
  isDue(card: Card, now?: Date): boolean {
    const currentTime = now || new Date();
    return new Date(card.due) <= currentTime;
  }

  /**
   * 获取卡片的难度系数
   * @param card FSRS 卡片
   * @returns 难度系数（0-10）
   */
  getDifficulty(card: Card): number {
    return card.difficulty;
  }

  /**
   * 获取卡片的稳定性
   * @param card FSRS 卡片
   * @returns 稳定性（天数）
   */
  getStability(card: Card): number {
    return card.stability;
  }

  /**
   * 重置卡片（从头开始学习）
   * @returns 新的空白卡片
   */
  resetCard(): Card {
    return this.createCard();
  }

  /**
   * 获取推荐的评分（用于自动评分）
   * @param _card 当前卡片（保留参数以便未来扩展）
   * @param isCorrect 是否答对
   * @param difficulty 难度（optional: 'easy' | 'hard'）
   * @returns 推荐的评分
   */
  getRecommendedRating(
    _card: Card,
    isCorrect: boolean,
    difficulty?: 'easy' | 'hard'
  ): Rating {
    if (!isCorrect) {
      return Rating.Again; // 答错 → Again
    }

    if (difficulty === 'easy') {
      return Rating.Easy; // 太简单 → Easy
    }

    if (difficulty === 'hard') {
      return Rating.Hard; // 勉强记得 → Hard
    }

    return Rating.Good; // 正常 → Good
  }

  /**
   * 获取评分对应的描述文本
   */
  getRatingLabel(rating: Rating): string {
    const labels: Record<Rating, string> = {
      [Rating.Manual]: 'Manual',
      [Rating.Again]: 'Again',
      [Rating.Hard]: 'Hard',
      [Rating.Good]: 'Good',
      [Rating.Easy]: 'Easy',
    };
    return labels[rating] || 'Unknown';
  }

  /**
   * 获取评分对应的中文描述
   */
  getRatingLabelCN(rating: Rating): string {
    const labels: Record<Rating, string> = {
      [Rating.Manual]: '手动',
      [Rating.Again]: '重来',
      [Rating.Hard]: '困难',
      [Rating.Good]: '良好',
      [Rating.Easy]: '简单',
    };
    return labels[rating] || '未知';
  }

  /**
   * 获取状态对应的中文描述
   */
  getStateLabelCN(state: State): string {
    const labels = {
      [State.New]: '新卡片',
      [State.Learning]: '学习中',
      [State.Review]: '复习中',
      [State.Relearning]: '重新学习',
    };
    return labels[state] || '未知';
  }

  /**
   * 计算卡片的下次复习间隔（天数）
   * @param card FSRS 卡片
   * @returns 间隔天数
   */
  calculateInterval(card: Card): number {
    const now = new Date();
    const nextReview = new Date(card.due);
    const intervalMs = nextReview.getTime() - now.getTime();
    return Math.max(0, Math.round(intervalMs / (1000 * 60 * 60 * 24)));
  }

  /**
   * 更新 FSRS 配置
   * @param config 新配置
   */
  updateConfig(config: FSRSConfig): void {
    const params = config.w ? generatorParameters({ w: config.w }) : generatorParameters();

    this.fsrs = new FSRS({
      ...params,
      request_retention: config.requestRetention || 0.9,
      maximum_interval: config.maximumInterval || 36500,
      enable_fuzz: config.enableFuzz || false,
      enable_short_term: config.enableShortTerm !== false,
    });
  }

  /**
   * 获取当前 FSRS 参数（用于调试）
   */
  getParameters(): any {
    return this.fsrs.parameters;
  }
}

/**
 * 默认 FSRS 服务实例
 */
export const fsrsService = new FSRSService();

/**
 * 导出 Rating 和 State 枚举，方便外部使用
 */
export { Rating, State };
