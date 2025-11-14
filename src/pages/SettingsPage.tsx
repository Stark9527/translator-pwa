import { useState, useEffect } from 'react';
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
  ExternalLink,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { ConfigService } from '@/services/config/ConfigService';
import { useToast } from '@/hooks/useToast';
import type { TranslationEngine, UserConfig } from '@/types';

type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * 设置页面
 * 包含用户设置、翻译引擎配置、数据管理等
 */
export function SettingsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [theme, setTheme] = useState<ThemeMode>('auto');
  const [engine, setEngine] = useState<TranslationEngine>('google');
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [deeplApiKey, setDeeplApiKey] = useState('');
  const [microsoftApiKey, setMicrosoftApiKey] = useState('');
  const [microsoftRegion, setMicrosoftRegion] = useState('global');
  const [enableDictionary, setEnableDictionary] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: 从实际的状态管理中获取这些值
  const userEmail = null;
  const isLoggedIn = false;

  // 加载配置
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const config = await ConfigService.getConfig();
      setEngine(config.engine);
      setTheme(config.theme || 'auto');
      setGoogleApiKey(config.googleApiKey || '');
      setDeeplApiKey(config.deeplApiKey || '');
      setMicrosoftApiKey(config.microsoftApiKey || '');
      setMicrosoftRegion(config.microsoftRegion || 'global');
      setEnableDictionary(config.enableDictionary !== false);
    } catch (err) {
      console.error('Failed to load config:', err);
      setError('加载配置失败');
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setError(null);
      setIsSaving(true);

      const config: Partial<UserConfig> = {
        engine,
        theme,
        googleApiKey: googleApiKey.trim() || undefined,
        deeplApiKey: deeplApiKey.trim() || undefined,
        microsoftApiKey: microsoftApiKey.trim() || undefined,
        microsoftRegion: microsoftRegion.trim() || undefined,
        enableDictionary,
      };

      await ConfigService.saveConfig(config);

      toast({
        variant: 'success',
        title: '配置保存成功',
        duration: 2000,
      });
    } catch (err) {
      console.error('Failed to save config:', err);
      setError('保存配置失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    // TODO: 调用 Supabase 登出
    toast({
      variant: 'default',
      title: '登出功能开发中',
      duration: 2000,
    });
  };

  const handleExportData = () => {
    // TODO: 导出 Flashcard 数据
    toast({
      variant: 'default',
      title: '导出功能开发中',
      duration: 2000,
    });
  };

  const handleImportData = () => {
    // TODO: 导入 Flashcard 数据
    toast({
      variant: 'default',
      title: '导入功能开发中',
      duration: 2000,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-16 md:pb-0 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* 错误提示 */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-destructive hover:text-destructive/80 text-xl leading-none"
            >
              ×
            </button>
          </div>
        )}

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
                onChange={(e) => setEngine(e.target.value as TranslationEngine)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="google">Google 翻译</option>
                <option value="deepl">DeepL（暂未实现）</option>
                <option value="openai">OpenAI（暂未实现）</option>
              </select>
            </div>

            {/* Google API Key 配置 */}
            {engine === 'google' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-muted-foreground" />
                    <label className="font-medium">Google API Key</label>
                  </div>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    获取 API Key
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={googleApiKey}
                  onChange={(e) => setGoogleApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground">
                  需要启用 Cloud Translation API。API Key 将安全存储在本地。
                </p>

                {/* 词典功能开关 */}
                <div className="pt-3 border-t border-border">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableDictionary}
                      onChange={(e) => setEnableDictionary(e.target.checked)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">启用智能词典功能</span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    提供音标、词性、例句等详细信息（需要 Microsoft API Key）
                  </p>
                </div>

                {/* Microsoft API Key 配置（词典功能） */}
                {enableDictionary && (
                  <div className="pt-3 border-t border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Microsoft API Key（可选）</label>
                      <a
                        href="https://portal.azure.com/#create/Microsoft.CognitiveServicesTextTranslation"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        获取 API Key
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <input
                      type="password"
                      value={microsoftApiKey}
                      onChange={(e) => setMicrosoftApiKey(e.target.value)}
                      placeholder="Microsoft Translator API Key"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div>
                      <label className="text-sm font-medium">Azure 区域</label>
                      <input
                        type="text"
                        value={microsoftRegion}
                        onChange={(e) => setMicrosoftRegion(e.target.value)}
                        placeholder="global"
                        className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        例如：global, eastus, westus2
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DeepL API Key 配置 */}
            {engine === 'deepl' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-muted-foreground" />
                    <label className="font-medium">DeepL API Key</label>
                  </div>
                  <a
                    href="https://www.deepl.com/pro-api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    获取 API Key
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={deeplApiKey}
                  onChange={(e) => setDeeplApiKey(e.target.value)}
                  placeholder="输入 DeepL API Key"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground">
                  API Key 将安全存储在本地
                </p>
              </div>
            )}

            {/* 保存按钮 */}
            <div className="p-4">
              <button
                onClick={saveConfig}
                disabled={isSaving}
                className={cn(
                  'w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
                  isSaving
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  '保存翻译配置'
                )}
              </button>
            </div>
          </div>
        </section>

        {/* 外观设置 */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">外观</h2>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            <div className="p-4 space-y-3">
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

            {/* 保存按钮 */}
            <div className="p-4">
              <button
                onClick={saveConfig}
                disabled={isSaving}
                className={cn(
                  'w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
                  isSaving
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  '保存外观配置'
                )}
              </button>
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
