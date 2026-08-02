# 核心层 (core/)

---

## EventBus.ts — 事件总线

**文件**: `src/core/EventBus.ts` (45 行)

发布-订阅模式，用于插件系统的事件通信。

```typescript
type EventName = 'entity:created' | 'entity:updated' | 'entity:deleted' | string;

class EventBus {
  on(event: EventName, handler: EventHandler): void;
  off(event: EventName, handler: EventHandler): void;
  emit(event: EventName, payload: WorldEventPayload): void;
  removeAllListeners(): void;
  getListenerCount(event: EventName): number;
}

export const eventBus: EventBus;  // 单例
```

**通配符订阅**: 监听 `'*'` 可接收所有事件。

---

## History.ts — 撤销/重做管理器

**文件**: `src/core/History.ts` (140 行)

基于快照的历史记录管理，支持最多 50 步撤销。

### 接口

```typescript
type ActionType =
  | 'create-world' | 'update-world' | 'delete-world'
  | 'create-continent' | 'update-continent' | 'delete-continent'
  | 'create-region' | 'update-region' | 'delete-region'
  | 'create-location' | 'update-location' | 'delete-location'
  | 'create-faction' | 'update-faction' | 'delete-faction'
  | 'create-event' | 'update-event' | 'delete-event'
  | 'create-character' | 'update-character' | 'delete-character'
  | 'cascade-delete-continent' | 'cascade-delete-region' | 'batch';

interface HistoryEntry {
  id: string;
  timestamp: number;
  action: ActionType;
  description: string;          // 人类可读描述
  before: WorldSnapshot;        // 操作前状态
  after: WorldSnapshot;         // 操作后状态
}

interface WorldSnapshot {
  world: World | null;
  continents: Continent[];
  regions: Region[];
  locations: Location[];
  routes: Route[];
  eras: Era[];
  ages: Age[];
  events: WorldEvent[];
  factions: Faction[];
  characters: Character[];
}

class HistoryManager {
  push(entry): void;
  undo(): WorldSnapshot | null;
  redo(): WorldSnapshot | null;
  canUndo(): boolean;
  canRedo(): boolean;
  clear(): void;
  subscribe(listener: () => void): () => void;
  getUndoDescription(): string | null;
  getRedoDescription(): string | null;
  getHistory(): HistoryEntry[];
  getCurrentIndex(): number;
}

export const historyManager: HistoryManager;  // 单例
```

### 辅助函数

```typescript
// 创建当前状态的深拷贝快照
createSnapshot(state: WorldState): WorldSnapshot

// 从快照恢复状态
restoreSnapshot(snapshot: WorldSnapshot): Partial<WorldState>
```

---

## PluginManager.ts — 插件管理器

**文件**: `src/core/PluginManager.ts` (160 行)

插件注册、导出器/导入器/校验器管理。

```typescript
class PluginManager {
  // === 插件管理 ===
  setAPI(api: WorldForgeAPI): void;
  registerPlugin(manifest: PluginManifest): void;
  unregisterPlugin(pluginId: string): void;
  enablePlugin(pluginId: string): void;
  disablePlugin(pluginId: string): void;
  getPlugin(pluginId: string): PluginManifest | undefined;
  getAllPlugins(): PluginManifest[];
  getEnabledPlugins(): PluginManifest[];
  
  // === 导出器 ===
  registerExporter(format: string, exporter: ExporterPlugin): void;
  getExporter(format: string): ExporterPlugin | undefined;
  getAvailableExporters(): string[];
  export(format: string, data: unknown, options: ExportOptions): Promise<string>;
  
  // === 导入器 ===
  registerImporter(format: string, importer: ImporterPlugin): void;
  getImporter(format: string): ImporterPlugin | undefined;
  getAvailableImporters(): string[];
  import(format: string, data: string, options: ImportOptions): Promise<ImportResult>;
  
  // === 校验器 ===
  registerValidator(name: string, validator: ValidatorPlugin): void;
  getValidator(name: string): ValidatorPlugin | undefined;
  getAllValidators(): ValidatorPlugin[];
  runValidation(world: World, entities: Map<string, unknown[]>): Promise<ValidationIssue[]>;
  
  // === 事件代理 ===
  on(event: string, handler: (payload: WorldEventPayload) => void): void;
  off(event: string, handler: (payload: WorldEventPayload) => void): void;
  emit(event: string, payload: WorldEventPayload): void;
}

export const pluginManager: PluginManager;  // 单例
```

