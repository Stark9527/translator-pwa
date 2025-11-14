import { Menu, Cloud, CloudOff, User } from 'lucide-react';
import { cn } from '@/utils/cn';

interface HeaderProps {
  title: string;
  showMenu?: boolean;
  onMenuClick?: () => void;
  isSyncing?: boolean;
  isOnline?: boolean;
  userEmail?: string | null;
  onUserClick?: () => void;
}

/**
 * 顶部导航栏组件
 * 显示标题、同步状态、用户信息
 */
export function Header({
  title,
  showMenu = false,
  onMenuClick,
  isSyncing = false,
  isOnline = true,
  userEmail,
  onUserClick,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* 左侧：菜单按钮（桌面端） + 标题 */}
        <div className="flex items-center gap-3">
          {showMenu && (
            <button
              onClick={onMenuClick}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg hover:bg-accent transition-colors"
              aria-label="打开菜单"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>

        {/* 右侧：同步状态 + 用户信息 */}
        <div className="flex items-center gap-3">
          {/* 同步状态指示器 */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isSyncing ? (
              <>
                <Cloud className="w-4 h-4 animate-pulse text-primary" />
                <span className="hidden sm:inline">同步中...</span>
              </>
            ) : isOnline ? (
              <>
                <Cloud className="w-4 h-4 text-green-500" />
                <span className="hidden sm:inline">已同步</span>
              </>
            ) : (
              <>
                <CloudOff className="w-4 h-4 text-orange-500" />
                <span className="hidden sm:inline">离线</span>
              </>
            )}
          </div>

          {/* 用户头像/登录按钮 */}
          <button
            onClick={onUserClick}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
              userEmail
                ? 'hover:bg-accent'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
            aria-label={userEmail ? '用户菜单' : '登录'}
          >
            <User className="w-4 h-4" />
            {userEmail ? (
              <span className="hidden sm:inline text-sm max-w-[120px] truncate">
                {userEmail}
              </span>
            ) : (
              <span className="text-sm">登录</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
