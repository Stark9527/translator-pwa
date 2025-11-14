// Supabase 数据库类型定义（完全匹配实际数据库架构）

/**
 * 分组表（groups）
 */
export interface GroupRow {
  id: string; // UUID
  user_id: string; // UUID
  name: string;
  description?: string | null;
  color: string;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

/**
 * Flashcard 卡片表（flashcards）
 */
export interface FlashcardRow {
  id: string; // UUID
  user_id: string; // UUID
  group_id?: string | null; // UUID, nullable

  // 基础字段
  word: string;
  translation: string;
  phonetic?: string | null;
  definitions: any[]; // JSONB
  examples: any[]; // JSONB

  // FSRS 算法字段（展开存储）
  state: 'new' | 'learning' | 'review' | 'relearning';
  due: string; // TIMESTAMPTZ
  stability: number; // FLOAT
  difficulty: number; // FLOAT
  elapsed_days: number; // INTEGER
  scheduled_days: number; // INTEGER
  reps: number; // INTEGER
  lapses: number; // INTEGER
  last_review?: string | null; // TIMESTAMPTZ

  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

/**
 * 复习记录表（reviews）
 */
export interface ReviewRow {
  id: string; // UUID
  user_id: string; // UUID
  flashcard_id: string; // UUID
  rating: number; // 1-4
  state: 'new' | 'learning' | 'review' | 'relearning';
  review_duration?: number | null; // 秒
  created_at: string; // TIMESTAMPTZ
}

/**
 * 用户配置表（user_configs）
 */
export interface UserConfigRow {
  id: string; // UUID
  user_id: string; // UUID
  config: any; // JSONB
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

/**
 * 同步状态
 */
export enum SyncStatus {
  Idle = 'idle',
  Syncing = 'syncing',
  Success = 'success',
  Error = 'error',
}

/**
 * 同步结果
 */
export interface SyncResult {
  status: SyncStatus;
  uploadedCount: number;
  downloadedCount: number;
  conflictCount: number;
  error?: string;
  timestamp: number;
}

/**
 * 同步配置
 */
export interface SyncConfig {
  autoSync: boolean;
  syncInterval: number;
  conflictResolution: 'local' | 'remote' | 'newer';
}
