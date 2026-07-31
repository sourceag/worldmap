// ============================================
// 插件管理器
// ============================================

import type {
  PluginManifest,
  WorldForgeAPI,
  ExporterPlugin,
  ImporterPlugin,
  ValidatorPlugin,
  WorldEventPayload,
  ExportOptions,
  ImportOptions,
  ImportResult,
  ValidationIssue,
} from '../types';
import { eventBus } from './EventBus';
import type { World } from '../types';

type EntityMap = Map<string, unknown[]>;

class PluginManager {
  private plugins: Map<string, PluginManifest> = new Map();
  private exporters: Map<string, ExporterPlugin> = new Map();
  private importers: Map<string, ImporterPlugin> = new Map();
  private validators: Map<string, ValidatorPlugin> = new Map();
  private api: WorldForgeAPI | null = null;

  setAPI(api: WorldForgeAPI): void {
    this.api = api;
  }

  // === 插件注册 ===

  registerPlugin(manifest: PluginManifest): void {
    if (this.plugins.has(manifest.id)) {
      console.warn(`[PluginManager] Plugin "${manifest.id}" already registered, skipping.`);
      return;
    }
    this.plugins.set(manifest.id, manifest);
    console.log(`[PluginManager] Registered plugin: ${manifest.name} (${manifest.id})`);
  }

  unregisterPlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      // Clean up exporters/importers/validators registered by this plugin
      if (plugin.type === 'data-exporter') {
        this.exporters.delete(plugin.id);
      } else if (plugin.type === 'data-importer') {
        this.importers.delete(plugin.id);
      } else if (plugin.type === 'validator') {
        this.validators.delete(plugin.id);
      }
      this.plugins.delete(pluginId);
    }
  }

  enablePlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = true;
    }
  }

  disablePlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = false;
    }
  }

  getPlugin(pluginId: string): PluginManifest | undefined {
    return this.plugins.get(pluginId);
  }

  getAllPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values());
  }

  getEnabledPlugins(): PluginManifest[] {
    return this.getAllPlugins().filter(p => p.enabled);
  }

  // === 导出器 ===

  registerExporter(format: string, exporter: ExporterPlugin): void {
    this.exporters.set(format, exporter);
    console.log(`[PluginManager] Registered exporter: ${format}`);
  }

  getExporter(format: string): ExporterPlugin | undefined {
    return this.exporters.get(format);
  }

  getAvailableExporters(): string[] {
    return Array.from(this.exporters.keys());
  }

  async export(format: string, data: unknown, options: ExportOptions): Promise<string> {
    const exporter = this.exporters.get(format);
    if (!exporter) {
      throw new Error(`No exporter registered for format: ${format}`);
    }
    return exporter.export(data, options);
  }

  // === 导入器 ===

  registerImporter(format: string, importer: ImporterPlugin): void {
    this.importers.set(format, importer);
    console.log(`[PluginManager] Registered importer: ${format}`);
  }

  getImporter(format: string): ImporterPlugin | undefined {
    return this.importers.get(format);
  }

  getAvailableImporters(): string[] {
    return Array.from(this.importers.keys());
  }

  async import(format: string, data: string, options: ImportOptions): Promise<ImportResult> {
    const importer = this.importers.get(format);
    if (!importer) {
      throw new Error(`No importer registered for format: ${format}`);
    }
    return importer.import(data, options);
  }

  // === 校验器 ===

  registerValidator(name: string, validator: ValidatorPlugin): void {
    this.validators.set(name, validator);
    console.log(`[PluginManager] Registered validator: ${name}`);
  }

  getValidator(name: string): ValidatorPlugin | undefined {
    return this.validators.get(name);
  }

  getAllValidators(): ValidatorPlugin[] {
    return Array.from(this.validators.values());
  }

  async runValidation(world: World, entities: EntityMap): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    for (const validator of this.validators.values()) {
      try {
        const result = validator.validate(world, entities);
        issues.push(...result);
      } catch (error) {
        console.error(`[PluginManager] Validator "${validator.name}" error:`, error);
      }
    }
    return issues;
  }

  // === 事件代理 ===

  on(event: string, handler: (payload: WorldEventPayload) => void): void {
    eventBus.on(event, handler);
  }

  off(event: string, handler: (payload: WorldEventPayload) => void): void {
    eventBus.off(event, handler);
  }

  emit(event: string, payload: WorldEventPayload): void {
    eventBus.emit(event, payload);
  }
}

// Singleton
export const pluginManager = new PluginManager();
export default PluginManager;
