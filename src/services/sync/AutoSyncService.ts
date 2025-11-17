// 自动同步服务 - 定时自动同步
import { syncService } from './SyncService';
import { supabaseService } from './SupabaseService';
import { ConfigService } from '../config/ConfigService';

/**
 * 自动同步配置
 */
interface AutoSyncConfig {
  enabled: boolean;           // 是否启用自动同步
  interval: number;           // 同步间隔（毫秒）
  onlyWhenIdle: boolean;      // 仅在空闲时同步
  requireNetwork: boolean;    // 需要网络连接
}

/**
 * 同步状态
 */
export enum AutoSyncState {
  Idle = 'idle',              // 空闲
  Syncing = 'syncing',        // 正在同步
  Error = 'error',            // 错误
}

/**
 * 自动同步服务
 *
 * 功能特性：
 * - 定时自动同步（默认 10 分钟）
 * - 网络状态检测
 * - 空闲检测（可选）
 * - 可配置的同步间隔
 * - 错误重试机制
 */
export class AutoSyncService {
  private syncTimer: number | null = null;
  private state: AutoSyncState = AutoSyncState.Idle;
  private lastSyncTime: number = 0;
  private lastError: Error | null = null;
  private retryCount: number = 0;
  private readonly MAX_RETRY = 3;

  // 默认配置
  private config: AutoSyncConfig = {
    enabled: true,
    interval: 10 * 60 * 1000,  // 10 分钟
    onlyWhenIdle: false,        // 不限制空闲状态
    requireNetwork: true,       // 需要网络
  };

  // 监听器
  private stateChangeListeners = new Set<(state: AutoSyncState) => void>();
  private syncCompleteListeners = new Set<(success: boolean) => void>();

  /**
   * 启动自动同步
   */
  async start(customConfig?: Partial<AutoSyncConfig>): Promise<void> {
    // 合并配置
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    // 从用户配置中读取 autoSync 设置
    const userConfig = await ConfigService.getConfig();
    if (userConfig.autoSync === false) {
      console.info('⏸️  自动同步已在配置中禁用');
      return;
    }

    if (!this.config.enabled) {
      console.info('⏸️  自动同步未启用');
      return;
    }

    console.info(`✅ 启动自动同步，间隔 ${this.config.interval / 1000} 秒`);

    // 启动定时器
    this.scheduleNextSync();

    // 监听网络状态变化
    if (this.config.requireNetwork) {
      window.addEventListener('online', this.handleNetworkOnline);
      window.addEventListener('offline', this.handleNetworkOffline);
    }

    // 监听可见性变化（从后台切换回来时可能需要同步）
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * 停止自动同步
   */
  stop(): void {
    console.info('⏸️  停止自动同步');

    // 清除定时器
    if (this.syncTimer !== null) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }

    // 移除事件监听
    window.removeEventListener('online', this.handleNetworkOnline);
    window.removeEventListener('offline', this.handleNetworkOffline);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    this.setState(AutoSyncState.Idle);
  }

  /**
   * 调度下一次同步
   */
  private scheduleNextSync(): void {
    // 清除现有定时器
    if (this.syncTimer !== null) {
      clearTimeout(this.syncTimer);
    }

    // 设置新定时器
    this.syncTimer = window.setTimeout(() => {
      this.performSync();
    }, this.config.interval);
  }

  /**
   * 执行同步
   */
  private async performSync(): Promise<void> {
    // 检查是否已在同步中
    if (this.state === AutoSyncState.Syncing) {
      console.warn('⚠️  同步正在进行中，跳过本次同步');
      this.scheduleNextSync();
      return;
    }

    // 检查是否登录
    if (!supabaseService.isAuthenticated()) {
      console.debug('ℹ️  用户未登录，跳过自动同步');
      this.scheduleNextSync();
      return;
    }

    // 检查网络连接
    if (this.config.requireNetwork && !navigator.onLine) {
      console.debug('ℹ️  无网络连接，跳过自动同步');
      this.scheduleNextSync();
      return;
    }

    // 检查是否需要等待空闲
    if (this.config.onlyWhenIdle) {
      const isIdle = await this.checkIdleState();
      if (!isIdle) {
        console.debug('ℹ️  用户活动中，跳过自动同步');
        this.scheduleNextSync();
        return;
      }
    }

    // 执行同步
    this.setState(AutoSyncState.Syncing);
    console.info('🔄 开始自动同步...');

    try {
      const result = await syncService.sync();

      if (result.status === 'success') {
        this.lastSyncTime = Date.now();
        this.lastError = null;
        this.retryCount = 0;

        console.info('✅ 自动同步完成:', {
          uploaded: result.uploadedCount,
          downloaded: result.downloadedCount,
        });

        this.setState(AutoSyncState.Idle);
        this.notifySyncComplete(true);
      } else {
        throw new Error(result.error || '同步失败');
      }
    } catch (error) {
      console.error('❌ 自动同步失败:', error);
      this.lastError = error as Error;
      this.setState(AutoSyncState.Error);
      this.notifySyncComplete(false);

      // 错误重试
      if (this.retryCount < this.MAX_RETRY) {
        this.retryCount++;
        console.info(`🔄 将在 ${this.config.interval / 1000} 秒后重试（${this.retryCount}/${this.MAX_RETRY}）`);
      }
    } finally {
      // 调度下一次同步
      this.scheduleNextSync();
    }
  }

