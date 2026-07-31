// ============================================
// 内置插件：JSON 导出器
// ============================================

import type { ExporterPlugin, ExportOptions, ImporterPlugin, ImportOptions, ImportResult } from '../types';

export const jsonExporter: ExporterPlugin = {
  format: 'json',
  fileExtension: '.json',

  async export(data: unknown, options: ExportOptions): Promise<string> {
    const d = data as Record<string, unknown>;
    const exportData = {
      _version: '1.0',
      _exportedAt: new Date().toISOString(),
      ...d,
    };
    return options.format === 'pretty'
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);
  },
};

export const jsonImporter: ImporterPlugin = {
  format: 'json',
  fileExtension: '.json',

  async import(data: string, options: ImportOptions): Promise<ImportResult> {
    try {
      const parsed = JSON.parse(data);
      // Remove internal fields
      delete parsed._version;
      delete parsed._exportedAt;
      
      return {
        success: true,
        imported: Object.keys(parsed).length,
        errors: [],
        warnings: [],
      };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [`JSON parse error: ${(error as Error).message}`],
        warnings: [],
      };
    }
  },
};
