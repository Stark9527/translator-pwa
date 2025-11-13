# PWA翻译助手开发规划文档

> **项目名称**：智能翻译助手 PWA 版本
> **基于项目**：Chrome Extension 翻译助手
> **开发时间**：预计 3-5 周
> **代码复用率**：70-80%
> **创建日期**：2025-11-13

---

## 📋 目录

1. [项目概述](#项目概述)
2. [技术选型](#技术选型)
3. [依赖版本管理](#依赖版本管理)
4. [功能清单](#功能清单)
5. [开发阶段](#开发阶段)
6. [项目目录结构](#项目目录结构)
7. [代码复用策略](#代码复用策略)
8. [关键技术实现](#关键技术实现)
9. [部署方案](#部署方案)
10. [时间线与里程碑](#时间线与里程碑)
11. [后续扩展计划](#后续扩展计划)

---

## 📖 项目概述

### 项目背景

本项目旨在将现有的 Chrome Extension 翻译助手改造为 **PWA（渐进式Web应用）**，使其能够在移动设备和桌面浏览器上独立运行，提供接近原生应用的体验。

### 核心优势

- ✅ **跨平台支持**：一套代码，支持 iOS、Android、桌面浏览器
- ✅ **可安装性**：可添加到手机主屏幕，像原生应用一样使用
- ✅ **离线功能**：支持离线使用 Flashcard 学习系统
- ✅ **高代码复用**：70-80% 代码直接复用自现有项目
- ✅ **快速部署**：无需应用商店审核，立即上线

### 保留功能

1. **文本翻译**：输入框翻译，支持多语言互译
2. **字典查询**：详细释义、音标、例句
3. **Flashcard 学习系统**：完整的 FSRS 间隔重复学习算法
4. **云端同步**：基于 Supabase 的多设备数据同步
5. **数据导入导出**：支持 JSON/Anki CSV 格式

### 移除功能

- ❌ **划词翻译**：浏览器安全限制，PWA 无法实现
- ❌ **右键菜单**：浏览器扩展专属功能
- ❌ **快捷键**：部分快捷键受浏览器限制

---

## 🛠 技术选型

### 前端框架与工具链

```json
{
  "核心框架": {
    "React": "18.3.1",
    "TypeScript": "5.3.3",
    "Vite": "5.0.11"
  },
  "构建工具": {
    "vite-plugin-pwa": "^0.17.0",  // PWA 构建插件
    "workbox-window": "^7.0.0"     // Service Worker 工具
  }
}
```

### UI 库与样式

```json
{
  "UI 框架": "Tailwind CSS 3.4.1",
  "组件库": "@radix-ui/react-* (复用现有)",
  "图标库": "lucide-react 0.309.0",
  "数据可视化": "recharts 3.3.0"
}
```

### 状态管理与数据流

```json
{
  "状态管理": "zustand 4.5.0",
  "不可变数据": "immer 10.0.3",
  "数据验证": "zod 3.22.4",
  "路由": "react-router-dom 6.30.1"
}
```

### 存储与云服务

```json
{
  "本地存储": {
    "localStorage": "配置管理",
    "IndexedDB": "Flashcard 数据库（直接复用）",
    "内存缓存": "LRU 翻译缓存"
  },
  "云端存储": {
    "Supabase": "2.81.1（用户认证 + 数据同步）"
  }
}
```

### 学习算法

```json
{
  "间隔重复算法": "ts-fsrs 5.2.3（FSRS v5.0）",
  "日期处理": "date-fns 3.6.0"
}
```

---

## 📦 依赖版本管理

> ⚠️ **重要提示**：为了确保代码复用的顺利进行，PWA 项目必须与原 Chrome Extension 项目保持相同的依赖版本。版本不一致可能导致类型不兼容、运行时错误或编译失败。

### 必须保持一致的依赖（核心依赖）

这些依赖被复用的代码使用，**必须与原项目保持完全相同的版本号**：

#### 生产依赖（dependencies）

```json
{
  "核心框架": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1"
  },

  "UI 组件库": {
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-radio-group": "^1.3.8",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.2.8"
  },

  "样式工具": {
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },

  "云服务与数据": {
    "@supabase/supabase-js": "^2.81.1",
    "ts-fsrs": "^5.2.3",
    "zustand": "^4.5.0",
    "immer": "^10.0.3",
    "zod": "^3.22.4"
  },

  "工具库": {
    "axios": "^1.6.5",
    "date-fns": "^3.6.0",
    "dompurify": "^3.0.8",
    "lodash-es": "^4.17.21",
    "lucide-react": "^0.309.0",
    "recharts": "^3.3.0",
    "uuid": "^13.0.0"
  }
}
```

#### 开发依赖（devDependencies）

```json
{
  "TypeScript 相关": {
    "typescript": "^5.3.3",
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "@types/dompurify": "^3.0.5",
    "@types/lodash-es": "^4.17.12",
    "@types/uuid": "^10.0.0"
  },

  "构建工具": {
    "vite": "^5.0.11",
    "@vitejs/plugin-react": "^4.2.1"
  },

  "代码质量": {
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "prettier": "^3.2.4"
  },

  "样式工具": {
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33"
  },

  "测试工具": {
    "vitest": "^1.2.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.2.0"
  }
}
```

---

### 需要移除的依赖（Chrome Extension 特有）

这些依赖是 Chrome Extension 专用的，在 PWA 项目中不需要：

```json
{
  "移除的依赖": {
    "@crxjs/vite-plugin": "^2.0.0-beta.21",
    "@types/chrome": "^0.0.260",
    "webextension-polyfill": "^0.10.0"
  }
}
```

---

### PWA 项目新增的依赖

这些是 PWA 项目特有的依赖：

```json
{
  "PWA 相关": {
    "vite-plugin-pwa": "^0.17.0",
    "workbox-window": "^7.0.0"
  },

  "Serverless Functions": {
    "@vercel/node": "^3.0.0"
  }
}
```

---

### 完整的 package.json（PWA 项目）

```json
{
  "name": "translator-pwa",
  "version": "0.1.0",
  "description": "智能翻译助手 PWA - 支持 Flashcard 学习的渐进式 Web 应用",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,md}\"",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  },
  "dependencies": {
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-radio-group": "^1.3.8",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@supabase/supabase-js": "^2.81.1",
    "axios": "^1.6.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "date-fns": "^3.6.0",
    "dompurify": "^3.0.8",
    "immer": "^10.0.3",
    "lodash-es": "^4.17.21",
    "lucide-react": "^0.309.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1",
    "recharts": "^3.3.0",
    "tailwind-merge": "^2.2.0",
    "ts-fsrs": "^5.2.3",
    "uuid": "^13.0.0",
    "zod": "^3.22.4",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.2.0",
    "@testing-library/react": "^14.1.2",
    "@types/dompurify": "^3.0.5",
    "@types/lodash-es": "^4.17.12",
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "@types/uuid": "^10.0.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "@vercel/node": "^3.0.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.33",
    "prettier": "^3.2.4",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.11",
    "vite-plugin-pwa": "^0.17.0",
    "vitest": "^1.2.0",
    "workbox-window": "^7.0.0"
  },
  "keywords": [
    "pwa",
    "translator",
    "flashcard",
    "react",
    "typescript",
    "vite"
  ],
  "author": "Your Name",
  "license": "MIT"
}
```

---

### 版本同步检查清单

在复制代码之前，请确保：

- [ ] 所有复用的依赖版本与原项目完全一致
- [ ] 移除了 Chrome Extension 特有的依赖
- [ ] 添加了 PWA 特有的依赖（vite-plugin-pwa、workbox-window）
- [ ] TypeScript 版本一致（5.3.3）
- [ ] React 版本一致（18.3.1）
- [ ] Vite 版本一致（5.0.11）
- [ ] 所有 @radix-ui 组件版本一致
- [ ] Supabase 版本一致（2.81.1）
- [ ] ts-fsrs 版本一致（5.2.3）

---

### 常见版本不一致问题

#### 问题 1：TypeScript 类型不兼容
```bash
# 错误信息
Type 'XXX' is not assignable to type 'YYY'

# 原因：React 或其他库的类型定义版本不一致
# 解决：确保 @types/react 版本与原项目一致
```

#### 问题 2：Zustand 状态管理类型错误
```bash
# 错误信息
Property 'xxx' does not exist on type 'StoreApi<XXX>'

# 原因：zustand 版本不一致
# 解决：使用 zustand@4.5.0
```

#### 问题 3：FSRS 算法类型不匹配
```bash
# 错误信息
Argument of type 'XXX' is not assignable to parameter of type 'Card'

# 原因：ts-fsrs 版本不一致
# 解决：使用 ts-fsrs@5.2.3
```

#### 问题 4：Supabase 客户端类型错误
```bash
# 错误信息
Property 'from' does not exist on type 'SupabaseClient'

# 原因：@supabase/supabase-js 版本不一致
# 解决：使用 @supabase/supabase-js@2.81.1
```

---

### 依赖安装命令

```bash
# 进入 PWA 项目目录
cd translator-pwa

# 使用 npm 安装（推荐使用与原项目相同的包管理器）
npm install

# 或使用 pnpm（更快，节省磁盘空间）
pnpm install

# 或使用 yarn
yarn install
```

---

### 依赖更新策略

1. **短期内（MVP 开发阶段）**：
   - ❌ 不要更新任何依赖版本
   - ✅ 保持与原项目完全一致

2. **中期（MVP 上线后）**：
   - ✅ 可以更新补丁版本（patch version）
   - ⚠️ 谨慎更新次要版本（minor version）
   - ❌ 避免更新主要版本（major version）

3. **长期（稳定运行后）**：
   - ✅ 统一更新两个项目的依赖
   - ✅ 建议使用 monorepo 管理（lerna、nx、turborepo）

---

## 🎯 功能清单

### 第一优先级（MVP 必备）

- [ ] **翻译功能**
  - [ ] 文本输入翻译
  - [ ] 语言自动检测
  - [ ] 字典查询（音标、例句）
  - [ ] 文本朗读（TTS）
  - [ ] 翻译历史记录

- [ ] **Flashcard 学习系统**
  - [ ] 卡片列表管理（增删改查）
  - [ ] 分组管理
  - [ ] 学习模式（FSRS 算法）
  - [ ] 学习统计分析
  - [ ] 数据导入导出

- [ ] **云端同步**
  - [ ] 用户注册/登录（Supabase Auth）
  - [ ] Flashcard 数据同步
  - [ ] 同步状态指示
  - [ ] 冲突解决（基于时间戳）

- [ ] **PWA 特性**
  - [ ] Service Worker 离线支持
  - [ ] 可安装到主屏幕
  - [ ] 响应式设计（移动端优先）
  - [ ] 离线状态提示

### 第二优先级（增强功能）

- [ ] 翻译缓存优化
- [ ] 搜索历史功能
- [ ] 主题切换（深色模式）
- [ ] 多语言界面（i18n）
- [ ] 通知提醒（学习提醒）

### 第三优先级（未来扩展）

- [ ] 拍照翻译（OCR）
- [ ] 语音输入翻译
- [ ] 社区功能（分享卡片）
- [ ] AI 增强（GPT 生成例句）

---

## 🏗 开发阶段

### 第一阶段：项目初始化与架构调整（Week 1）

#### 目标
创建独立的 PWA 项目，复用现有代码

#### 任务清单
- [x] 创建 `translator-pwa` 项目目录
- [ ] 初始化 Vite + React + TypeScript 项目
- [ ] 配置 Tailwind CSS + Radix UI
- [ ] 配置 PWA 插件（vite-plugin-pwa）
- [ ] 复用核心服务层代码
  - [ ] 复制 `services/flashcard/`（完整的 Flashcard 系统）
  - [ ] 复制 `services/sync/`（Supabase 云同步）
  - [ ] 复制 `services/translator/`（翻译引擎）
  - [ ] 复制 `services/dictionary/`（字典服务）
  - [ ] 复制 `types/`（所有类型定义）
  - [ ] 复制 `utils/`（工具函数）
- [ ] 适配存储层
  - [ ] 修改 `ConfigService.ts`（Chrome Storage → localStorage）
  - [ ] 保留 `FlashcardDB.ts`（IndexedDB 完全兼容）
- [ ] 创建环境变量配置（.env）

#### 产出
- 可运行的基础框架
- 完整的服务层代码

---

### 第二阶段：UI 层开发与移动端适配（Week 2）

#### 目标
构建响应式 PWA 界面

#### 任务清单
- [ ] **布局组件开发**
  - [ ] 创建 `AppLayout.tsx`（主布局）
  - [ ] 创建 `BottomNav.tsx`（底部导航栏）
    - 📝 翻译
    - 🃏 学习卡片
    - 📊 统计
    - ⚙️ 设置
  - [ ] 创建 `Header.tsx`（顶部导航栏）
    - 标题
    - 同步状态指示器
    - 用户头像/登录按钮

- [ ] **页面组件开发**
  - [ ] 复用 Flashcard 页面组件
    - [ ] `FlashcardListPage.tsx`
    - [ ] `StudyPage.tsx`
    - [ ] `StatisticsPage.tsx`
    - [ ] `GroupManagePage.tsx`
  - [ ] 重新设计 `TranslatePage.tsx`
    - 全屏翻译界面
    - 底部输入框
    - 翻译结果展示
    - 历史记录列表
  - [ ] 创建 `LoginPage.tsx`（登录/注册）
  - [ ] 创建 `SettingsPage.tsx`（设置页面）

- [ ] **复用 UI 组件**
  - [ ] 复制 `components/flashcard/`
  - [ ] 复制 `components/ui/`（Radix UI 组件）

- [ ] **响应式设计**
  - [ ] 移动端布局（< 768px）
  - [ ] 平板布局（768px - 1024px）
  - [ ] 桌面布局（> 1024px）

#### 产出
- 完整的页面布局
- 响应式 UI 组件

---

### 第三阶段：PWA 特性集成（Week 3）

#### 目标
实现离线支持、可安装特性

#### 任务清单
- [ ] **PWA Manifest 配置**
  - [ ] 创建 `public/manifest.json`
  - [ ] 设计应用图标（192x192、512x512）
  - [ ] 配置启动画面

- [ ] **Service Worker 实现**
  - [ ] 配置 Workbox 缓存策略
    - App Shell → Cache First
    - 翻译 API → Network First
    - 静态资源 → Cache First
    - Supabase API → Network Only
  - [ ] 实现后台同步（Background Sync）
  - [ ] 实现离线队列

- [ ] **离线功能支持**
  - [ ] 离线状态检测
  - [ ] 离线模式 UI 提示
  - [ ] 离线时可用功能：
    - ✅ 查看翻译历史
    - ✅ Flashcard 学习
    - ✅ 查看统计数据
    - ❌ 新翻译请求（显示提示）

- [ ] **安装提示**
  - [ ] 检测 PWA 安装条件
  - [ ] 显示"添加到主屏幕"横幅
  - [ ] iOS Safari 特殊处理（引导手动添加）

#### 产出
- 可安装的 PWA 应用
- 完整的离线支持

---

### 第四阶段：用户认证与云同步（Week 3-4）

#### 目标
集成 Supabase 认证，实现多设备同步

#### 任务清单
- [ ] **Supabase 配置**
  - [ ] 复用现有 Supabase 项目
  - [ ] 配置环境变量（.env）
  - [ ] 验证数据库表结构

- [ ] **用户认证**
  - [ ] Email + Password 登录
  - [ ] Email 注册
  - [ ] 忘记密码功能
  - [ ] 登录状态持久化

- [ ] **云同步功能**
  - [ ] 复用 `SupabaseService.ts`
  - [ ] 复用 `SyncService.ts`
  - [ ] 实现手动同步按钮
  - [ ] 实现自动同步（登录后、数据变更）
  - [ ] 同步状态指示器（同步中/成功/失败）
  - [ ] 冲突解决（基于时间戳）

#### 产出
- 完整的用户认证系统
- 多设备数据同步功能

---

### 第五阶段：测试、优化与部署（Week 4-5）

#### 目标
完善功能，部署上线

#### 任务清单
- [ ] **功能测试**
  - [ ] 翻译功能测试（多语言对）
  - [ ] Flashcard 学习流程测试
  - [ ] 云同步测试（多设备）
  - [ ] 离线功能测试
  - [ ] 响应式布局测试（各种屏幕尺寸）
  - [ ] PWA 安装测试（iOS、Android、桌面）

- [ ] **性能优化**
  - [ ] 代码分割（React.lazy + Suspense）
  - [ ] 图片优化（WebP 格式）
  - [ ] 首屏加载优化
  - [ ] IndexedDB 查询优化
  - [ ] Lighthouse 评分优化（目标 90+）

- [ ] **创建翻译 API 代理**
  - [ ] 创建 `api/translate.ts`（Vercel Function）
  - [ ] 处理 CORS 问题
  - [ ] 添加错误处理
  - [ ] 添加请求限流

- [ ] **部署上线**
  - [ ] 部署到 Vercel（推荐）
  - [ ] 配置自定义域名（可选）
  - [ ] 配置环境变量
  - [ ] 验证 PWA 功能
  - [ ] 性能监控配置

#### 产出
- 可部署的完整版本
- 正式发布 🎉

---

## 📁 项目目录结构

```
translator-pwa/
├── public/
│   ├── manifest.json              # PWA Manifest
│   ├── icon-192.png               # 应用图标
│   ├── icon-512.png
│   ├── apple-touch-icon.png       # iOS 图标
│   └── robots.txt
│
├── api/                           # Serverless Functions
│   └── translate.ts               # 翻译 API 代理（Vercel Function）
│
├── src/
│   ├── App.tsx                    # 主应用（路由配置）
│   ├── main.tsx                   # 入口文件
│   ├── sw.ts                      # Service Worker（可选）
│   │
│   ├── pages/                     # 页面组件
│   │   ├── TranslatePage.tsx      # 翻译主页（重新设计）
│   │   ├── LoginPage.tsx          # 登录/注册页（新增）
│   │   ├── SettingsPage.tsx       # 设置页（新增）
│   │   └── flashcard/             # Flashcard 页面（复用）
│   │       ├── FlashcardListPage.tsx
│   │       ├── StudyPage.tsx
│   │       ├── StatisticsPage.tsx
│   │       └── GroupManagePage.tsx
│   │
│   ├── components/                # 组件
│   │   ├── layout/                # 布局组件（新增）
│   │   │   ├── AppLayout.tsx      # 主布局
│   │   │   ├── BottomNav.tsx      # 底部导航栏
│   │   │   └── Header.tsx         # 顶部导航栏
│   │   ├── flashcard/             # Flashcard 组件（复用）
│   │   └── ui/                    # 基础 UI 组件（复用）
│   │
│   ├── services/                  # 服务层（大部分复用）
│   │   ├── flashcard/             # Flashcard 服务（100% 复用）
│   │   │   ├── FlashcardDB.ts
│   │   │   ├── FlashcardService.ts
│   │   │   ├── FSRSService.ts
│   │   │   ├── StudySessionService.ts
│   │   │   └── AnalyticsService.ts
│   │   ├── sync/                  # 云同步服务（100% 复用）
│   │   │   ├── SupabaseService.ts
│   │   │   └── SyncService.ts
│   │   ├── translator/            # 翻译服务（90% 复用）
│   │   │   ├── ITranslator.ts
│   │   │   ├── GoogleTranslator.ts
│   │   │   ├── DictionaryTranslator.ts
│   │   │   └── TranslatorFactory.ts
│   │   ├── dictionary/            # 字典服务（100% 复用）
│   │   │   ├── FreeDictionaryService.ts
│   │   │   └── MicrosoftDictionaryService.ts
│   │   ├── cache/                 # 缓存服务（复用）
│   │   │   ├── TranslationCache.ts
│   │   │   └── IndexedDBCache.ts
│   │   └── config/                # 配置服务（需适配）
│   │       └── ConfigService.ts   # Chrome Storage → localStorage
│   │
│   ├── types/                     # 类型定义（100% 复用）
│   │   ├── flashcard.ts
│   │   ├── supabase.ts
│   │   ├── message.ts
│   │   └── index.ts
│   │
│   ├── utils/                     # 工具函数（100% 复用）
│   │   ├── constants.ts
│   │   ├── textAnalyzer.ts
│   │   └── cn.ts
│   │
│   ├── hooks/                     # 自定义 Hooks
│   │   ├── useAuth.ts             # 认证 Hook（新增）
│   │   ├── useOnlineStatus.ts     # 在线状态检测（新增）
│   │   └── useInstallPrompt.ts    # PWA 安装提示（新增）
│   │
│   └── styles/                    # 样式文件
│       └── globals.css            # 全局样式
│
├── .env                           # 环境变量（Supabase 配置）
├── .env.example                   # 环境变量示例
├── vite.config.ts                 # Vite 配置
├── tailwind.config.js             # Tailwind 配置
├── tsconfig.json                  # TypeScript 配置
├── package.json                   # 依赖配置
├── vercel.json                    # Vercel 部署配置（可选）
├── README.md                      # 项目说明
└── DEVELOPMENT_PLAN.md            # 本文档
```

---

## 🔄 代码复用策略

### 可完全复用（70%）

```typescript
// 1. Flashcard 学习系统（100% 复用）
services/flashcard/
├── FSRSService.ts              ✅ 完全复用（核心算法）
├── FlashcardService.ts         ✅ 完全复用（业务逻辑）
├── StudySessionService.ts      ✅ 完全复用（学习会话）
├── AnalyticsService.ts         ✅ 完全复用（统计分析）
└── FlashcardDB.ts              ✅ 完全复用（IndexedDB）

// 2. 云同步服务（100% 复用）
services/sync/
├── SupabaseService.ts          ✅ 完全复用
└── SyncService.ts              ✅ 完全复用

// 3. 翻译服务（90% 复用）
services/translator/
├── ITranslator.ts              ✅ 接口定义复用
├── GoogleTranslator.ts         🔄 需调整 API 调用方式
├── DictionaryTranslator.ts     ✅ 完全复用
└── TranslatorFactory.ts        ✅ 完全复用

// 4. 字典服务（100% 复用）
services/dictionary/            ✅ 完全复用

// 5. UI 组件（100% 复用）
components/flashcard/           ✅ 完全复用
components/ui/                  ✅ 完全复用（Radix UI）
pages/flashcard/                ✅ 完全复用

// 6. 类型定义（100% 复用）
types/                          ✅ 完全复用
```

### 需要适配（20%）

```typescript
// 1. 配置服务（需修改存储方式）
services/config/ConfigService.ts
// 修改：chrome.storage.sync → localStorage

// 2. 翻译 API 调用（需添加代理）
services/translator/GoogleTranslator.ts
// 修改：直接调用 → 通过 Serverless Function 代理

// 3. 缓存服务（轻微调整）
services/cache/
// 调整：去除 Chrome API 依赖
```

### 需要新建（10%）

```typescript
// 1. PWA 配置文件
public/manifest.json            🆕 新建
src/sw.ts                       🆕 新建（可选）

// 2. 布局组件
components/layout/
├── AppLayout.tsx               🆕 新建
├── BottomNav.tsx               🆕 新建
└── Header.tsx                  🆕 新建

// 3. 认证页面
pages/LoginPage.tsx             🆕 新建
pages/SettingsPage.tsx          🆕 新建

// 4. Serverless Functions
api/translate.ts                🆕 新建

// 5. PWA Hooks
hooks/useAuth.ts                🆕 新建
hooks/useOnlineStatus.ts        🆕 新建
hooks/useInstallPrompt.ts       🆕 新建
```

---

## 🔧 关键技术实现

### 1. 翻译 API 的 CORS 解决方案

**问题**：前端直接调用 Google Translation API 会遇到 CORS 限制

**解决方案**：使用 Vercel Serverless Function 作为代理

```typescript
// api/translate.ts（Vercel Function）
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, from, to } = req.body;

    // 验证参数
    if (!text || !to) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // 调用 Google Translation API
    const result = await axios.post(
      'https://translation.googleapis.com/language/translate/v2',
      {
        q: text,
        source: from || 'auto',
        target: to,
      },
      {
        headers: {
          'X-Goog-Api-Key': process.env.GOOGLE_API_KEY,
        },
      }
    );

    // 返回翻译结果
    res.status(200).json({
      translatedText: result.data.data.translations[0].translatedText,
      detectedSourceLanguage: result.data.data.translations[0].detectedSourceLanguage,
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
}
```

**前端调用**：

```typescript
// services/translator/GoogleTranslator.ts（修改版）
async translate(text: string, from: string, to: string): Promise<TranslationResult> {
  // 原版：直接调用 Chrome Extension Background
  // PWA 版：调用 Serverless Function
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, from, to }),
  });

  const data = await response.json();
  return {
    translatedText: data.translatedText,
    detectedSourceLanguage: data.detectedSourceLanguage,
  };
}
```

---

### 2. Service Worker 配置（使用 vite-plugin-pwa）

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: '智能翻译助手',
        short_name: '翻译助手',
        description: '支持 Flashcard 学习的智能翻译工具',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        // 缓存策略
        runtimeCaching: [
          {
            // 翻译 API - Network First
            urlPattern: /^https:\/\/.*\.vercel\.app\/api\/translate/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'translation-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 小时
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Supabase API - Network Only
            urlPattern: /^https:\/\/.*\.supabase\.co\//,
            handler: 'NetworkOnly',
          },
          {
            // 静态资源 - Cache First
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 天
              },
            },
          },
        ],
      },
    }),
  ],
});
```

---

### 3. 配置服务适配（Chrome Storage → localStorage）

```typescript
// services/config/ConfigService.ts（修改版）

class ConfigService {
  // 原版：使用 chrome.storage.sync
  // PWA 版：使用 localStorage

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('ConfigService get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('ConfigService set error:', error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('ConfigService remove error:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('ConfigService clear error:', error);
      throw error;
    }
  }
}

export default new ConfigService();
```

---

### 4. 离线状态检测

```typescript
// hooks/useOnlineStatus.ts

import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

**使用示例**：

```typescript
// pages/TranslatePage.tsx

import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export default function TranslatePage() {
  const isOnline = useOnlineStatus();

  return (
    <div>
      {!isOnline && (
        <div className="bg-yellow-100 p-4 text-center">
          ⚠️ 当前处于离线状态，无法进行翻译
        </div>
      )}
      {/* 翻译界面 */}
    </div>
  );
}
```

---

### 5. PWA 安装提示

```typescript
// hooks/useInstallPrompt.ts

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 检测是否已安装
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // 监听安装提示事件
    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return false;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstalled(true);
      return true;
    }

    return false;
  };

  return { installPrompt, isInstalled, promptInstall };
}
```

---

## 🚀 部署方案

### 推荐方案：Vercel

**优势**：
- ✅ 免费托管
- ✅ 自动 HTTPS
- ✅ 全球 CDN 加速
- ✅ Serverless Functions 支持
- ✅ Git 集成（自动部署）
- ✅ 环境变量管理

**部署步骤**：

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **初始化项目**
   ```bash
   cd translator-pwa
   vercel
   ```

4. **配置环境变量**
   ```bash
   vercel env add GOOGLE_API_KEY
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

5. **部署到生产环境**
   ```bash
   vercel --prod
   ```

6. **自动部署**（可选）
   - 连接 GitHub 仓库
   - 每次 push 到 main 分支自动部署

### 替代方案

#### Netlify
```bash
# 安装 Netlify CLI
npm i -g netlify-cli

# 部署
netlify deploy --prod
```

#### Cloudflare Pages
- 速度快，免费额度大
- 通过 Cloudflare Dashboard 连接 Git 仓库

#### 自建服务器（Nginx）
```nginx
server {
    listen 80;
    server_name translator.example.com;

    root /var/www/translator-pwa/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass https://your-serverless-functions;
    }
}
```

---

## 📅 时间线与里程碑

### Week 1: 项目初始化 ✅
- [x] Day 1-2: 创建项目、配置工具链
- [ ] Day 3-4: 复用服务层代码
- [ ] Day 5: 适配配置服务、测试核心功能

**里程碑**：可运行的基础框架

---

### Week 2: UI 开发
- [ ] Day 1-2: 布局组件开发（BottomNav、Header）
- [ ] Day 3-4: 翻译页面重新设计
- [ ] Day 5: 复用 Flashcard 页面、响应式调整

**里程碑**：完整的 UI 界面

---

### Week 3: PWA 特性 + 云同步
- [ ] Day 1-2: Service Worker、离线支持
- [ ] Day 3-4: PWA 安装功能、用户认证
- [ ] Day 5: 云同步集成

**里程碑**：可安装的 PWA 应用

---

### Week 4: 翻译 API + 测试
- [ ] Day 1-2: Serverless Function 开发
- [ ] Day 3-4: 功能测试（翻译、学习、同步）
- [ ] Day 5: 性能优化

**里程碑**：功能完整的应用

---

### Week 5: 优化与部署
- [ ] Day 1-2: 响应式测试、PWA 安装测试
- [ ] Day 3: Lighthouse 优化
- [ ] Day 4: 部署到 Vercel
- [ ] Day 5: 正式发布 🎉

**里程碑**：生产环境上线

---

## 🌟 后续扩展计划

### Phase 2: 增强功能（上线后 1-2 个月）

- [ ] **拍照翻译**
  - 集成 Tesseract.js（Web OCR）
  - 支持拍照识别文字后翻译

- [ ] **语音输入翻译**
  - 使用 Web Speech API
  - 支持语音转文字后翻译

- [ ] **学习提醒通知**
  - 使用 Push API
  - 根据 FSRS 算法推送学习提醒

- [ ] **主题切换**
  - 深色模式
  - 自定义主题色

### Phase 3: 社区功能（2-3 个月后）

- [ ] **分享学习卡片**
  - 生成分享链接
  - 导入他人分享的卡片

- [ ] **学习排行榜**
  - 每日/每周学习时长排行
  - 连续学习天数统计

- [ ] **用户评论系统**
  - 卡片评论
  - 学习笔记分享

### Phase 4: AI 增强（3-6 个月后）

- [ ] **接入 GPT**
  - AI 生成例句
  - 智能推荐学习内容

- [ ] **个性化学习路径**
  - 根据学习数据推荐卡片
  - 智能调整学习计划

---

## 📊 与 Chrome Extension 的对比

| 特性 | Chrome Extension | PWA 应用 |
|------|-----------------|---------|
| **平台支持** | ❌ 仅 Chrome 浏览器 | ✅ 所有现代浏览器 + iOS/Android |
| **安装方式** | Chrome Web Store | 浏览器"添加到主屏幕" |
| **划词翻译** | ✅ 支持 | ❌ 不支持（浏览器限制） |
| **输入框翻译** | ✅ Popup 弹窗 | ✅ 全屏页面 |
| **Flashcard 学习** | ✅ 完整功能 | ✅ 完整功能（100% 复用） |
| **云同步** | ✅ Supabase | ✅ Supabase（完全相同） |
| **离线功能** | ✅ Background | ✅ Service Worker |
| **数据存储** | Chrome Storage + IndexedDB | localStorage + IndexedDB |
| **部署难度** | ❌ 需要 Web Store 审核 | ✅ 立即部署（Vercel 等） |
| **更新速度** | ❌ 需要审核（1-7 天） | ✅ 立即生效 |
| **代码复用** | - | ✅ 70-80% 代码可复用 |

---

## 📝 注意事项

### 安全性
- [ ] 环境变量不要提交到 Git（使用 .gitignore）
- [ ] API Keys 存储在服务器端（Vercel Environment Variables）
- [ ] 实现请求限流（防止 API 滥用）
- [ ] Supabase RLS（Row Level Security）配置

### 性能优化
- [ ] 使用 React.lazy 进行代码分割
- [ ] 图片使用 WebP 格式
- [ ] 使用 Lighthouse 检测性能（目标 90+）
- [ ] IndexedDB 查询添加索引

### 浏览器兼容性
- [ ] iOS Safari 特殊处理（PWA 安装引导）
- [ ] Android Chrome 优先支持
- [ ] 桌面浏览器完整支持

### 用户体验
- [ ] 首次加载添加 Loading 动画
- [ ] 离线状态友好提示
- [ ] 同步失败错误处理
- [ ] 表单验证友好提示

---

## 🎯 成功指标

### 技术指标
- [ ] Lighthouse 性能评分 > 90
- [ ] 首屏加载时间 < 2s
- [ ] PWA 安装成功率 > 80%
- [ ] 离线功能可用率 > 95%

### 功能指标
- [ ] 翻译成功率 > 99%
- [ ] 云同步成功率 > 95%
- [ ] Flashcard 学习流程无阻塞

---

## 📚 参考资源

### 官方文档
- [PWA 官方文档](https://web.dev/progressive-web-apps/)
- [Workbox 文档](https://developers.google.com/web/tools/workbox)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Supabase 文档](https://supabase.com/docs)

### 学习资源
- [PWA 完整指南](https://www.smashingmagazine.com/2018/11/guide-pwa-progressive-web-applications/)
- [Service Worker 教程](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
- [Vercel Deployment](https://vercel.com/docs)

---

## 🤝 贡献指南

开发过程中请遵循以下原则：

1. **代码规范**：使用 ESLint + Prettier
2. **提交规范**：使用 Conventional Commits
3. **分支管理**：使用 Git Flow
4. **测试覆盖**：核心功能需要测试

---

## 📞 联系方式

如有问题，请通过以下方式联系：
- 项目 Issue: [GitHub Issues]
- Email: [your-email@example.com]

---

**文档版本**：v1.0
**最后更新**：2025-11-13
**状态**：进行中 🚧
