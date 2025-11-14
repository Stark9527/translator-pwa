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
            // 如果已登录，自动同步数据
            await syncData();
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

    try {
      setIsSyncing(true);
      await syncService.sync();
    } catch (error) {
      console.error('数据同步失败:', error);
      throw error;
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
