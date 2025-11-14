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
3. [开发阶段](#开发阶段)
4. [项目目录结构](#项目目录结构)
5. [部署方案](#部署方案)

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

## 🏗 开发阶段与任务清单

### 第一阶段：项目初始化与架构调整 ✅ 已完成

⏱️ **时间安排**：Week 1 (Day 1-5)
🎯 **里程碑**：可运行的基础框架 + 完整的服务层代码
✅ **完成标准**：
- ✅ 项目可以 `npm run dev` 启动
- ✅ 服务层代码全部复用完成
- ✅ 核心功能（翻译 + Flashcard）可以在控制台测试
- ✅ TypeScript 类型检查通过（0 错误）

📅 **实际完成时间**：2025-11-14
📊 **代码复用率**：~80%

#### 核心目标
创建独立的 PWA 项目，复用现有代码

#### 任务清单
- [x] 创建 `translator-pwa` 项目目录
- [x] 初始化 Vite + React + TypeScript 项目
- [x] 配置 Tailwind CSS + Radix UI
- [x] 配置 PWA 插件（vite-plugin-pwa）
- [x] 复用核心服务层代码
  - [x] 复制 `services/flashcard/`（完整的 Flashcard 系统）
  - [x] 复制 `services/sync/`（Supabase 云同步）
  - [x] 复制 `services/translator/`（翻译引擎）
  - [x] 复制 `services/dictionary/`（字典服务）
  - [x] 复制 `types/`（所有类型定义）
  - [x] 复制 `utils/`（工具函数）
- [x] 适配存储层
  - [x] 修改 `ConfigService.ts`（Chrome Storage → localStorage）
    - 💡 **技术方案**：使用 localStorage 替代 Chrome Storage API，保持异步接口设计
    - ⚠️ **注意事项**：localStorage 限制 5-10MB，需处理 JSON 序列化和错误捕获
  - [x] 保留 `FlashcardDB.ts`（IndexedDB 完全兼容）
- [x] 创建环境变量配置（.env）
- [x] 复制 UI 组件（`components/flashcard/`、`components/ui/`）
- [x] 复制页面组件（`pages/flashcard/`）
- [x] 删除不需要的 `utils/message.ts`（PWA 不需要 Chrome 消息传递）
- [x] 修复类型错误（TypeScript 类型检查通过）

---

### 第二阶段：UI 层开发与移动端适配 ✅ 已完成

⏱️ **时间安排**：Week 2 (Day 1-5)
🎯 **里程碑**：完整的响应式 UI 界面
✅ **完成标准**：
- ✅ 所有页面组件开发完成
- ✅ 移动端、平板、桌面三种布局适配完成
- ✅ 可以在不同设备上正常浏览和操作
- ✅ TypeScript 类型检查通过

📅 **实际完成时间**：2025-11-14
🎨 **UI 设计**：移动端优先的响应式设计

#### 核心目标
构建响应式 PWA 界面

#### 任务清单
- [x] **布局组件开发**
  - [x] 创建 `AppLayout.tsx`（主布局）
  - [x] 创建 `BottomNav.tsx`（底部导航栏）
    - 📝 翻译
    - 🃏 学习卡片
    - 📊 统计
    - ⚙️ 设置
  - [x] 创建 `Header.tsx`（顶部导航栏）
    - 标题
    - 同步状态指示器
    - 用户头像/登录按钮

- [x] **页面组件开发**
  - [x] 复用 Flashcard 页面组件
    - [x] `FlashcardListPage.tsx`
    - [x] `StudyPage.tsx`
    - [x] `StatisticsPage.tsx`
    - [x] `GroupManagePage.tsx`
  - [x] 重新设计 `TranslatePage.tsx`
    - 全屏翻译界面
    - 底部输入框
    - 翻译结果展示
    - 语言选择器
  - [x] 创建 `LoginPage.tsx`（登录/注册）
  - [x] 创建 `SettingsPage.tsx`（设置页面）

- [x] **复用 UI 组件**
  - [x] 复制 `components/flashcard/`
  - [x] 复制 `components/ui/`（Radix UI 组件）

- [x] **响应式设计**
  - [x] 移动端布局（< 768px）- 底部导航栏
  - [x] 平板布局（768px - 1024px）- 自适应
  - [x] 桌面布局（> 1024px）- 隐藏底部导航栏

- [x] **路由配置**
  - [x] 配置 React Router
  - [x] 设置嵌套路由
  - [x] 登录页面独立布局

---

### 第三阶段：PWA 特性集成 ✅ 已完成

⏱️ **时间安排**：Week 3 (Day 1-2)
🎯 **里程碑**：可安装的 PWA 应用 + 完整离线支持
✅ **完成标准**：
- ✅ PWA 可以安装到手机/桌面
- ✅ 离线状态检测功能实现
- ✅ Service Worker 已配置（vite.config.ts）
- ✅ TypeScript 类型检查通过

📅 **实际完成时间**：2025-11-14
🚀 **PWA 就绪**：支持安装和离线检测

#### 核心目标
实现离线支持、可安装特性

#### 任务清单
- [x] **PWA Manifest 配置**
  - [x] 创建 `public/manifest.json`
  - [x] 设计应用图标说明文档（需后续添加实际图标文件）
  - [x] 配置启动画面和快捷方式

- [x] **Service Worker 实现**
  - 💡 **技术方案**：使用 vite-plugin-pwa + Workbox 自动生成 Service Worker
  - [x] 配置 Workbox 缓存策略（已在 vite.config.ts 中配置）
    - App Shell → Cache First（应用外壳优先缓存）
    - 翻译 API → Network First（优先网络，24小时缓存）
    - 静态资源 → Cache First（图片等，30天缓存）
    - Supabase API → Network Only（实时数据，不缓存）

- [x] **离线功能支持**
  - 💡 **技术方案**：使用 navigator.onLine API 监听在线状态，创建 useOnlineStatus Hook
  - [x] 创建 `useOnlineStatus` Hook
  - [x] 集成离线状态检测到 AppLayout
  - [x] Header 显示在线/离线状态
  - [x] 离线时可用功能：
    - ✅ Flashcard 学习（基于 IndexedDB）
    - ✅ 查看本地数据
    - ❌ 新翻译请求（需要网络）

- [x] **安装提示**
  - 💡 **技术方案**：监听 beforeinstallprompt 事件，创建 useInstallPrompt Hook
  - ⚠️ **注意事项**：iOS Safari 不支持自动提示，需引导用户手动添加
  - [x] 创建 `useInstallPrompt` Hook
  - [x] 创建 `InstallPrompt` 组件（安装横幅）
  - [x] 创建 `IOSInstallGuide` 组件（iOS 引导）
  - [x] 集成到 AppLayout

---

### 第四阶段：用户认证与云同步

⏱️ **时间安排**：Week 3-4 (Day 3-5 + Day 1-2)
🎯 **里程碑**：完整的用户系统 + 多设备云同步
✅ **完成标准**：
- 用户可以注册、登录、登出
- Flashcard 数据可以在多设备间同步
- 同步冲突可以正确解决

#### 核心目标
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

---

### 第五阶段：测试、优化与部署

⏱️ **时间安排**：Week 4-5 (Day 3-5 + Day 1-5)
🎯 **里程碑**：生产环境上线 🎉
✅ **完成标准**：
- 所有核心功能测试通过
- Lighthouse 性能评分 > 90
- 成功部署到 Vercel 并可公开访问

#### 核心目标
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
  - 💡 **技术方案**：使用 Vercel Serverless Function 代理翻译 API，解决 CORS 限制
  - ⚠️ **注意事项**：API Key 存储在服务器端环境变量，前端调用 `/api/translate`
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

## 🚀 部署方案

### 推荐方案：Vercel

**优势**：
- ✅ 免费托管 + 自动 HTTPS
- ✅ 全球 CDN 加速
- ✅ Serverless Functions 支持（用于翻译 API 代理）
- ✅ Git 集成（自动部署）
- ✅ 环境变量管理

**环境变量配置**：
- `GOOGLE_API_KEY` - Google 翻译 API 密钥
- `VITE_SUPABASE_URL` - Supabase 项目 URL
- `VITE_SUPABASE_ANON_KEY` - Supabase 匿名密钥
