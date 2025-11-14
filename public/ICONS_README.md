# PWA 图标说明

## 需要准备的图标文件

请将以下图标文件放置在 `public/` 目录下：

### 必需图标

1. **icon-192.png** (192x192px)
   - 用于 Android 主屏幕图标
   - 用于 PWA 安装提示
   - 格式：PNG
   - 背景：可以是透明或纯色

2. **icon-512.png** (512x512px)
   - 用于 Android 启动画面
   - 用于应用商店展示
   - 格式：PNG
   - 背景：可以是透明或纯色

3. **apple-touch-icon.png** (180x180px)
   - 用于 iOS 主屏幕图标
   - 格式：PNG
   - 背景：必须是纯色（iOS 不支持透明）

### 可选图标

4. **favicon.ico** (32x32px 或多尺寸)
   - 浏览器标签页图标
   - 格式：ICO

5. **screenshot-mobile.png** (750x1334px)
   - PWA 安装对话框中显示的移动端截图
   - 建议尺寸：iPhone 8 标准尺寸

6. **screenshot-desktop.png** (1920x1080px)
   - PWA 安装对话框中显示的桌面端截图
   - 建议尺寸：Full HD

## 设计建议

### 图标设计要点

- **主色调**：蓝色 (#3b82f6) - 与应用主题色一致
- **图案**：可以使用翻译相关的符号，如：
  - 语言符号（A ↔ 字）
  - 书本图标
  - 地球图标
  - 或简洁的 Logo

### 创建图标的工具

1. **在线工具**：
   - [Favicon.io](https://favicon.io/) - 快速生成图标
   - [RealFaviconGenerator](https://realfavicongenerator.net/) - 生成全套图标

2. **设计工具**：
   - Figma
   - Adobe Illustrator
   - Canva

3. **命令行工具**：
   ```bash
   # 使用 ImageMagick 调整尺寸
   convert source.png -resize 192x192 icon-192.png
   convert source.png -resize 512x512 icon-512.png
   convert source.png -resize 180x180 apple-touch-icon.png
   ```

## 临时方案

在正式设计图标之前，可以使用以下临时方案：

1. 访问 [Favicon.io](https://favicon.io/favicon-generator/)
2. 输入文字 "译" 或 "T"
3. 选择蓝色背景 (#3b82f6)
4. 下载生成的图标包
5. 将对应尺寸的文件重命名并放置到 `public/` 目录

## 当前状态

⚠️ **图标文件尚未添加，PWA 安装功能可能无法正常工作**

请尽快添加图标文件以完整体验 PWA 功能。
