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
      let scrollTop = 0;

      if (container) {
        scrollTop = container.scrollTop;
      } else {
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      }

      setIsVisible(scrollTop > threshold);
    };

    // 初始检查
    toggleVisibility();

    // 监听滚动事件
    if (container) {
      container.addEventListener('scroll', toggleVisibility, { passive: true });
    } else {
      window.addEventListener('scroll', toggleVisibility, { passive: true });
    }

    return () => {
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
        'transition-all duration-300 ease-in-out',
        'hover:bg-primary/90 hover:scale-110',
        'active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'md:bottom-6',
        isVisible ? 'opacity-100 translate-y-0 z-[100]' : 'opacity-0 translate-y-4 pointer-events-none z-[-1]',
        className
      )}
      aria-label="返回顶部"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}
