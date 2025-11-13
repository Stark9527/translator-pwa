# 智能翻译助手 PWA

> 基于 Chrome Extension 翻译助手的渐进式 Web 应用版本

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0.11-646cff.svg)](https://vitejs.dev/)

## ✨ 功能特性

### 核心功能

- 📝 **智能翻译**
  - 多语言互译（支持多种语言对）
  - 自动语言检测
  - 字典查询（音标、例句、详细释义）
  - 文本朗读（TTS）
  - 翻译历史记录

- 🃏 **Flashcard 学习系统**
  - FSRS 间隔重复学习算法（科学记忆）
  - 卡片管理（增删改查、搜索、筛选）
  - 分组管理（自定义分组、标签系统）
  - 学习模式（卡片翻转、答题评分）
  - 学习统计（每日统计、学习曲线）
  - 数据导入导出（JSON/Anki CSV）

- ☁️ **云端同步**
  - 基于 Supabase 的多设备数据同步
  - 用户认证（Email + Password）
  - 自动/手动同步
  - 冲突解决（基于时间戳）

- 📱 **PWA 特性**
  - 可安装到手机主屏幕
  - 离线支持（Service Worker）
  - 响应式设计（移动端优先）
  - 跨平台支持（iOS、Android、桌面浏览器）

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- npm、yarn 或 pnpm

### 安装依赖

```bash
# 使用 npm
npm install

# 使用 yarn
yarn install

# 使用 pnpm
pnpm install
```

### 环境变量配置

1. 复制环境变量模板：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入你的配置：
```env
# Supabase 配置
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Translation API（可选）
VITE_GOOGLE_API_KEY=your_google_api_key
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 📁 项目结构

```
translator-pwa/
├── public/                    # 静态资源
│   ├── manifest.json         # PWA Manifest
│   └── icons/                # 应用图标
├── api/                      # Serverless Functions
│   └── translate.ts          # 翻译 API 代理
├── src/
│   ├── main.tsx              # 应用入口
│   ├── App.tsx               # 主应用组件
│   ├── pages/                # 页面组件
│   │   ├── TranslatePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── flashcard/        # Flashcard 相关页面
│   ├── components/           # 公共组件
│   │   ├── layout/           # 布局组件
│   │   ├── flashcard/        # Flashcard 组件
│   │   └── ui/               # 基础 UI 组件
│   ├── services/             # 业务逻辑服务
│   │   ├── flashcard/        # Flashcard 服务
│   │   ├── sync/             # 云同步服务
│   │   ├── translator/       # 翻译服务
│   │   └── dictionary/       # 字典服务
│   ├── types/                # TypeScript 类型定义
│   ├── utils/                # 工具函数
│   └── styles/               # 样式文件
├── .env.example              # 环境变量模板
├── package.json
├── vite.config.ts            # Vite 配置
├── tsconfig.json             # TypeScript 配置
└── tailwind.config.js        # Tailwind CSS 配置
```

## 🛠 技术栈

### 核心技术

- **前端框架**: React 18.3.1
- **开发语言**: TypeScript 5.3.3
- **构建工具**: Vite 5.0.11
- **路由管理**: React Router 6.30.1
- **状态管理**: Zustand 4.5.0

### UI 框架

- **样式**: Tailwind CSS 3.4.1
- **组件库**: Radix UI（无障碍 UI 组件）
- **图标库**: Lucide React 0.309.0
- **数据可视化**: Recharts 3.3.0

### 云服务

- **后端服务**: Supabase 2.81.1
- **认证**: Supabase Auth
- **数据库**: PostgreSQL（Supabase）
- **存储**: IndexedDB + localStorage

### 学习算法

- **间隔重复算法**: ts-fsrs 5.2.3（FSRS v5.0）
- **日期处理**: date-fns 3.6.0

### PWA 支持

- **PWA 插件**: vite-plugin-pwa 0.17.0
- **Service Worker**: Workbox 7.0.0

## 📖 开发指南

### 代码规范

项目使用 ESLint + Prettier 进行代码规范检查：

```bash
# 检查代码规范
npm run lint

# 自动修复代码规范问题
npm run lint:fix

# 格式化代码
npm run format
```

### 类型检查

```bash
npm run type-check
```

### 测试

```bash
# 运行测试
npm run test

# 测试 UI
npm run test:ui

# 测试覆盖率
npm run test:coverage
```

## 🚢 部署

### Vercel 部署（推荐）

1. 安装 Vercel CLI：
```bash
npm i -g vercel
```

2. 登录 Vercel：
```bash
vercel login
```

3. 部署：
```bash
vercel --prod
```

4. 配置环境变量（在 Vercel Dashboard）：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GOOGLE_API_KEY`（用于 Serverless Function）

### 其他部署方案

- **Netlify**: 支持，配置类似 Vercel
- **Cloudflare Pages**: 支持，速度快
- **自建服务器**: 需要配置 Nginx + HTTPS

## 📱 PWA 安装

### iOS Safari

1. 访问网站
2. 点击分享按钮
3. 选择"添加到主屏幕"

### Android Chrome

1. 访问网站
2. 点击浏览器菜单
3. 选择"安装应用"或"添加到主屏幕"

### 桌面浏览器

1. 访问网站
2. 点击地址栏的安装图标
3. 点击"安装"

## 🔗 相关链接

- [开发规划文档](./DEVELOPMENT_PLAN.md)
- [Chrome Extension 原项目](../translator)
- [Supabase 文档](https://supabase.com/docs)
- [FSRS 算法](https://github.com/open-spaced-repetition/ts-fsrs)
- [PWA 指南](https://web.dev/progressive-web-apps/)

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- 项目 Issue: [GitHub Issues](https://github.com/your-username/translator-pwa/issues)
- Email: your-email@example.com

## 🙏 致谢

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [FSRS](https://github.com/open-spaced-repetition/ts-fsrs)

---

**开发状态**: 🚧 进行中

**版本**: v0.1.0

**最后更新**: 2025-11-13
