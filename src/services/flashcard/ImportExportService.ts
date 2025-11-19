// 导入导出服务
import { flashcardService } from './FlashcardService';
import type { Flashcard, FlashcardGroup } from '@/types/flashcard';

/**
 * 导出格式
 */
export type ExportFormat = 'json' | 'anki';

/**
 * 导出选项
 */
export interface ExportOptions {
  format: ExportFormat;
  includeStats?: boolean; // 是否包含学习统计
  groupIds?: string[]; // 指定导出的分组ID，不指定则导出所有
}

/**
 * 导入结果
 */
export interface ImportResult {
  flashcards: number;
  groups: number;
  errors?: string[];
}

/**
 * Anki 格式的卡片数据
 */
export interface AnkiCard {
  word: string;
  translation: string;
  pronunciation?: string;
  notes?: string;
  tags: string;
}

/**
 * 导入导出服务
 * 处理文件的导入导出操作
 */
export class ImportExportService {
  /**
   * 导出为 JSON 文件
   */
  async exportToJSON(options?: Partial<ExportOptions>): Promise<void> {
    try {
      // 获取数据
      const jsonString = await flashcardService.exportAll();
      const data = JSON.parse(jsonString);

      // 如果指定了分组，进行过滤
      if (options?.groupIds && options.groupIds.length > 0) {
        data.flashcards = data.flashcards.filter((card: Flashcard) =>
          options.groupIds!.includes(card.groupId)
        );
        data.groups = data.groups.filter((group: FlashcardGroup) =>
          options.groupIds!.includes(group.id)
        );
      }

      // 如果不包含统计，移除学习数据
      if (!options?.includeStats) {
        data.flashcards = data.flashcards.map((card: Flashcard) => ({
          ...card,
          fsrsCard: undefined,
          totalReviews: 0,
          correctCount: 0,
          wrongCount: 0,
          averageResponseTime: 0,
          proficiency: 'new',
        }));
      }

      // 生成文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `flashcards-export-${timestamp}.json`;

      // 下载文件
      this.downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
    } catch (error) {
      console.error('Export to JSON failed:', error);
      throw new Error('导出 JSON 失败: ' + (error as Error).message);
    }
  }

  /**
   * 导出为 Anki 格式 (CSV)
   * Anki 支持的 CSV 格式：word, translation, pronunciation, examples, notes, tags
   */
  async exportToAnki(options?: Partial<ExportOptions>): Promise<void> {
    try {
      // 获取卡片数据
      let flashcards = await flashcardService.getAll();

      // 如果指定了分组，进行过滤
      if (options?.groupIds && options.groupIds.length > 0) {
        flashcards = flashcards.filter(card => options.groupIds!.includes(card.groupId));
      }

      // 转换为 Anki 格式
      const ankiCards: AnkiCard[] = flashcards.map(card => ({
        word: card.word,
        translation: card.translation,
        pronunciation: card.pronunciation || '',
        notes: card.notes || '',
        tags: card.tags.join(' '),
      }));

      // 生成 CSV
      const csv = this.convertToCSV(ankiCards);

      // 生成文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `flashcards-anki-${timestamp}.csv`;

      // 下载文件
      this.downloadFile(csv, filename, 'text/csv;charset=utf-8');
    } catch (error) {
      console.error('Export to Anki failed:', error);
      throw new Error('导出 Anki 格式失败: ' + (error as Error).message);
    }
  }

  /**
   * 从 JSON 文件导入
   */
  async importFromJSON(file: File): Promise<ImportResult> {
    try {
      // 读取文件
      const text = await this.readFileAsText(file);

      // 导入数据
      const result = await flashcardService.importFromJSON(text);

      return {
        flashcards: result.flashcards,
        groups: result.groups,
      };
    } catch (error) {
      console.error('Import from JSON failed:', error);
      throw new Error('导入 JSON 失败: ' + (error as Error).message);
    }
  }

