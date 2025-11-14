import { NavLink } from 'react-router-dom';
import { FileText, BookOpen, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/utils/cn';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  {
    to: '/',
    icon: FileText,
    label: '翻译',
  },
  {
    to: '/flashcards',
    icon: BookOpen,
    label: '卡片',
  },
  {
    to: '/statistics',
    icon: BarChart3,
    label: '统计',
  },
  {
    to: '/settings',
    icon: Settings,
    label: '设置',
  },
];

/**
 * 底部导航栏组件
 * 移动端主导航，固定在底部
 */
export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[60px]',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'w-5 h-5 transition-transform',
                    isActive && 'scale-110'
                  )}
                />
                <span className="text-xs font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
