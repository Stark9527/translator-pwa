// Flashcard 服务统一导出

// 数据库服务
export { FlashcardDB, flashcardDB } from './FlashcardDB';

// FSRS 算法服务
export { FSRSService, fsrsService, Rating, State } from './FSRSService';

// 业务服务
export { FlashcardService, flashcardService } from './FlashcardService';

// 学习会话服务
export { StudySessionService, studySessionService } from './StudySessionService';

// 统计分析服务
export {
  AnalyticsService,
  analyticsService,
  type LearningCurveData,
  type ProficiencyDistribution,
  type HeatmapData,
} from './AnalyticsService';
