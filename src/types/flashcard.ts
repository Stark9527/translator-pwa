// Flashcard 类型定义
import type { Card, ReviewLog, Rating, State } from 'ts-fsrs';
import type { LanguageCode, TranslationEngine } from './index';

/**
 * 卡片状态
 * - New: 新卡片（从未学习）
 * - Learning: 学习中（短期记忆阶段）
 * - Review: 复习中（长期记忆阶段）
 * - Relearning: 重新学习（答错后重新学）
 */
export type CardState = State;

/**
 * 答题评分
 * - Again (1): 完全忘记，重新学习
 * - Hard (2): 勉强记得，困难
 * - Good (3): 记得清楚，良好
 * - Easy (4): 太简单，轻松记得
 */
export type CardRating = Rating;

/**
 * 熟练度级别
 * 用于 UI 展示和筛选
 */
export enum ProficiencyLevel {
  New = 'new',           // 新词（从未学习）
  Learning = 'learning', // 学习中（记忆巩固阶段）
  Review = 'review',     // 复习中（已掌握，定期复习）
  Mastered = 'mastered', // 已精通（复习间隔 > 30 天）
}

/**
 * Flashcard 基础数据
 */
export interface FlashcardData {
  id: string;                    // 唯一标识
  word: string;                  // 单词/短语
  translation: string;           // 翻译
  pronunciation?: string;        // 发音
  examples?: string[];           // 例句
  notes?: string;                // 用户笔记

  // 词典信息（多词性、多释义）
  phonetic?: string;             // 音标
  meanings?: import('./index').DictionaryMeaning[];  // 词典词义（按词性分组）

  // 来源信息
  sourceLanguage: LanguageCode;  // 源语言
  targetLanguage: LanguageCode;  // 目标语言
  engine: TranslationEngine;     // 翻译引擎

  // 分组与标签
  groupId: string;               // 所属分组 ID
  tags: string[];                // 标签列表

  // 时间戳
  createdAt: number;             // 创建时间
  updatedAt: number;             // 最后更新时间

  // 用户标记
  favorite: boolean;             // 是否收藏
}

/**
 * FSRS 学习数据
 * 直接使用 ts-fsrs 的 Card 类型
 */
export type FSRSCard = Card;

/**
 * 完整的 Flashcard（包含 FSRS 数据）
 */
export interface Flashcard extends FlashcardData {
  // FSRS 学习数据
  fsrsCard: FSRSCard;

  // 学习统计
  totalReviews: number;          // 总复习次数
  correctCount: number;          // 答对次数
  wrongCount: number;            // 答错次数
  averageResponseTime: number;   // 平均答题时间（毫秒）

  // 下次复习时间（冗余存储，方便索引查询）
  nextReview: Date;

  // 熟练度级别（根据 FSRS 状态和间隔计算）
  proficiency: ProficiencyLevel;
}

/**
 * 复习记录
 * 扩展 ts-fsrs 的 ReviewLog
 */
export interface ReviewRecord extends ReviewLog {
  flashcardId: string;           // 所属卡片 ID
  responseTime: number;          // 答题时长（毫秒）
}

/**
 * 分组
 */
export interface FlashcardGroup {
  id: string;                    // 分组 ID
  name: string;                  // 分组名称
  description?: string;          // 描述
  color?: string;                // 颜色标识
  icon?: string;                 // 图标
  cardCount: number;             // 卡片数量
  createdAt: number;             // 创建时间
  updatedAt: number;             // 更新时间
}

/**
 * 学习会话
 */
export interface StudySession {
  id: string;                    // 会话 ID
  startTime: number;             // 开始时间
  endTime?: number;              // 结束时间
  cards: Flashcard[];            // 本次学习的卡片列表
  currentIndex: number;          // 当前卡片索引
  totalCards: number;            // 总卡片数
  reviewedCount: number;         // 已复习数量
  correctCount: number;          // 答对数量
  wrongCount: number;            // 答错数量
  status: 'active' | 'paused' | 'completed'; // 会话状态
}

/**
 * 学习统计（每日）
 */
export interface DailyStats {
  date: string;                  // 日期（YYYY-MM-DD）
  newCards: number;              // 新学卡片数（首次学习的新卡片数量）
  reviewedCards: number;         // 复习卡片数（去重，不包含新学的）
  masteredCards: number;         // 今日达到精通的卡片数
  totalAnswers: number;          // 总答题次数（包含重复答题）
  correctCount: number;          // 答对次数
  wrongCount: number;            // 答错次数
  totalStudyTime: number;        // 学习时长（毫秒）
  averageResponseTime: number;   // 平均答题时间

  // 辅助字段（用于去重统计）
  studiedCardIds: string[];      // 今天学习过的所有卡片ID
  newCardIds: string[];          // 今天新学的卡片ID
  masteredCardIds: string[];     // 今天达到精通的卡片ID
}

/**
 * 整体统计
 */
export interface OverallStats {
  totalCards: number;            // 总卡片数
  newCards: number;              // 新卡片数
  learningCards: number;         // 学习中卡片数
  reviewCards: number;           // 复习中卡片数
  masteredCards: number;         // 已精通卡片数

  todayDueNew: number;           // 今日待学习数（新卡片）
  todayDueReview: number;        // 今日待复习数（复习卡片）
  todayDue: number;              // 今日到期数（总计）
  todayNewLearned: number;       // 今日新学数（新卡片首次学习数量）
  todayReviewed: number;         // 今日复习数（去重，不包含新学的）
  todayMastered: number;         // 今日精通数（今日达到精通的卡片数）
  todayTotalAnswers: number;     // 今日答题次数（包含重复答题）
  todayCorrectRate: number;      // 今日正确率（0-100）

  totalReviews: number;          // 总复习次数
  totalStudyTime: number;        // 总学习时长（毫秒）
  averageCorrectRate: number;    // 平均正确率（0-100）

  streak: number;                // 连续学习天数
  longestStreak: number;         // 最长连续天数
}

/**
 * 创建 Flashcard 的参数
 */
export interface CreateFlashcardParams {
  word: string;
  translation: string;
  pronunciation?: string;
  examples?: string[];
  notes?: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  engine: TranslationEngine;
  groupId?: string;              // 可选，默认为 "default"
  tags?: string[];
}

/**
 * 更新 Flashcard 的参数
 */
export interface UpdateFlashcardParams {
  word?: string;
  translation?: string;
  pronunciation?: string;
  examples?: string[];
  notes?: string;
  groupId?: string;
  tags?: string[];
  favorite?: boolean;
}

/**
 * 搜索和筛选参数
 */
export interface FlashcardSearchParams {
  keyword?: string;              // 关键词（搜索 word 和 translation）
  groupId?: string;              // 分组 ID
  tags?: string[];               // 标签列表
  proficiency?: ProficiencyLevel[]; // 熟练度级别
  favorite?: boolean;            // 是否只显示收藏
  sourceLanguage?: LanguageCode; // 源语言
  targetLanguage?: LanguageCode; // 目标语言
  sortBy?: 'createdAt' | 'updatedAt' | 'nextReview' | 'word'; // 排序字段
  sortOrder?: 'asc' | 'desc';    // 排序顺序
}

/**
 * FSRS 配置参数
 */
export interface FSRSConfig {
  requestRetention?: number;     // 期望记忆保留率（默认 0.9）
  maximumInterval?: number;      // 最大复习间隔（天，默认 36500）
  w?: number[];                  // FSRS 权重参数（可选，使用默认值）
  enableFuzz?: boolean;          // 启用模糊化（默认 false）
  enableShortTerm?: boolean;     // 启用短期记忆（默认 true）
}
