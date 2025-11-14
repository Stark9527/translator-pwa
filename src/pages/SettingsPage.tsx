import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Globe,
  Moon,
  Sun,
  Download,
  Upload,
  LogOut,
  ChevronRight,
  Database,
  Key,
} from 'lucide-react';
import { cn } from '@/utils/cn';

type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * 设置页面
 * 包含用户设置、翻译引擎配置、数据管理等
 */
export function SettingsPage() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<ThemeMode>('auto');
  const [engine, setEngine] = useState('google');

  // TODO: 从实际的状态管理中获取这些值
  const userEmail = null;
  const isLoggedIn = false;

  const handleLogout = () => {
    // TODO: 调用 Supabase 登出
    console.log('Logout');
  };

  const handleExportData = () => {
    // TODO: 导出 Flashcard 数据
    console.log('Export data');
  };

  const handleImportData = () => {
    // TODO: 导入 Flashcard 数据
    console.log('Import data');
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* 用户信息 */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">账户</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-3 p-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{userEmail}</p>
                    <p className="text-sm text-muted-foreground">已登录</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between p-4 border-t border-border hover:bg-accent transition-colors"
                >
                  <span className="flex items-center gap-2 text-destructive">
                    <LogOut className="w-5 h-5" />
                    退出登录
                  </span>
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors"
              >
                <span className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  登录账户
                </span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </div>
        </section>

        {/* 翻译设置 */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">翻译设置</h2>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {/* 翻译引擎 */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <label className="font-medium">翻译引擎</label>
              </div>
              <select
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="google">Google 翻译</option>
                <option value="deepl">DeepL</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>

            {/* API Key 配置 */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-muted-foreground" />
                <label className="font-medium">Google API Key</label>
              </div>
              <input
                type="password"
                placeholder="输入你的 API Key"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">
                API Key 将安全存储在本地
              </p>
            </div>
          </div>
        </section>

        {/* 外观设置 */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">外观</h2>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              {theme === 'light' ? (
                <Sun className="w-5 h-5 text-muted-foreground" />
              ) : theme === 'dark' ? (
                <Moon className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Sun className="w-5 h-5 text-muted-foreground" />
              )}
              <label className="font-medium">主题模式</label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'auto'] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTheme(mode)}
                  className={cn(
                    'px-4 py-2 rounded-lg border transition-colors',
                    theme === mode
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:bg-accent'
                  )}
                >
                  {mode === 'light' && '浅色'}
                  {mode === 'dark' && '深色'}
                  {mode === 'auto' && '自动'}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 数据管理 */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">数据管理</h2>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors"
            >
              <span className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                导出 Flashcard 数据
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={handleImportData}
              className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors"
            >
              <span className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                导入 Flashcard 数据
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">存储空间</span>
              </div>
              <p className="text-sm text-muted-foreground">
                已使用 2.3 MB / 5 MB
              </p>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[46%]" />
              </div>
            </div>
          </div>
        </section>

        {/* 关于 */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">关于</h2>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="font-medium mb-1">智能翻译助手 PWA</p>
            <p className="text-sm text-muted-foreground">版本 0.1.0</p>
            <p className="text-sm text-muted-foreground mt-2">
              基于 FSRS 算法的智能学习系统
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
