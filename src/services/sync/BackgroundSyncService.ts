// PWA 后台同步服务 - 使用 Background Sync API
import { syncService } from './SyncService';
import { supabaseService } from './SupabaseService';

/**
 * PWA 后台同步服务
 *
 * 功能特性：
 * - 使用 Background Sync API 在网络恢复时自动同步
 * - 离线时记录需要同步的数据
 * - 网络恢复时自动触发同步
 */
export class BackgroundSyncService {
  private static readonly SYNC_TAG = 'translator-pwa-sync';
  private static readonly PENDING_SYNC_KEY = 'translator_pwa_pending_sync';

  /**
   * 检查浏览器是否支持 Background Sync API
   */
  static isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'sync' in ServiceWorkerRegistration.prototype
    );
  }

  /**
   * 注册后台同步
   * 当网络恢复时，Service Worker 会触发同步事件
   */
  static async registerSync(): Promise<void> {
    if (!this.isSupported()) {
      console.warn('⚠️  浏览器不支持 Background Sync API');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(this.SYNC_TAG);
      console.info('✅ 已注册后台同步');
    } catch (error) {
      console.error('❌ 注册后台同步失败:', error);
    }
  }

  /**
   * 检查是否有待同步的任务
   */
  static hasPendingSync(): boolean {
    try {
      const pending = localStorage.getItem(this.PENDING_SYNC_KEY);
      return pending === 'true';
    } catch {
      return false;
    }
  }

  /**
   * 标记有待同步的数据
   */
  static markPendingSync(): void {
    try {
      localStorage.setItem(this.PENDING_SYNC_KEY, 'true');
      // 注册后台同步
      this.registerSync();
    } catch (error) {
      console.error('标记待同步失败:', error);
    }
  }

  /**
   * 清除待同步标记
   */
  static clearPendingSync(): void {
    try {
      localStorage.removeItem(this.PENDING_SYNC_KEY);
    } catch (error) {
      console.error('清除待同步标记失败:', error);
    }
  }

  /**
   * 执行后台同步
   * 这个方法会在 Service Worker 的 sync 事件中被调用
   */
  static async performBackgroundSync(): Promise<void> {
    console.info('🔄 执行后台同步...');

    try {
      // 检查是否登录
      if (!supabaseService.isAuthenticated()) {
        console.debug('ℹ️  用户未登录，跳过后台同步');
        return;
      }

      // 执行同步
      const result = await syncService.sync();

      if (result.status === 'success') {
        console.info('✅ 后台同步完成:', {
          uploaded: result.uploadedCount,
          downloaded: result.downloadedCount,
        });

        // 清除待同步标记
        this.clearPendingSync();
      } else {
        throw new Error(result.error || '同步失败');
      }
    } catch (error) {
      console.error('❌ 后台同步失败:', error);
      // 不清除待同步标记，下次网络恢复时会继续尝试
      throw error;
    }
  }

  /**
   * 获取待同步的标签列表
   */
  static async getTags(): Promise<string[]> {
    if (!this.isSupported()) {
      return [];
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.sync.getTags();
    } catch (error) {
      console.error('获取同步标签失败:', error);
      return [];
    }
  }

  /**
   * 安装 Service Worker 同步处理器
   * 这个方法应该在 Service Worker 中调用
   */
  static installSyncHandler(): void {
    if (typeof self === 'undefined' || !('ServiceWorkerGlobalScope' in self)) {
      console.warn('⚠️  此方法只能在 Service Worker 中调用');
      return;
    }

    // @ts-ignore - Service Worker 环境
    self.addEventListener('sync', async (event: SyncEvent) => {
      if (event.tag === this.SYNC_TAG) {
        console.info('🔄 触发后台同步事件');
        event.waitUntil(this.performBackgroundSync());
      }
    });

    console.info('✅ 已安装 Service Worker 同步处理器');
  }
}

/**
 * 在 Service Worker 中注册同步处理器
 * 注意：这段代码需要在 Service Worker 脚本中运行
 */
if (typeof self !== 'undefined' && 'ServiceWorkerGlobalScope' in self) {
  BackgroundSyncService.installSyncHandler();
}
