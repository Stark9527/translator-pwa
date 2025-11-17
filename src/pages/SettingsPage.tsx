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
  BookOpen,
  RefreshCw,
  Cloud,
  CloudOff,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { ConfigService } from '@/services/config/ConfigService';
import { flashcardService } from '@/services/flashcard/FlashcardService';
import { syncService } from '@/services/sync/SyncService';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import type { TranslationEngine, UserConfig, LanguageCode } from '@/types';
import type { FlashcardGroup } from '@/types/flashcard';
import { ScrollToTop } from '@/components/ui/scroll-to-top';

type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * 语言选项
 */
const LANGUAGE_OPTIONS: { value: LanguageCode; label: string }[] = [
  { value: 'auto', label: '自动检测' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁体中文' },
  { value: 'en', label: '英语' },
  { value: 'ja', label: '日语' },
  { value: 'ko', label: '韩语' },
  { value: 'fr', label: '法语' },
  { value: 'de', label: '德语' },
  { value: 'es', label: '西班牙语' },
  { value: 'ru', label: '俄语' },
  { value: 'it', label: '意大利语' },
];

/**
 * 设置页面
 * 包含用户设置、翻译引擎配置、数据管理等
 */
export function SettingsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, signOut: authSignOut } = useAuth();
  const [theme, setTheme] = useState<ThemeMode>('auto');
  const [engine, setEngine] = useState<TranslationEngine>('google');
  const [defaultSourceLang, setDefaultSourceLang] = useState<LanguageCode>('auto');
  const [defaultTargetLang, setDefaultTargetLang] = useState<LanguageCode>('zh-CN');
  const [defaultFlashcardGroupId, setDefaultFlashcardGroupId] = useState<string>('default');
  const [flashcardGroups, setFlashcardGroups] = useState<FlashcardGroup[]>([]);
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [deeplApiKey, setDeeplApiKey] = useState('');
  const [microsoftApiKey, setMicrosoftApiKey] = useState('');
  const [microsoftRegion, setMicrosoftRegion] = useState('global');
  const [enableDictionary, setEnableDictionary] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storageQuota, setStorageQuota] = useState({
    used: 0,
    total: 5 * 1024 * 1024,
    percentage: 0,
  });

  const userEmail = user?.email || null;
  const isLoggedIn = isAuthenticated;

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
      setDefaultSourceLang(config.defaultSourceLang);
      setDefaultTargetLang(config.defaultTargetLang);
      setDefaultFlashcardGroupId(config.defaultFlashcardGroupId || 'default');
      setGoogleApiKey(config.googleApiKey || '');
      setDeeplApiKey(config.deeplApiKey || '');
      setMicrosoftApiKey(config.microsoftApiKey || '');
      setMicrosoftRegion(config.microsoftRegion || 'global');
      setEnableDictionary(config.enableDictionary !== false);
      setAutoSync(config.autoSync !== false);

      // 加载存储配额信息
      const quota = await ConfigService.getStorageQuota();
      setStorageQuota(quota);

      // 加载最后同步时间
      const syncTime = await syncService.getLastSyncTime();
      setLastSyncTime(syncTime > 0 ? syncTime : null);

      // 加载 Flashcard 分组
      const groups = await flashcardService.getAllGroups();
      setFlashcardGroups(groups);
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
        defaultSourceLang,
        defaultTargetLang,
        defaultFlashcardGroupId,
        googleApiKey: googleApiKey.trim() || undefined,
        deeplApiKey: deeplApiKey.trim() || undefined,
        microsoftApiKey: microsoftApiKey.trim() || undefined,
        microsoftRegion: microsoftRegion.trim() || undefined,
        enableDictionary,
        autoSync,
      };

      await ConfigService.saveConfig(config);

      // 更新存储配额信息
      const quota = await ConfigService.getStorageQuota();
      setStorageQuota(quota);

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

  const handleLogout = async () => {
    try {
      await authSignOut();
      toast({
        variant: 'success',
        title: '已成功登出',
        duration: 2000,
      });
      navigate('/');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: '登出失败',
        description: err instanceof Error ? err.message : '未知错误',
        duration: 3000,
      });
    }
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

  const handleManualSync = async () => {
    if (!isLoggedIn) {
      toast({
        variant: 'destructive',
        title: '请先登录',
        description: '同步功能需要登录账户',
        duration: 3000,
      });
      return;
    }

    try {
      setIsSyncing(true);
      const result = await syncService.sync();

      setLastSyncTime(result.timestamp);

      toast({
        variant: 'success',
        title: '同步完成',
        description: `上传 ${result.uploadedCount} 项，下载 ${result.downloadedCount} 项`,
        duration: 3000,
      });
    } catch (err) {
      console.error('同步失败:', err);
      toast({
        variant: 'destructive',
        title: '同步失败',
        description: err instanceof Error ? err.message : '未知错误',
        duration: 3000,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatSyncTime = (timestamp: number | null): string => {
    if (!timestamp) {
      return '从未同步';
    }

    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      return '刚刚';
    } else if (minutes < 60) {
      return `${minutes} 分钟前`;
    } else if (hours < 24) {
      return `${hours} 小时前`;
    } else {
      return `${days} 天前`;
    }
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

        {/* 默认设置 */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">默认设置</h2>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {/* 源语言 */}
            <div className="p-4 space-y-3">
              <label className="font-medium">源语言</label>
              <select
                value={defaultSourceLang}
                onChange={(e) => setDefaultSourceLang(e.target.value as LanguageCode)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 目标语言 */}
            <div className="p-4 space-y-3">
              <label className="font-medium">目标语言</label>
              <select
                value={defaultTargetLang}
                onChange={(e) => setDefaultTargetLang(e.target.value as LanguageCode)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {LANGUAGE_OPTIONS.filter((lang) => lang.value !== 'auto').map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 默认 Flashcard 分组 */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
                <label className="font-medium">默认 Flashcard 分组</label>
              </div>
              <select
                value={defaultFlashcardGroupId}
                onChange={(e) => setDefaultFlashcardGroupId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {flashcardGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.cardCount} 张卡片)
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                从翻译页或划词翻译添加到卡片时,将自动保存到此分组
              </p>
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
                  '保存默认设置'
                )}
              </button>
            </div>
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
                <form onSubmit={(e) => { e.preventDefault(); saveConfig(); }}>
                  <div className="space-y-3">
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
                  </div>
                </form>

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
                    <form onSubmit={(e) => { e.preventDefault(); saveConfig(); }}>
                      <div className="space-y-3">
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
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* DeepL API Key 配置 */}
            {engine === 'deepl' && (
              <div className="p-4 space-y-3">
                <form onSubmit={(e) => { e.preventDefault(); saveConfig(); }}>
                  <div className="space-y-3">
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
                </form>
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

        {/* 同步设置 */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">同步设置</h2>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {/* 自动同步开关 */}
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  {autoSync ? (
                    <Cloud className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  ) : (
                    <CloudOff className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">自动同步</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isLoggedIn
                        ? '开启后，数据变化会在 1 秒后自动上传，每 10 分钟自动从云端同步数据'
                        : '需要登录后才能使用同步功能'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    disabled={!isLoggedIn}
                    className="sr-only peer"
                  />
                  <div className={cn(
                    "w-11 h-6 rounded-full transition-colors",
                    "peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-2",
                    autoSync && isLoggedIn
                      ? "bg-primary"
                      : "bg-muted",
                    !isLoggedIn && "opacity-50 cursor-not-allowed"
                  )}>
                    <div className={cn(
                      "absolute top-0.5 left-0.5 bg-white rounded-full h-5 w-5 transition-transform",
                      autoSync && "translate-x-5"
                    )} />
                  </div>
                </label>
              </div>
            </div>

            {/* 同步状态和手动同步 */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className={cn(
                    "w-5 h-5",
                    isSyncing && "animate-spin text-primary"
                  )} />
                  <div>
                    <div className="font-medium">手动同步</div>
                    <p className="text-xs text-muted-foreground">
                      最近一次从云端同步: {formatSyncTime(lastSyncTime)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleManualSync}
                  disabled={!isLoggedIn || isSyncing}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
                    !isLoggedIn || isSyncing
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      同步中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      立即同步
                    </>
                  )}
                </button>
              </div>
              {!isLoggedIn && (
                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  💡 提示: 登录后可以在多个设备间同步你的学习数据
                </p>
              )}
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
                  '保存同步配置'
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
                已使用 {(storageQuota.used / 1024 / 1024).toFixed(2)} MB / {(storageQuota.total / 1024 / 1024).toFixed(0)} MB
              </p>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${storageQuota.percentage}%` }} />
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

      {/* 返回顶部按钮 */}
      <ScrollToTop threshold={100} />
    </div>
  );
}
