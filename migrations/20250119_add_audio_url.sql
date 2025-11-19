-- 添加 audio_url 字段到 flashcards 表
-- 迁移日期: 2025-01-19
-- 描述: 为 flashcards 表添加 audio_url 字段，用于存储真实发音音频的 URL

-- 添加字段
ALTER TABLE flashcards
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- 添加注释
COMMENT ON COLUMN flashcards.audio_url IS '发音音频URL（来自 Free Dictionary API）';

-- 为该字段创建索引（可选，如果需要按 audio_url 查询）
-- CREATE INDEX IF NOT EXISTS idx_flashcards_audio_url ON flashcards(audio_url) WHERE audio_url IS NOT NULL;
