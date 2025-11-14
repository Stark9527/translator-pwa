# UI 组件库

基于 Tailwind CSS 和 Radix UI 的组件库。

## Icon 组件

统一的图标组件，基于 `lucide-react`。

### 基础用法

```tsx
import { Icon } from '@/components/ui';
import { Settings, Languages, Copy } from 'lucide-react';

function MyComponent() {
  return (
    <div>
      <Icon icon={Settings} />
      <Icon icon={Languages} />
      <Icon icon={Copy} />
    </div>
  );
}
```

### 尺寸变体

支持 5 种预定义尺寸：

```tsx
<Icon icon={Settings} size="xs" />  {/* 12px / h-3 w-3 */}
<Icon icon={Settings} size="sm" />  {/* 16px / h-4 w-4 */}
<Icon icon={Settings} size="md" />  {/* 20px / h-5 w-5 (默认) */}
<Icon icon={Settings} size="lg" />  {/* 24px / h-6 w-6 */}
<Icon icon={Settings} size="xl" />  {/* 32px / h-8 w-8 */}
```

### 自定义样式

可以通过 `className` 添加自定义样式：

```tsx
<Icon
  icon={Check}
  size="sm"
  className="text-green-500"
/>

<Icon
  icon={Loader2}
  className="animate-spin text-primary"
/>
```

### 在按钮中使用

```tsx
<button className="inline-flex items-center gap-2">
  <Icon icon={Languages} size="sm" />
  <span>翻译</span>
</button>
```

### 所有可用属性

Icon 组件支持所有 `lucide-react` 的属性（除了 `size`），例如：

```tsx
<Icon
  icon={Settings}
  size="md"
  strokeWidth={2}
  absoluteStrokeWidth
  className="text-blue-500"
/>
```

### 直接使用 lucide-react

如果不需要统一的尺寸管理，也可以直接使用 `lucide-react`：

```tsx
import { Settings } from 'lucide-react';

<Settings className="h-4 w-4" />
```

## 常用图标

项目中常用的图标可以从 `icon.example.tsx` 中导入：

```tsx
import {
  Languages,
  Volume2,
  Copy,
  Check,
  Settings,
} from '@/components/ui/icon.example';
```

更多图标请访问：https://lucide.dev/icons/
