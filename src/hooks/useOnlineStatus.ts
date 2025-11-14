import { useState, useEffect } from 'react';

/**
 * 在线状态检测 Hook
 * 监听浏览器在线/离线状态变化
 *
 * @returns 当前是否在线
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isOnline = useOnlineStatus();
 *
 *   return (
 *     <div>
 *       {isOnline ? '在线' : '离线'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => {
    // 初始状态：检查当前在线状态
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true; // SSR 默认为在线
  });

  useEffect(() => {
    // 在线事件处理
    const handleOnline = () => {
      console.info('Network status: Online');
      setIsOnline(true);
    };

    // 离线事件处理
    const handleOffline = () => {
      console.warn('Network status: Offline');
      setIsOnline(false);
    };

    // 监听在线/离线事件
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 清理事件监听
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
