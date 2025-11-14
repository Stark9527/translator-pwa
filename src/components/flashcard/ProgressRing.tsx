import { cn } from '@/utils/cn';

interface ProgressRingProps {
  percentage: number; // 0-100
  size?: number; // 直径（像素）
  strokeWidth?: number; // 线条宽度
  className?: string;
  showLabel?: boolean; // 是否显示百分比文字
}

export function ProgressRing({
  percentage,
  size = 60,
  strokeWidth = 4,
  className,
  showLabel = true,
}: ProgressRingProps) {
  // 确保 percentage 在 0-100 之间
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  // 计算 SVG 参数
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedPercentage / 100) * circumference;

  // 根据进度选择颜色
  const getStrokeColor = () => {
    if (clampedPercentage >= 80) return '#22c55e'; // green
    if (clampedPercentage >= 50) return '#3b82f6'; // blue
    if (clampedPercentage >= 20) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* 背景圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/30"
        />
        {/* 进度圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>

      {/* 百分比文字 */}
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-foreground">
            {Math.round(clampedPercentage)}%
          </span>
        </div>
      )}
    </div>
  );
}
