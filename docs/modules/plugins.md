# 插件系统 (plugins/)

**注册中心**: `src/plugins/index.ts`

---

## 架构

```
PluginManager (core/PluginManager.ts)
    │
    ├── 导出器 (data-exporter)
    │   ├── MarkdownExporter → .md
    │   └── JsonExporter → .json
    │
    ├── 导入器 (data-importer)
    │   └── JsonImporter ← .json
    │
    ├── 校验器 (validator)
    │   └── （可扩展）
    │
    ├── 事件监听器 (event-listener)
    │   └── （可扩展）
    │
    └── 同步适配器 (sync-adapter)
        └── ObsidianSync → Obsidian Vault
```

---

## 注册中心

**文件**: `src/plugins/index.ts`

```typescript
export function registerBuiltInPlugins(): void {
  // 注册导出器
  pluginManager.registerExporter(markdownExporter.format, markdownExporter);
  pluginManager.registerExporter(jsonExporter.format, jsonExporter);

  // 注册导入器
  pluginManager.registerImporter(jsonImporter.format, jsonImporter);

  // 注册插件清单
  pluginManager.registerPlugin(obsidianSyncAdapter);

  // 监听事件驱动同步
  const obsidianHandler = createObsidianEventHandler(new Map());
  pluginManager.on('entity:created', obsidianHandler);
  pluginManager.on('entity:updated', obsidianHandler);
  pluginManager.on('entity:deleted', obsidianHandler);
}
```

---

## MarkdownExporter

**文件**: `src/plugins/MarkdownExporter.ts`

导出为 Markdown 文档，支持 Obsidian 双向链接语法。

```typescript
export const markdownExporter: ExporterPlugin = {
  format: 'markdown',
  fileExtension: '.md',
  export: async (data: unknown, options: ExportOptions): Promise<string> {
    // 1. 生成标题（世界名称）
    // 2. 生成各章节（大陆、区域、地点、势力、事件、人物）
    // 3. 使用 [[名称]] 格式生成双向链接
  }
};
```

**输出示例**:
```markdown
# 艾泽拉斯

## 大陆
### [[卡利多雷]]
描述...

## 区域
### [[暴风城]]
- 类型: city
- 描述: ...
```

---

## JsonExporter / JsonImporter

**文件**: `src/plugins/JsonExporter.ts`

JSON 格式导入导出，用于数据备份和迁移。

```typescript
// 导出器
export const jsonExporter: ExporterPlugin = {
  format: 'json',
  fileExtension: '.json',
  export: async (data, options) => {
    const exportData = {
      _version: '1.0',
      _exportedAt: new Date().toISOString(),
      ...data,
    };
    return options.format === 'pretty'
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);
  }
};

// 导入器
export const jsonImporter: ImporterPlugin = {
  format: 'json',
  fileExtension: '.json',
  import: async (data, options) => {
    const parsed = JSON.parse(data);
    delete parsed._version;
    delete parsed._exportedAt;
    return { success: true, imported: Object.keys(parsed).length, errors: [], warnings: [] };
  }
};
```

---

## ObsidianSync

**文件**: `src/plugins/ObsidianSync.ts`

与 Obsidian 笔记双向同步的适配器框架。

```typescript
// 插件清单
export const obsidianSyncAdapter: PluginManifest = {
  id: 'obsidian-sync',
  name: 'Obsidian 同步',
  version: '1.0.0',
  type: 'sync-adapter',
  permissions: ['read:locations', 'read:factions', 'read:characters', 'read:events',
                'write:locations', 'write:factions', 'write:characters', 'write:events'],
  config: { vaultPath: '', syncInterval: 30 },
  enabled: true,
};

// 事件处理器（监听数据变更）
export function createObsidianEventHandler(allEntities: Map<string, unknown[]>) {
  return async (payload: WorldEventPayload) => {
    // 1. 将实体转换为 Obsidian 笔记格式
    // 2. 生成带 frontmatter 的 Markdown
    // 3. 写入/更新/删除对应文件
  };
}

// 实体 → Obsidian 笔记转换
function entityToObsidianContent(entityType, entity, allEntities): string {
  // 生成 YAML frontmatter
  // 生成内容（含双向链接）
}

// Obsidian 笔记 → 实体解析
function obsidianContentToEntity(content: string): Record<string, unknown> {
  // 解析 frontmatter
  // 提取描述
}
```

**当前状态**: 框架级实现，文件 I/O 需要 Tauri 桌面端支持。

---

## 扩展新插件

```typescript
// 1. 实现插件接口
const myExporter: ExporterPlugin = {
  format: 'myformat',
  fileExtension: '.mf',
  export: async (data, options) => {
    // 转换逻辑
    return '导出内容';
  }
};

// 2. 在 index.ts 注册
pluginManager.registerExporter('myformat', myExporter);
```
