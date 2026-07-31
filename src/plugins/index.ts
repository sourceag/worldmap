// ============================================
// 插件注册中心 - 注册所有内置插件
// ============================================

import { pluginManager } from '../core/PluginManager';
import { worldForgeAPI } from '../core/WorldForgeAPI';
import { markdownExporter } from './MarkdownExporter';
import { jsonExporter, jsonImporter } from './JsonExporter';
import { obsidianSyncAdapter, createObsidianEventHandler } from './ObsidianSync';

export function registerBuiltInPlugins(): void {
  // Register exporters
  pluginManager.registerExporter(markdownExporter.format, markdownExporter);
  pluginManager.registerExporter(jsonExporter.format, jsonExporter);

  // Register importers
  pluginManager.registerImporter(jsonImporter.format, jsonImporter);

  // Register plugin manifests
  pluginManager.registerPlugin(obsidianSyncAdapter);

  // Register event listeners for sync adapters
  const obsidianHandler = createObsidianEventHandler(new Map());
  pluginManager.on('entity:created', obsidianHandler);
  pluginManager.on('entity:updated', obsidianHandler);
  pluginManager.on('entity:deleted', obsidianHandler);

  console.log('[PluginRegistry] All built-in plugins registered');
}
