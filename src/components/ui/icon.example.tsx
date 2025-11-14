/**
 * Icon 组件使用示例
 *
 * 这个文件展示了如何使用 Icon 组件
 * 使用时可以删除此文件
 */

import { Icon } from './icon';
import {
  Settings,
  Languages,
  Copy,
  Check,
  X,
  ChevronDown,
  Search,
  Volume2,
  Loader2
} from 'lucide-react';

export function IconExamples() {
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-medium">Icon 组件示例</h2>

      {/* 基础用法 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">基础用法</h3>
        <div className="flex items-center gap-2">
          <Icon icon={Settings} />
          <Icon icon={Languages} />
          <Icon icon={Copy} />
        </div>
      </div>

      {/* 不同尺寸 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">不同尺寸</h3>
        <div className="flex items-center gap-4">
          <Icon icon={Settings} size="xs" />
          <Icon icon={Settings} size="sm" />
          <Icon icon={Settings} size="md" />
          <Icon icon={Settings} size="lg" />
          <Icon icon={Settings} size="xl" />
        </div>
      </div>

      {/* 自定义颜色 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">自定义颜色</h3>
        <div className="flex items-center gap-2">
          <Icon icon={Check} className="text-green-500" />
          <Icon icon={X} className="text-red-500" />
          <Icon icon={Settings} className="text-blue-500" />
        </div>
      </div>

      {/* 在按钮中使用 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">在按钮中使用</h3>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md">
            <Icon icon={Languages} size="sm" />
            <span>翻译</span>
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 border rounded-md">
            <Icon icon={Copy} size="sm" />
            <span>复制</span>
          </button>
        </div>
      </div>

      {/* 加载状态 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">加载动画</h3>
        <Icon icon={Loader2} className="animate-spin" />
      </div>

      {/* 直接使用 lucide-react（不通过 Icon 组件）*/}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">直接使用 lucide-react</h3>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Volume2 className="h-5 w-5" />
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

/**
 * 常用图标导出
 * 可以直接从这里导入常用的图标，避免重复导入
 */
export {
  // 翻译相关
  Languages,
  Volume2,

  // 操作相关
  Copy,
  Check,
  X,
  Settings,
  Search,

  // UI 相关
  ChevronDown,
  Loader2,
} from 'lucide-react';
