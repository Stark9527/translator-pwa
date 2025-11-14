import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

/**
 * PWA 安装提示组件
 * 在应用可安装时显示横幅提示用户安装
 */
export function InstallPrompt() {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const [isDismissed, setIsDismissed] = useState(false);

  // 如果已安装、不可安装或已关闭，则不显示
  if (isInstalled || !isInstallable || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    await promptInstall();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          {/* 图标 */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
            <Download className="w-6 h-6" />
          </div>

          {/* 内容 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1">安装翻译助手</h3>
            <p className="text-sm opacity-90 mb-3">
              安装到主屏幕，像原生应用一样使用，支持离线访问
            </p>

            {/* 按钮组 */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="px-4 py-2 bg-primary-foreground text-primary rounded-lg font-medium hover:bg-primary-foreground/90 transition-colors text-sm"
              >
                立即安装
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
              >
                稍后再说
              </button>
            </div>
          </div>

          {/* 关闭按钮 */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 hover:bg-primary-foreground/10 rounded transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * iOS Safari 安装引导组件
 * iOS 不支持自动提示，需要手动引导用户
 */
export function IOSInstallGuide() {
  const [isVisible, setIsVisible] = useState(false);

  // 检测是否是 iOS Safari
  const isIOSSafari = () => {
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const webkit = /WebKit/.test(ua);
    const standalone = (window.navigator as any).standalone;

    return iOS && webkit && !standalone;
  };

  // 只在 iOS Safari 且未安装时显示
  if (!isIOSSafari() || !isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-background rounded-t-2xl md:rounded-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
            <Download className="w-8 h-8 text-primary" />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">安装到主屏幕</h3>
            <p className="text-sm text-muted-foreground">
              在 Safari 浏览器中，点击分享按钮
              <span className="inline-block mx-1 text-primary">⎋</span>
              然后选择"添加到主屏幕"
            </p>
          </div>

          <div className="space-y-2 text-left">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                1
              </div>
              <p className="text-sm">点击底部工具栏的分享按钮</p>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                2
              </div>
              <p className="text-sm">向下滚动，找到"添加到主屏幕"</p>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                3
              </div>
              <p className="text-sm">点击"添加"完成安装</p>
            </div>
          </div>

          <button
            onClick={() => setIsVisible(false)}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}