  /**
   * 从 Anki CSV 文件导入
   * CSV 格式：word, translation, pronunciation, notes, tags
   */
  async importFromAnki(file: File): Promise<ImportResult> {
    try {
      // 读取文件
      const text = await this.readFileAsText(file);

      // 解析 CSV
      const ankiCards = this.parseCSV(text);

      // 转换为 Flashcard 格式并导入
      let importedCount = 0;
      const errors: string[] = [];

      for (const ankiCard of ankiCards) {
        try {
          // 检查是否已存在
          const exists = await flashcardService.exists(
            ankiCard.word,
            'en', // Anki 默认源语言为英文
            'zh-CN' // 默认目标语言为中文
          );

          if (!exists) {
            await flashcardService.create({
              word: ankiCard.word,
              translation: ankiCard.translation,
              pronunciation: ankiCard.pronunciation || undefined,
              notes: ankiCard.notes || undefined,
              sourceLanguage: 'en',
              targetLanguage: 'zh-CN',
              engine: 'google',
              tags: ankiCard.tags ? ankiCard.tags.split(' ').filter(t => t.trim()) : [],
            });
            importedCount++;
          }
        } catch (error) {
          errors.push(`导入失败: ${ankiCard.word} - ${(error as Error).message}`);
        }
      }

      return {
        flashcards: importedCount,
        groups: 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('Import from Anki failed:', error);
      throw new Error('导入 Anki 格式失败: ' + (error as Error).message);
    }
  }

  /**
   * 导出（根据格式自动选择）
   */
  async export(options: ExportOptions): Promise<void> {
    if (options.format === 'json') {
      await this.exportToJSON(options);
    } else if (options.format === 'anki') {
      await this.exportToAnki(options);
    } else {
      throw new Error(`不支持的导出格式: ${options.format}`);
    }
  }

  /**
   * 导入（根据文件类型自动选择）
   */
  async import(file: File): Promise<ImportResult> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'json') {
      return this.importFromJSON(file);
    } else if (extension === 'csv') {
      return this.importFromAnki(file);
    } else {
      throw new Error(`不支持的文件格式: ${extension}`);
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 下载文件
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    // 创建 Blob
    const blob = new Blob([content], { type: mimeType });

    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // 触发下载
    document.body.appendChild(link);
    link.click();

    // 清理
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * 读取文件为文本
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('文件读取失败'));
        }
      };

      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };

      reader.readAsText(file, 'utf-8');
    });
  }

  /**
   * 转换对象数组为 CSV
   */
  private convertToCSV(data: AnkiCard[]): string {
    if (data.length === 0) {
      return '';
    }

    // CSV 头部
    const headers = ['word', 'translation', 'pronunciation', 'notes', 'tags'];
    const csvRows: string[] = [];

    // 添加头部（带 BOM 以支持 Excel 正确显示中文）
    csvRows.push('\uFEFF' + headers.join(','));

    // 添加数据行
    for (const card of data) {
      const row = headers.map(header => {
        const value = card[header as keyof AnkiCard] || '';
        // 转义双引号并用双引号包裹含逗号、换行或双引号的字段
        const escaped = String(value).replace(/"/g, '""');
        return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
      });
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * 解析 CSV 为对象数组
   */
  private parseCSV(csv: string): AnkiCard[] {
    // 移除 BOM
    const text = csv.replace(/^\uFEFF/, '');
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      return [];
    }

    // 解析头部
    const headers = this.parseCSVLine(lines[0]);

    // 解析数据行
    const cards: AnkiCard[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);

      if (values.length !== headers.length) {
        console.warn(`第 ${i + 1} 行列数不匹配，跳过`);
        continue;
      }

      const card: Record<string, string> = {};
      headers.forEach((header, index) => {
        card[header] = values[index];
      });

      // 验证必填字段
      if (card.word && card.translation) {
        cards.push(card as unknown as AnkiCard);
      } else {
        console.warn(`第 ${i + 1} 行缺少必填字段，跳过`);
      }
    }

    return cards;
  }

  /**
   * 解析 CSV 的一行
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // 转义的双引号
          currentValue += '"';
          i++; // 跳过下一个引号
        } else {
          // 切换引号状态
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        // 字段分隔符
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }

    // 添加最后一个字段
    values.push(currentValue);

    return values;
  }
}

/**
 * 单例实例
 */
export const importExportService = new ImportExportService();
