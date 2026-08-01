# WorldForge 模块架构文档

---

## 目录

1. [概述](#概述)
2. [类型系统 (types/)](#类型系统-types)
3. [核心层 (core/)](#核心层-core)
4. [状态管理 (store/)](#状态管理-store)
5. [插件系统 (plugins/)](#插件系统-plugins)
6. [React Hooks (hooks/)](#react-hooks-hooks)
7. [工具函数 (utils/)](#工具函数-utils)
8. [UI 组件 (components/)](#ui-组件-components)
9. [应用入口 (App)](#应用入口-app)
10. [数据流](#数据流)

---

## 概述

WorldForge 是一个基于 **React + TypeScript + Canvas** 的世界观构建工具。采用**本地优先**架构，所有数据存储在浏览器 IndexedDB 中。

### 技术栈

| 层级 | 技术 | 用途 |
|---|---|---|
| 框架 | React 18 + TypeScript | UI 渲染与类型安全 |
| 状态管理 | Zustand | 全局状态管理 |
| 持久化 | IndexedDB (idb 库) | 本地数据存储 |
| 构建 | Vite 6 | 开发与构建 |
| 渲染 | HTML5 Canvas | 地图绘制 |

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                      UI Layer                           │
│  ┌─────────┐ ┌──────────┐ ┌────────────┐               │
│  │ Navbar  │ │ Sidebar  │ │ Properties │               │
│  └─────────┘ └──────────┘ └────────────┘               │
│  ┌──────────────────────────────────────┐               │
│  │         View (Map/Timeline/...)      │               │
│  └──────────────────────────────────────┘               │
├─────────────────────────────────────────────────────────┤
│                    Hooks Layer                          │
│  ┌──────────────────┐ ┌───────────────────────┐        │
│  │  useUndoRedo     │ │  React Zustand Hooks  │        │
│  └──────────────────┘ └───────────────────────┘        │
├─────────────────────────────────────────────────────────┤
│                    Store Layer                          │
│  ┌────────────────────────────────────────────┐        │
│  │           useWorldStore (Zustand)          │        │
│  │  - 所有实体 CRUD                            │        │
│  │  - 历史记录追踪                            │        │
│  │  - 持久化触发                              │        │
│  └────────────────────────────────────────────┘        │
├─────────────────────────────────────────────────────────┤
│                    Core Layer                           │
│  ┌────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐  │
│  │ Event  │ │ History  │ │ Plugin    │ │ Storage  │  │
│  │ Bus    │ │ Manager  │ │ Manager   │ │ (IndexedDB)│ │
│  └────────┘ └──────────┘ └───────────┘ └──────────┘  │
│  ┌──────────────────┐ ┌──────────────────────┐        │
│  │  WorldForgeAPI   │ │  WFFile (导入导出)    │        │
│  └──────────────────┘ └──────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

---

## 类型系统 (types/)

**文件**: `src/types/index.ts` (273 行)

定义整个应用的所有 TypeScript 接口和类型。

### 核心实体类型

| 类型 | 说明 | 关键字段 |
|---|---|---|
| `World` | 世界 | id, name, scale |
| `Continent` | 大陆 | worldId, bounds (多边形顶点数组) |
| `Region` | 区域/国家 | continentId, terrain, bounds |
| `Location` | 地点 | regionId, position, type |
| `Era` | 纪元 | worldId, startYear, endYear |
| `Age` | 时代 | eraId, startYear, endYear |
| `WorldEvent` | 事件 | ageId, startDate, participants |
| `Faction` | 势力 | worldId, type, controlledRegions |
| `Character` | 人物 | worldId, factionId, relationships |

### 空间数据类型

```typescript
// 多边形边界
bounds: { points: { x: number; y: number }[] }

// 地点坐标
position: { x: number; y: number }

// 地形类型枚举
TerrainType = 'plains' | 'mountains' | 'forest' | 'desert' | ...
```

### 插件系统类型

```typescript
PluginType = 'event-listener' | 'data-exporter' | 'data-importer' | 'validator' | 'sync-adapter'

interface PluginManifest {
  id: string; name: string; version: string;
  type: PluginType; permissions: string[]; config: Record<string, unknown>;
}
```

---

## 核心层 (core/)

### EventBus.ts — 事件总线

**文件**: `src/core/EventBus.ts` (45 行)

发布-订阅模式，用于插件系统的事件通信。

```typescript
class EventBus {
  on(event: EventName, handler: EventHandler): void
  off(event: EventName, handler: EventHandler): void
  emit(event: EventName, payload: WorldEventPayload): void
}
```

**事件类型**:
- `entity:created` — 实体创建
- `entity:updated` — 实体更新
- `entity:deleted` — 实体删除

**单例导出**: `eventBus`

---

### History.ts — 撤销/重做管理器

**文件**: `src/core/History.ts` (140 行)

基于快照的历史记录管理，支持最多 50 步撤销。

```typescript
interface HistoryEntry {
  action: ActionType;           // 操作类型
  description: string;          // 人类可读描述
  before: WorldSnapshot;        // 操作前状态
  after: WorldSnapshot;         // 操作后状态
}

class HistoryManager {
  push(entry): void
  undo(): WorldSnapshot | null
  redo(): WorldSnapshot | null
  canUndo(): boolean
  canRedo(): boolean
  subscribe(listener): () => void  // 订阅变化
}
```

**ActionType 枚举**: create/update/delete 每种实体类型 + cascade-delete + batch

**辅助函数**:
- `createSnapshot(state)` — 深拷贝当前状态
- `restoreSnapshot(snapshot)` — 从快照恢复

---

### PluginManager.ts — 插件管理器

**文件**: `src/core/PluginManager.ts` (160 行)

插件注册、导出器/导入器/校验器管理。

```typescript
class PluginManager {
  // 插件注册
  registerPlugin(manifest: PluginManifest): void
  enablePlugin(id) / disablePlugin(id)
  
  // 导出器
  registerExporter(format, exporter): void
  export(format, data, options): Promise<string>
  
  // 导入器
  registerImporter(format, importer): void
  import(format, data, options): Promise<ImportResult>
  
  // 校验器
  registerValidator(name, validator): void
  runValidation(world, entities): Promise<ValidationIssue[]>
}
```

**内置插件**:
- Markdown 导出器（含 Obsidian 双向链接语法）
- JSON 导出器/导入器
- Obsidian 同步适配器（框架级）

---

### Storage.ts — IndexedDB 持久化

**文件**: `src/core/Storage.ts` (55 行)

封装 IndexedDB 操作，使用 `idb` 库。

```typescript
const DB_NAME = 'worldforge';
const DB_VERSION = 1;

// 单键值存储，整个世界数据作为一个对象保存
saveWorldData(data: WorldData): Promise<void>
loadWorldData(): Promise<WorldData | null>
clearWorldData(): Promise<void>
```

---

### WFFile.ts — WorldForge 文件格式

**文件**: `src/core/WFFile.ts` (130 行)

定义 `.wf.json` 文件格式用于导入导出。

```typescript
interface WFFile {
  _format: 'worldforge';
  _version: '1.0.0';
  _exportedAt: string;
  world: World;
  continents: Continent[];
  regions: Region[];
  // ... 所有实体数组
}

// 文件验证（检查格式、版本兼容性）
validateWFFile(data: unknown): WFValidationResult

// 下载文件
downloadWFFile(data: WFFile, filename?): void

// 读取文件
readWFFile(file: File): Promise<WFValidationResult>
```

---

### WorldForgeAPI.ts — 插件 API 实现

**文件**: `src/core/WorldForgeAPI.ts` (80 行)

暴露给插件的 API 层，连接 Store 和插件系统。

```typescript
class WorldForgeAPIImpl implements WorldForgeAPI {
  getWorld(): World | null
  getEntity(type, id): unknown | null
  queryEntities(type, filter?): unknown[]
  on(event, handler): void     // 订阅事件
  off(event, handler): void
  registerExporter(format, exporter): void
  registerImporter(format, importer): void
  registerValidator(name, validator): void
  export(format, options?): Promise<string>
  import(format, data, options?): Promise<ImportResult>
  emitEntityEvent(type, entityType, entityId, data): void
}
```

---

## 状态管理 (store/)

**文件**: `src/store/worldStore.ts` (490 行)

使用 Zustand 的全局状态管理，是应用的核心数据中枢。

### 状态结构

```typescript
interface WorldState {
  // 实体数据
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
  
  // UI 状态
  activeView: 'map' | 'timeline' | 'relations' | 'consistency' | 'plugins';
  selectedEntityType: string | null;
  selectedEntityId: ID | null;
  currentTimePoint: number | null;
}
```

### CRUD 操作

每个实体类型都有完整的 CRUD 方法，并自动触发：

1. **历史记录** — 每次修改前调用 `_pushHistory()` 记录快照
2. **插件事件** — 操作后调用 `worldForgeAPI.emitEntityEvent()`
3. **持久化** — Store 变化时 App 层触发 `saveToStorage()`

```typescript
// 示例：创建大陆
createContinent(data) {
  const before = createSnapshot(get());
  // ... 创建逻辑 ...
  get()._pushHistory('create-continent', `创建大陆"${name}"`, before);
  worldForgeAPI.emitEntityEvent('entity:created', 'continent', id, data);
}

// 级联删除：删除大陆 → 删除下属区域和地点
cascadeDeleteContinent(id) {
  const regionIds = regions.filter(r => r.continentId === id).map(r => r.id);
  set(state => ({
    continents: state.continents.filter(c => c.id !== id),
    regions: state.regions.filter(r => r.continentId !== id),
    locations: state.locations.filter(l => !regionIds.includes(l.regionId)),
  }));
}
```

### 撤销/重做

```typescript
undo() / redo()              // 从 HistoryManager 恢复快照
canUndo() / canRedo()        // 查询是否可撤销/重做
_pushHistory(action, desc, before)  // 内部使用，记录历史
```

---

## 插件系统 (plugins/)

**文件**: `src/plugins/index.ts` (注册中心)

### 内置插件

| 文件 | 类型 | 功能 |
|---|---|---|
| `MarkdownExporter.ts` | data-exporter | 导出 Markdown，支持 Obsidian `[[链接]]` |
| `JsonExporter.ts` | data-exporter + data-importer | JSON 格式导入导出 |
| `ObsidianSync.ts` | sync-adapter | Obsidian 双向同步框架 |

### 插件注册

```typescript
// src/plugins/index.ts
export function registerBuiltInPlugins() {
  pluginManager.registerExporter('markdown', markdownExporter);
  pluginManager.registerExporter('json', jsonExporter);
  pluginManager.registerImporter('json', jsonImporter);
  pluginManager.registerPlugin(obsidianSyncAdapter);
  
  // 监听事件驱动同步
  pluginManager.on('entity:created', obsidianHandler);
  pluginManager.on('entity:updated', obsidianHandler);
  pluginManager.on('entity:deleted', obsidianHandler);
}
```

---

## React Hooks (hooks/)

### useUndoRedo.ts

**文件**: `src/hooks/useUndoRedo.ts` (80 行)

全局撤销/重做快捷键绑定。

```typescript
export function useUndoRedo() {
  // 订阅 HistoryManager 变化
  // 绑定键盘事件:
  //   Ctrl+Z → undo()
  //   Ctrl+Shift+Z / Ctrl+Y → redo()
  // 显示 Toast 提示
  
  return {
    canUndo, canRedo,
    undoDescription, redoDescription,
    toast  // 当前操作提示
  };
}
```

**使用位置**: `App.tsx`

---

## 工具函数 (utils/)

### id.ts — ID 生成

```typescript
generateId(): string      // UUID v4
generateShortId(): string // 短 ID（用于显示）
```

### download.ts — 文件下载

```typescript
downloadFile(content, filename, mimeType): void
downloadJSON(data, filename): void
downloadMarkdown(content, filename): void
```

通过创建 Blob URL 并模拟点击下载。

---

## UI 组件 (components/)

### App.tsx — 应用入口

```typescript
function App() {
  // 1. 启动时从 IndexedDB 加载数据
  // 2. 注册内置插件
  // 3. 数据变化时自动保存（防抖 500ms）
  // 4. 渲染主布局 + Toast
}
```

**布局结构**:
```
┌─────────────────────────────────────────────┐
│                  Navbar                     │
├──────────┬──────────────────────┬───────────┤
│ Sidebar  │     Main Canvas      │ Properties│
│          │  (Map/Timeline/...)  │   Panel   │
└──────────┴──────────────────────┴───────────┘
```

### MapView.tsx — 地图视图（核心）

**文件**: `src/components/MapView.tsx` (770+ 行)

最复杂的组件，负责 Canvas 渲染和交互。

#### 状态

```typescript
viewport: { x, y, zoom }     // 视口变换
tool: ToolMode               // 当前工具
drawing: DrawingState | null // 当前绘制状态
polygonEdit: PolygonEditState | null // 编辑状态
canvasBgColor: string        // 背景色
zoomSpeed: number            // 缩放速度
```

#### 工具模式

| 工具 | 说明 |
|---|---|
| `select` | 选择实体 |
| `pan` | 平移画布 |
| `draw-continent` | 绘制大陆 |
| `draw-region` | 绘制区域（自动检测所属大陆） |
| `add-location` | 添加地点 |
| `edit-polygon` | 编辑多边形顶点 |

#### 绘制流程

```
1. 用户选择工具
2. 点击画布 → 添加顶点（屏幕坐标转世界坐标）
3. 双击/点击起点 → 闭合多边形
4. 弹出对话框 → 输入名称等属性
5. 调用 Store 创建实体
```

#### Canvas 渲染管线

```
draw():
  1. 设置 canvas 尺寸 (CSS × DPR)
  2. reset transform → clearRect (清除整个缓冲区)
  3. 应用视口变换 (translate + scale)
  4. 绘制背景色
  5. 绘制网格
  6. 绘制大陆（目标大陆高亮，非目标大陆变暗）
  7. 绘制区域（同大陆区域高亮）
  8. 绘制地点
  9. 绘制绘制中的多边形预览
  10. ctx.restore()
```

#### 坐标转换

```typescript
screenToWorld(screenX, screenY) → { x, y }
// world = (screen - viewportOffset) / zoom

worldToScreen(worldX, worldY) → { x, y }
// screen = world * zoom + viewportOffset
```

---

### Sidebar.tsx — 侧边栏

实体树形列表，支持快速创建和选择。

```typescript
// 按类型分组显示
- 大陆 (continents)
- 区域 (regions)  
- 地点 (locations)
- 势力 (factions)
- 事件 (events)
- 人物 (characters)
```

---

### PropertiesPanel.tsx — 属性面板

根据选中实体类型渲染不同表单。

**支持的编辑**:
- 名称、描述
- 地形选择（区域）
- 类型选择
- 别名、资源标签
- 删除按钮（带确认和级联删除）

---

### 其他视图组件

| 组件 | 功能 |
|---|---|
| `TimelineView` | 时间线视图，事件按年份排列 |
| `RelationsView` | 关系图谱（当前为简化版，显示节点和文本） |
| `ConsistencyView` | 一致性检查，显示问题列表 |
| `PluginsView` | 插件管理 + 数据导出/导入 UI |
| `Navbar` | 顶部导航，切换视图 |
| `WelcomeScreen` | 创建/恢复世界入口 |

---

## 应用入口 (App)

### main.tsx

```typescript
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### App.css

全局样式，使用 CSS 变量定义主题色：

```css
:root {
  --color-bg-primary: #1a1a2e;    /* 主背景 */
  --color-bg-secondary: #16213e;  /* 次级背景 */
  --color-bg-tertiary: #0f3460;   /* 三级背景 */
  --color-accent: #e94560;        /* 强调色 */
  --color-border: #2d2d44;        /* 边框 */
}
```

---

## 数据流

### 用户操作 → 数据更新

```
用户点击/绘制
    ↓
MapView.handleMouseDown / handleMouseMove
    ↓
screenToWorld() 坐标转换
    ↓
调用 Store 方法 (createContinent/updateRegion/...)
    ↓
Store 内部:
  1. createSnapshot() → 保存 before 状态
  2. set() → 更新状态
  3. _pushHistory() → 记录到 HistoryManager
  4. emitEntityEvent() → 触发插件事件
    ↓
App 层 useEffect 检测到状态变化
    ↓
防抖 500ms → saveToStorage() → IndexedDB
```

### 撤销/重做流

```
Ctrl+Z → useUndoRedo hook
    ↓
historyManager.undo()
    ↓
返回 before 快照
    ↓
Store.setState(restoreSnapshot(before))
    ↓
触发重绘
```

### 文件导入导出

```
导出:
  PluginsView → worldForgeAPI.export('json')
    ↓
  WFFile.exportToWFFile() → 构建 WFFile 对象
    ↓
  downloadWFFile() → Blob → 下载

导入:
  文件选择 → readWFFile() → validateWFFile()
    ↓
  确认覆盖 → Store.setState(数据)
    ↓
  saveToStorage() → IndexedDB
```

---

## 扩展指南

### 添加新实体类型

1. **types/index.ts** — 定义接口
2. **worldStore.ts** — 添加状态和 CRUD 方法
3. **Sidebar.tsx** — 添加列表分组
4. **PropertiesPanel.tsx** — 添加编辑表单
5. **History.ts** — 添加 ActionType

### 添加新插件

```typescript
// 1. 实现插件接口
const myExporter: ExporterPlugin = {
  format: 'myformat',
  fileExtension: '.mf',
  export: async (data, options) => { /* ... */ }
};

// 2. 注册
pluginManager.registerExporter('myformat', myExporter);
```

### 添加工具模式

1. `ToolMode` 类型添加新值
2. `MapView` 添加 `handleMouseDown` 分支
3. `getCursor()` 返回对应光标样式
4. 工具栏添加按钮

---

*文档最后更新: 2026-08-01*
*代码版本: WorldForge v0.1.0*
