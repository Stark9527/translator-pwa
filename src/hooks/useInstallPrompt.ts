import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UseInstallPromptReturn {
  /**
   * 是否可以安装 PWA
   */
  isInstallable: boolean;

  /**
   * 是否已经安装
   */
  isInstalled: boolean;

  /**
   * 触发安装提示
   */
  promptInstall: () => Promise<void>;

  /**
   * 用户是否接受安装
   */
  userChoice: 'accepted' | 'dismissed' | null;
}

/**
 * PWA 安装提示 Hook
 * 监听并处理 PWA 安装事件
 *
 * @returns 安装状态和安装方法
 *
 * @example
 * ```tsx
 * function InstallButton() {
 *   const { isInstallable, promptInstall, userChoice } = useInstallPrompt();
 *
 *   if (!isInstallable) return null;
 *
 *   return (
 *     <button onClick={promptInstall}>
 *       安装应用
 *     </button>
 *   );
 * }
 * ```
 */
export function useInstallPrompt(): UseInstallPromptReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [userChoice, setUserChoice] = useState<'accepted' | 'dismissed' | null>(null);

  useEffect(() => {
    // 检查是否已经安装
    const checkInstalled = () => {
      // 检查是否在独立模式运行（已安装）
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        console.info('PWA: Already installed');
        return;
      }

      // 检查是否在 iOS Safari 独立模式
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        console.info('PWA: Already installed (iOS)');
        return;
      }
    };

    checkInstalled();

    // 监听 beforeinstallprompt 事件
    const handleBeforeInstallPrompt = (e: Event) => {
      const event = e as BeforeInstallPromptEvent;

      // 阻止默认的安装提示
      e.preventDefault();

      // 保存事件，以便后续手动触发
      setDeferredPrompt(event);
      setIsInstallable(true);

      console.info('PWA: Install prompt available');
    };

    // 监听 appinstalled 事件
    const handleAppInstalled = () => {
      console.info('PWA: App installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /**
   * 触发安装提示
   */
  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.warn('PWA: Install prompt not available');
      return;
    }

    // 显示安装提示
    await deferredPrompt.prompt();

    // 等待用户响应
    const choiceResult = await deferredPrompt.userChoice;

    console.info('PWA: User choice:', choiceResult.outcome);
    setUserChoice(choiceResult.outcome);

    if (choiceResult.outcome === 'accepted') {
      console.info('PWA: User accepted the install prompt');
    } else {
      console.info('PWA: User dismissed the install prompt');
    }

    // 清除保存的事件
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    userChoice,
  };
}
