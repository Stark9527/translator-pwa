// 初始化 Supabase 和同步服务
import { supabaseService } from '@/services/sync/SupabaseService';
import { syncService } from '@/services/sync/SyncService';

// 在扩展安装或启动时初始化 Supabase
supabaseService.initialize();

// 导出供其他模块使用
export { supabaseService, syncService };
