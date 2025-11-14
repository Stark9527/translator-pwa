import { useState, useEffect } from 'react';
import { Flame, Target, Library, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { OverallStats } from '@/types/flashcard';
import { ProficiencyLevel } from '@/types/flashcard';
import { analyticsService } from '@/services/flashcard';
import { Icon } from '@/components/ui/icon';
import { ProgressRing } from '@/components/flashcard/ProgressRing';

const PROFICIENCY_COLORS = {
  [ProficiencyLevel.New]: '#9ca3af', // gray
  [ProficiencyLevel.Learning]: '#eab308', // yellow
  [ProficiencyLevel.Review]: '#3b82f6', // blue
  [ProficiencyLevel.Mastered]: '#22c55e', // green
};

const PROFICIENCY_LABELS = {
  [ProficiencyLevel.New]: '新卡片',
  [ProficiencyLevel.Learning]: '学习中',
  [ProficiencyLevel.Review]: '复习中',
  [ProficiencyLevel.Mastered]: '已精通',
};

export default function StatisticsPage() {
  // 全局统计
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [proficiencyData, setProficiencyData] = useState<Array<{
    name: string;
    value: number;
    color: string;
  }>>([]);
  const [learningCurve, setLearningCurve] = useState<Array<{
    date: string;
    newCards: number;
    reviewedCards: number;
    masteredCards: number;
    correctCount: number;
    wrongCount: number;
    accuracy: number;
  }>>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [groupStats, setGroupStats] = useState<Array<{
    groupId: string;
    groupName: string;
    totalCards: number;
    newCards: number;
    learningCards: number;
    reviewCards: number;
    masteredCards: number;
    dueCards: number;
  }>>([]);

  // 加载所有统计数据（只在初始化时加载一次）
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      try {
        // 加载全局统计
        const overall = await analyticsService.getOverallStats();
        setStats(overall);

        // 加载熟练度分布
        const distribution = await analyticsService.getProficiencyDistribution();
        const pieData = Object.entries(distribution)
          .filter(([level]) => level !== 'total') // 排除 total 字段
          .map(([level, count]) => ({
            name: PROFICIENCY_LABELS[level as ProficiencyLevel],
            value: count,
            color: PROFICIENCY_COLORS[level as ProficiencyLevel],
          }))
          .filter(item => item.value > 0);
        setProficiencyData(pieData);

        // 加载学习曲线
        const curve = await analyticsService.getLearningCurve(7);
        setLearningCurve(curve);

        // 加载分组统计
        const groupStatsData = await analyticsService.getStatsByGroup();
        setGroupStats(groupStatsData);
      } catch (error) {
        console.error('Failed to load statistics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAllData();
  }, []);

  if (isLoading && !stats) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">无法加载统计数据</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <h1 className="text-lg font-bold text-foreground mb-4">学习统计</h1>

      {/* 全局统计卡片 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* 连续学习 */}
        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Icon icon={Flame} size="sm" className="text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.streak}</p>
              <p className="text-xs text-muted-foreground">连续天数</p>
            </div>
          </div>
        </div>

        {/* 今日待学习/待复习 */}
        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Icon icon={Target} size="sm" className="text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">今日任务</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">待学习</span>
              <span className="text-lg font-bold text-green-600">{stats.todayDueNew}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">待复习</span>
              <span className="text-lg font-bold text-orange-600">{stats.todayDueReview}</span>
            </div>
          </div>
        </div>

        {/* 总卡片数 */}
        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Icon icon={Library} size="sm" className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalCards}</p>
              <p className="text-xs text-muted-foreground">总卡片数</p>
            </div>
          </div>
        </div>

        {/* 今日学习统计 */}
        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <ProgressRing percentage={stats.todayCorrectRate} size={40} />
            <div>
              <p className="text-xs text-muted-foreground">今日正确率</p>
              <p className="text-lg font-bold text-foreground">{stats.todayCorrectRate}%</p>
            </div>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>已答题</span>
              <span className="font-medium text-foreground">{stats.todayTotalAnswers} 次</span>
            </div>
          </div>
        </div>
      </div>

      {/* 学习曲线 */}
      {learningCurve.length > 0 && (
        <div className="p-4 bg-card border border-border rounded-lg mb-6">
          <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Icon icon={TrendingUp} size="sm" className="text-primary" />
            <span>最近 7 天学习曲线</span>
          </h2>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={learningCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => {
                  return [`${value} 张`, name];
                }}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return `${date.getMonth() + 1}月${date.getDate()}日`;
                }}
              />
              <Line
                type="monotone"
                dataKey="newCards"
                stroke="#22c55e"
                strokeWidth={2}
                name="新学"
              />
              <Line
                type="monotone"
                dataKey="reviewedCards"
                stroke="#3b82f6"
                strokeWidth={2}
                name="复习"
              />
              <Line
                type="monotone"
                dataKey="masteredCards"
                stroke="#a855f7"
                strokeWidth={2}
                name="精通"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 熟练度分布 */}
      {proficiencyData.length > 0 && (
        <div className="p-4 bg-card border border-border rounded-lg mb-6">
          <h2 className="text-sm font-medium text-foreground mb-4">熟练度分布</h2>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={proficiencyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {proficiencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 图例 */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {proficiencyData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-muted-foreground">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 分组对比视图 */}
      {groupStats.length > 0 && (
        <div className="p-4 bg-card border border-border rounded-lg">
          <h2 className="text-sm font-medium text-foreground mb-4">分组统计对比</h2>
          <div className="space-y-3">
            {groupStats.map((stat) => (
              <div
                key={stat.groupId}
                className="p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-foreground">{stat.groupName}</h3>
                  <span className="text-xs text-muted-foreground">
                    共 {stat.totalCards} 张
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="text-center">
                    <div className="text-muted-foreground/60 mb-0.5">新卡片</div>
                    <div className="font-medium text-gray-500">{stat.newCards}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground/60 mb-0.5">学习中</div>
                    <div className="font-medium text-yellow-600">{stat.learningCards}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground/60 mb-0.5">复习中</div>
                    <div className="font-medium text-blue-600">{stat.reviewCards}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground/60 mb-0.5">已精通</div>
                    <div className="font-medium text-green-600">{stat.masteredCards}</div>
                  </div>
                </div>
                {stat.dueCards > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <span className="text-xs text-orange-600">
                      📌 {stat.dueCards} 张待复习
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
