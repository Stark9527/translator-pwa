import { ProficiencyLevel } from '@/types/flashcard';
import { cn } from '@/utils/cn';

interface ProficiencyBadgeProps {
  level: ProficiencyLevel;
  className?: string;
}

const proficiencyConfig = {
  [ProficiencyLevel.New]: {
    label: '新卡片',
    className: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
  },
  [ProficiencyLevel.Learning]: {
    label: '学习中',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
  },
  [ProficiencyLevel.Review]: {
    label: '复习中',
    className: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  },
  [ProficiencyLevel.Mastered]: {
    label: '已精通',
    className: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
  },
};

export function ProficiencyBadge({ level, className }: ProficiencyBadgeProps) {
  const config = proficiencyConfig[level];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