  /**
   * 检查空闲状态
   * 使用 Idle Detection API（如果可用）或简单的活动检测
   */
  private async checkIdleState(): Promise<boolean> {
    // 检查是否支持 Idle Detection API
    if ('IdleDetector' in window) {
      try {
        const idleDetector = new (window as any).IdleDetector();
        await idleDetector.start({
          threshold: 60000, // 1 分钟
        });

        const state = idleDetector.userState;
        return state === 'idle';
      } catch (error) {
        console.warn('Idle Detection API 不可用:', error);
      }
    }

    // 降级方案：假设总是空闲（或检查页面可见性）
    return !document.hidden;
  }

  /**
   * 处理网络连接恢复
   */
  private handleNetworkOnline = async () => {
    console.info('🌐 网络连接已恢复');

    // 如果距离上次同步超过一定时间，立即执行同步
    const timeSinceLastSync = Date.now() - this.lastSyncTime;
    if (timeSinceLastSync > this.config.interval) {
      console.info('🔄 检测到网络恢复，立即执行同步');
      await this.performSync();
    }
  };

  /**
   * 处理网络断开
   */
  private handleNetworkOffline = () => {
    console.info('📡 网络连接已断开');
  };

  /**
   * 处理可见性变化
   */
  private handleVisibilityChange = async () => {
    if (!document.hidden) {
      // 页面变为可见
      const timeSinceLastSync = Date.now() - this.lastSyncTime;

      // 如果距离上次同步超过间隔时间，执行同步
      if (timeSinceLastSync > this.config.interval && supabaseService.isAuthenticated()) {
        console.info('👀 页面恢复可见，检查是否需要同步');
        await this.performSync();
      }
    }
  };

  /**
   * 立即执行同步（手动触发）
   */
  async syncNow(): Promise<void> {
    console.info('🔄 手动触发立即同步');
    await this.performSync();
  }

  /**
   * 设置状态
   */
  private setState(state: AutoSyncState): void {
    if (this.state !== state) {
      this.state = state;
      this.notifyStateChange(state);
    }
  }

  /**
   * 通知状态变化
   */
  private notifyStateChange(state: AutoSyncState): void {
    this.stateChangeListeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('状态变化监听器错误:', error);
      }
    });
  }

  /**
   * 通知同步完成
   */
  private notifySyncComplete(success: boolean): void {
    this.syncCompleteListeners.forEach(listener => {
      try {
        listener(success);
      } catch (error) {
        console.error('同步完成监听器错误:', error);
      }
    });
  }

  /**
   * 添加状态变化监听器
   */
  onStateChange(callback: (state: AutoSyncState) => void): () => void {
    this.stateChangeListeners.add(callback);
    return () => this.stateChangeListeners.delete(callback);
  }

  /**
   * 添加同步完成监听器
   */
  onSyncComplete(callback: (success: boolean) => void): () => void {
    this.syncCompleteListeners.add(callback);
    return () => this.syncCompleteListeners.delete(callback);
  }

  /**
   * 获取当前状态
   */
  getState(): AutoSyncState {
    return this.state;
  }

  /**
   * 获取上次同步时间
   */
  getLastSyncTime(): number {
    return this.lastSyncTime;
  }

  /**
   * 获取上次错误
   */
  getLastError(): Error | null {
    return this.lastError;
  }

  /**
   * 更新配置
   */
  async updateConfig(config: Partial<AutoSyncConfig>): Promise<void> {
    this.config = { ...this.config, ...config };

    // 如果正在运行，重启以应用新配置
    if (this.syncTimer !== null) {
      this.stop();
      await this.start();
    }
  }

  /**
   * 获取配置
   */
  getConfig(): AutoSyncConfig {
    return { ...this.config };
  }

  /**
   * 获取同步统计信息
   */
  getStats(): {
    state: AutoSyncState;
    lastSyncTime: number;
    nextSyncTime: number;
    retryCount: number;
    hasError: boolean;
    errorMessage: string | null;
  } {
    const now = Date.now();
    const nextSyncTime = this.lastSyncTime + this.config.interval;

    return {
      state: this.state,
      lastSyncTime: this.lastSyncTime,
      nextSyncTime: nextSyncTime > now ? nextSyncTime : now,
      retryCount: this.retryCount,
      hasError: this.lastError !== null,
      errorMessage: this.lastError?.message || null,
    };
  }
}

/**
 * 单例实例
 */
export const autoSyncService = new AutoSyncService();
