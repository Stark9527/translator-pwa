import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { InstallPrompt } from '../InstallPrompt';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/**
 * 应用主布局组件
 * 包含 Header、内容区域、底部导航栏
 */
export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnline = useOnlineStatus();

  // TODO: 从实际的状态管理中获取这些值
  const isSyncing = false;
  const userEmail = null; // 从 Supabase Auth 获取

  // 根据当前路由显示不同的标题
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return '翻译';
    if (path.startsWith('/flashcards')) return 'Flashcard';
    if (path.startsWith('/statistics')) return '学习统计';
    if (path.startsWith('/settings')) return '设置';
    if (path.startsWith('/login')) return '登录';
    return '翻译助手';
  };

  const handleUserClick = () => {
    if (userEmail) {
      // 已登录，显示用户菜单或跳转到设置
      navigate('/settings');
    } else {
      // 未登录，跳转到登录页面
      navigate('/login');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 顶部导航栏 */}
      <Header
        title={getPageTitle()}
        isSyncing={isSyncing}
        isOnline={isOnline}
        userEmail={userEmail}
        onUserClick={handleUserClick}
      />

      {/* 主内容区域 */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* 底部导航栏（仅移动端显示） */}
      <BottomNav />

      {/* PWA 安装提示 */}
      <InstallPrompt />
    </div>
  );
}
