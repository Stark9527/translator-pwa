# 数据库迁移文件

本目录包含 Supabase 数据库的迁移 SQL 文件。

## 如何执行迁移

### 方法 1: Supabase Dashboard（推荐）

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 复制对应的 SQL 文件内容
5. 点击 **Run** 执行

### 方法 2: Supabase CLI

```bash
# 确保已安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 连接到项目
supabase link --project-ref YOUR_PROJECT_REF

# 执行迁移
supabase db push
```

## 迁移文件列表

### SQL 迁移（Schema 变更）

- `20250119_add_audio_url.sql` - 添加 audio_url 字段到 flashcards 表

### 数据迁移（Data Backfill）

- `backfill_audio_urls_browser.js` - 批量回填已有卡片的 audio_url 字段（浏览器控制台版本）
- `backfill_audio_urls.ts` - 批量回填已有卡片的 audio_url 字段（TypeScript 版本）

## 如何使用数据回填脚本

### 方法 1: 应用内一键更新（最推荐）⭐

这是最简单的方法，直接在应用的设置页面中操作。

**使用步骤：**

1. 打开应用，进入"设置"页面
2. 找到"数据管理"部分
3. 点击"批量更新音频 URL"下的"立即更新"按钮
4. 等待处理完成，查看结果报告

**优点：**

- ✅ 无需任何代码知识
- ✅ 实时显示进度和统计
- ✅ 自动更新本地和云端数据
- ✅ 友好的错误提示
- ✅ 支持重复运行

详细说明请查看 [QUICK_START.md](./QUICK_START.md)

### 方法 2: 浏览器控制台（备选方案）

适用于高级用户或需要自定义配置的场景。

**使用步骤：**

1. 在浏览器中打开应用并登录
2. 按 `F12` 打开浏览器开发者工具
3. 切换到 **Console**（控制台）标签
4. 打开 `backfill_audio_urls_browser.js` 文件
5. 复制整个文件内容
6. 粘贴到控制台中，按回车执行

**脚本功能：**

- ✅ 自动查找所有没有 `audio_url` 的英文单词卡片
- ✅ 从 Free Dictionary API 获取音频 URL
- ✅ 批量更新到 Supabase 数据库
- ✅ 显示详细的进度和统计信息
- ✅ 记录失败的单词，方便后续手动处理

**注意事项：**

- 确保已登录 Supabase
- 脚本包含 API 调用延迟（300ms），避免被限流
- 只处理英文单词（`source_language = 'en'`）
- 如需预览而不实际更新，可将脚本中的 `DRY_RUN` 设为 `true`

### 方法 2: TypeScript 脚本

如果你熟悉 Node.js 环境，可以使用 TypeScript 版本（`backfill_audio_urls.ts`）。

## 注意事项

1. 请按照文件名中的日期顺序执行迁移
2. 在生产环境执行前，建议先在测试环境验证
3. 执行前请备份数据库
4. 每个迁移文件使用 `IF NOT EXISTS` 或 `IF EXISTS` 来保证幂等性
5. 数据回填脚本可以多次执行，会自动跳过已有 `audio_url` 的卡片