---

## Storage.ts — IndexedDB 持久化

**文件**: `src/core/Storage.ts` (55 行)

封装 IndexedDB 操作，使用 `idb` 库。

```typescript
const DB_NAME = 'worldforge';
const DB_VERSION = 1;

interface WorldData {
  world: World | null;
  continents: Continent[];
  regions: Region[];
  locations: Location[];
  routes: Route[];
  eras: Era[];
  ages: Age[];
  events: WorldEvent[];
  factions: Faction[];
  characters: Character[];
}

saveWorldData(data: WorldData): Promise<void>
loadWorldData(): Promise<WorldData | null>
clearWorldData(): Promise<void>
getStorageSize(): Promise<string>
```

**存储策略**: 单键值存储，整个世界数据作为一个对象保存到 `'kv'` store 的 `'worldData'` 键。

---

## WFFile.ts — WorldForge 文件格式

定义 `.wf.json` 文件格式用于结构化导入导出。

```typescript
const WF_FILE_VERSION = '1.0.0';
const WF_FILE_EXTENSION = '.wf.json';

interface WFFile {
  _format: 'worldforge';
  _version: string;
  _exportedAt: string;
  world: World;
  continents: Continent[];
  regions: Region[];
  locations: Location[];
  routes: Route[];
  eras: Era[];
  ages: Age[];
  events: WorldEvent[];
  factions: Faction[];
  characters: Character[];
}

interface WFValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  data?: WFFile;
}

exportToWFFile(data): WFFile
validateWFFile(data: unknown): WFValidationResult
importFromWFFile(file: WFFile): WorldData
downloadWFFile(data: WFFile, filename?: string): void
readWFFile(file: File): Promise<WFValidationResult>
```

---

## WorldForgeAPI.ts — 插件 API 实现

**文件**: `src/core/WorldForgeAPI.ts` (80 行)

暴露给插件的 API 层，连接 Store 和插件系统。

```typescript
class WorldForgeAPIImpl implements WorldForgeAPI {
  getWorld(): World | null;
  getEntity(type: string, id: ID): unknown | null;
  queryEntities(type: string, filter?: Record<string, unknown>): unknown[];
  
  on(event: string, handler: EventHandler): void;
  off(event: string, handler: EventHandler): void;
  
  registerExporter(format: string, exporter: ExporterPlugin): void;
  registerImporter(format: string, importer: ImporterPlugin): void;
  registerValidator(name: string, validator: ValidatorPlugin): void;
  
  export(format: string, options?: ExportOptions): Promise<string>;
  import(format: string, data: string, options?: ImportOptions): Promise<ImportResult>;
  
  // 内部方法：发射实体变更事件
  emitEntityEvent(
    type: 'entity:created' | 'entity:updated' | 'entity:deleted',
    entityType: string,
    entityId: string,
    data: unknown
  ): void;
}

export const worldForgeAPI: WorldForgeAPIImpl;  // 单例
```

---

## PolygonClip.ts — 多边形裁剪

**文件**: `src/core/PolygonClip.ts` (110 行)

基于 Sutherland-Hodgman 算法的多边形裁剪工具，确保区域多边形完全位于大陆边界内。

```typescript
// 将区域多边形裁剪到大陆边界内
clipPolygonToPolygon(
  subject: { x: number; y: number }[],  // 被裁剪多边形（区域）
  clip: { x: number; y: number }[]       // 裁剪边界（大陆）
): { x: number; y: number }[]

// 检查多边形是否完全在另一个多边形内
isPolygonInsidePolygon(
  inner: { x: number; y: number }[],
  outer: { x: number; y: number }[]
): boolean
```

**使用时机**: 创建区域时，如果区域超出大陆边界，自动裁剪。
