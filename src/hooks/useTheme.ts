import { useEffect } from 'react';
import { ConfigService } from '@/services/config/ConfigService';

/**
 * 主题管理 Hook
 * 监听配置变化并应用主题到 DOM
 */
export function useTheme() {
  useEffect(() => {
    // 应用主题的函数
    const applyTheme = (theme: 'light' | 'dark' | 'auto') => {
      const root = document.documentElement;

      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        // auto 模式：跟随系统主题
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    // 初始化主题
    const initTheme = async () => {
      const config = await ConfigService.getConfig();
      applyTheme(config.theme || 'auto');
    };

    initTheme();

    // 监听配置变化
    const unsubscribe = ConfigService.addConfigChangeListener((config, changes) => {
      if (changes.theme !== undefined) {
        applyTheme(config.theme || 'auto');
      }
    });

    // 监听系统主题变化（仅在 auto 模式下）
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = async () => {
      const config = await ConfigService.getConfig();
      if (config.theme === 'auto') {
        applyTheme('auto');
      }
    };

    // 使用新的 addEventListener API（如果支持）
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      // 兼容旧版浏览器
      mediaQuery.addListener(handleSystemThemeChange);
    }

    // 清理函数
    return () => {
      unsubscribe();
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, []);
}
