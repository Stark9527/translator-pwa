import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabaseService } from '@/services/sync/SupabaseService';
import { syncService } from '@/services/sync/SyncService';

/**
 * 认证上下文类型
 */
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSyncing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  syncData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 认证上下文提供者
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // 初始化：检查是否有已登录的用户
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 初始化 Supabase 客户端
        supabaseService.initialize();

        // 检查是否有已存在的会话
        if (supabaseService.isInitialized()) {
          const session = await supabaseService.getSession();
          if (session?.user) {
            setUser(session.user);
            // 延迟同步，避免与定时器冲突
            // 使用 setTimeout 将同步推迟到下一个事件循环
            setTimeout(() => {
              syncData().catch(err => {
                console.error('初始化同步失败:', err);
              });
            }, 1000);
          }
        }
      } catch (error) {
        console.error('初始化认证失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // 设置定时同步（每10分钟同步一次）
  useEffect(() => {
    // 只有在已登录时才启动定时器
    if (!user) {
      return;
    }

    const SYNC_INTERVAL_MS = 10 * 60 * 1000; // 10分钟

    console.info('🔄 启动定时同步，间隔：10分钟');

    const intervalId = setInterval(async () => {
      if (supabaseService.isAuthenticated()) {
        // 使用 syncData 函数，它内置了并发控制
        syncData();
      }
    }, SYNC_INTERVAL_MS);

    // 清理函数：组件卸载或用户登出时清除定时器
    return () => {
      console.info('🛑 清除定时同步');
      clearInterval(intervalId);
    };
  }, [user]);

  /**
   * 登录
   */
  const signIn = async (email: string, password: string) => {
    const loggedInUser = await supabaseService.signInWithPassword(email, password);
    setUser(loggedInUser);

    // 登录成功后自动同步数据
    await syncData();
  };

  /**
   * 注册
   */
  const signUp = async (email: string, password: string) => {
    const newUser = await supabaseService.signUp(email, password);
    setUser(newUser);

    // 注册成功后自动同步数据
    await syncData();
  };

  /**
   * 登出
   */
  const signOut = async () => {
    await supabaseService.signOut();
    setUser(null);
  };

  /**
   * 同步数据
   */
  const syncData = async () => {
    if (!supabaseService.isAuthenticated()) {
      return;
    }

    // 如果已经在同步中，静默跳过
    if (isSyncing || syncService.getIsSyncing()) {
      console.info('⏸️  同步已在进行中，跳过此次请求');
      return;
    }

    try {
      setIsSyncing(true);
      await syncService.sync();
    } catch (error) {
      console.error('数据同步失败:', error);
      // 不抛出错误，避免阻断初始化流程
    } finally {
      setIsSyncing(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    isSyncing,
    signIn,
    signUp,
    signOut,
    syncData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * 使用认证上下文的 Hook
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth 必须在 AuthProvider 内部使用');
  }
  return context;
}
