-- 创建每日学习统计表 (daily_stats)
-- 用于存储用户的每日学习统计数据，支持跨设备同步

CREATE TABLE IF NOT EXISTS public.daily_stats (
  -- 主键和关联
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL, -- 日期 (YYYY-MM-DD)

  -- 学习统计数据
  new_cards INTEGER NOT NULL DEFAULT 0, -- 新学卡片数（首次学习的新卡片数量）
  reviewed_cards INTEGER NOT NULL DEFAULT 0, -- 复习卡片数（去重，不包含新学的）
  mastered_cards INTEGER NOT NULL DEFAULT 0, -- 今日达到精通的卡片数
  total_answers INTEGER NOT NULL DEFAULT 0, -- 总答题次数（包含重复答题）
  correct_count INTEGER NOT NULL DEFAULT 0, -- 答对次数
  wrong_count INTEGER NOT NULL DEFAULT 0, -- 答错次数

  -- 学习时长统计（毫秒）
  total_study_time BIGINT NOT NULL DEFAULT 0, -- 学习时长（毫秒）
  average_response_time INTEGER NOT NULL DEFAULT 0, -- 平均答题时间（毫秒）

  -- 辅助数据（用于去重统计，JSONB 数组）
  studied_card_ids JSONB NOT NULL DEFAULT '[]'::jsonb, -- 今天学习过的所有卡片ID
  new_card_ids JSONB NOT NULL DEFAULT '[]'::jsonb, -- 今天新学的卡片ID
  mastered_card_ids JSONB NOT NULL DEFAULT '[]'::jsonb, -- 今天达到精通的卡片ID

  -- 时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 唯一约束：每个用户每天只能有一条记录
  UNIQUE(user_id, date)
);

-- 添加索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_id ON public.daily_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON public.daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON public.daily_stats(user_id, date DESC);

-- 添加注释
COMMENT ON TABLE public.daily_stats IS '每日学习统计表，记录用户每天的学习数据';
COMMENT ON COLUMN public.daily_stats.new_cards IS '新学卡片数（首次学习的新卡片数量）';
COMMENT ON COLUMN public.daily_stats.reviewed_cards IS '复习卡片数（去重，不包含新学的）';
COMMENT ON COLUMN public.daily_stats.mastered_cards IS '今日达到精通的卡片数';
COMMENT ON COLUMN public.daily_stats.total_answers IS '总答题次数（包含重复答题）';
COMMENT ON COLUMN public.daily_stats.studied_card_ids IS '今天学习过的所有卡片ID（JSONB数组）';
COMMENT ON COLUMN public.daily_stats.new_card_ids IS '今天新学的卡片ID（JSONB数组）';
COMMENT ON COLUMN public.daily_stats.mastered_card_ids IS '今天达到精通的卡片ID（JSONB数组）';

-- 启用行级安全 (RLS)
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能访问自己的每日统计数据

-- 1. SELECT 策略：用户只能查看自己的数据
CREATE POLICY "Users can view their own daily stats"
  ON public.daily_stats
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. INSERT 策略：用户只能插入自己的数据
CREATE POLICY "Users can insert their own daily stats"
  ON public.daily_stats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE 策略：用户只能更新自己的数据
CREATE POLICY "Users can update their own daily stats"
  ON public.daily_stats
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. DELETE 策略：用户只能删除自己的数据
CREATE POLICY "Users can delete their own daily stats"
  ON public.daily_stats
  FOR DELETE
  USING (auth.uid() = user_id);

-- 创建触发器：自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_daily_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_stats_updated_at
  BEFORE UPDATE ON public.daily_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_stats_updated_at();
