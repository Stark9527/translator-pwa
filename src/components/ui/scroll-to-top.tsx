import { useState, useEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ScrollToTopProps {
  /**
   * 滚动容器的 ref（如果不提供，则默认监听 window）
   */
  containerRef?: React.RefObject<HTMLElement>;
  /**
   * 显示按钮的滚动距离阈值（默认 200px）
   */
  threshold?: number;
  /**
   * 自定义样式类名
   */
  className?: string;
}

/**
 * 返回顶部按钮组件
 * 当页面滚动超过指定距离时显示，点击后平滑滚动回顶部
 */
export function ScrollToTop({
  containerRef,
  threshold = 200,
  className
}: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const throttleDelay = 150; // 节流延迟，毫秒

  useEffect(() => {
    // 如果没有传递 containerRef，或者传递的不是真正的滚动容器，
    // 则尝试找到 main 元素（AppLayout 中的主滚动容器）
    let container = containerRef?.current;

    if (!container) {
      const mainElement = document.querySelector('main');
      container = mainElement as HTMLElement;
    } else {
      // 如果容器没有滚动（scrollHeight == clientHeight），尝试找父元素
      if (container.scrollHeight === container.clientHeight) {
        const mainElement = document.querySelector('main');
        container = mainElement as HTMLElement;
      }
    }

    const toggleVisibility = () => {
      const now = Date.now();

      // 取消之前的调度
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // 只有在超过节流延迟后才更新状态
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

      if (timeSinceLastUpdate < throttleDelay) {
        // 如果还在节流期内，延迟到节流期结束后再执行
        const remainingTime = throttleDelay - timeSinceLastUpdate;
        timeoutRef.current = setTimeout(() => {
          rafRef.current = requestAnimationFrame(updateVisibility);
        }, remainingTime);
      } else {
        // 否则立即在下一帧执行
        rafRef.current = requestAnimationFrame(updateVisibility);
      }
    };

    const updateVisibility = () => {
      let scrollTop = 0;

      if (container) {
        scrollTop = container.scrollTop;
      } else {
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      }

      const shouldBeVisible = scrollTop > threshold;

      // 只在状态真正需要改变时才更新
      setIsVisible(prev => {
        if (prev !== shouldBeVisible) {
          lastUpdateTimeRef.current = Date.now();
          return shouldBeVisible;
        }
        return prev;
      });
    };

    // 初始检查
    updateVisibility();

    // 监听滚动事件
    if (container) {
      container.addEventListener('scroll', toggleVisibility, { passive: true });
    } else {
      window.addEventListener('scroll', toggleVisibility, { passive: true });
    }

    return () => {
      // 清理所有定时器和动画帧
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }

      if (container) {
        container.removeEventListener('scroll', toggleVisibility);
      } else {
        window.removeEventListener('scroll', toggleVisibility);
      }
    };
  }, [containerRef, threshold]);

  const scrollToTop = () => {
    // 同样的逻辑：找到真正的滚动容器
    let container = containerRef?.current;

    if (!container) {
      container = document.querySelector('main') as HTMLElement;
    } else if (container.scrollHeight === container.clientHeight) {
      container = document.querySelector('main') as HTMLElement;
    }

    if (container) {
      container.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={scrollToTop}
      className={cn(
        'fixed bottom-20 right-4 w-9 h-9 rounded-full',
        'bg-primary text-primary-foreground shadow-lg',
        'flex items-center justify-center',
        'transition-opacity duration-200 ease-in-out',
        'hover:bg-primary/90 hover:scale-110',
        'active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'md:bottom-6',
        'z-[100]',
        '[will-change:opacity]',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        className
      )}
      aria-label="返回顶部"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}
