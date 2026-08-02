# 类型系统 (types/)

**文件**: `src/types/index.ts` (273 行)

定义整个应用的所有 TypeScript 接口和类型，是类型安全的基石。

---

## 基础类型

```typescript
export type ID = string;
export type DateTime = string; // ISO 8601 格式
```

---

## 空间系统 (Geography)

### World — 世界

```typescript
interface World {
  id: ID;
  name: string;           // 世界名称
  description: string;    // 世界描述
  scale: {
    unit: string;         // 距离单位（如"公里"）
    pixelsPerUnit: number; // 每单位像素数
  };
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### Continent — 大陆

```typescript
interface Continent {
  id: ID;
  worldId: ID;            // 所属世界
  name: string;
  description: string;
  bounds: {
    points: { x: number; y: number }[];  // 多边形顶点
  };
  climate?: string;       // 气候类型
  createdAt: DateTime;
}
```

### Region — 区域/国家

```typescript
interface Region {
  id: ID;
  continentId: ID;        // 所属大陆（核心关联）
  name: string;
  description: string;
  bounds: {
    points: { x: number; y: number }[];  // 多边形顶点
  };
  terrain: TerrainType;   // 地形类型
  climate?: string;
  resources: string[];    // 特产资源
  createdAt: DateTime;
}
```

### Location — 地点

```typescript
interface Location {
  id: ID;
  regionId: ID;           // 所属区域
  name: string;
  aliases: string[];      // 别名/多语言名
  type: LocationType;     // 城市、村庄、要塞等
  position: { x: number; y: number };
  population?: number;    // 人口
  description: string;
  controlledBy?: ID;      // 控制方（势力ID）
  notableSites: string[]; // 重要地标
  resources: string[];
  createdAt: DateTime;
}
```

### Route — 路线

```typescript
interface Route {
  id: ID;
  name: string;
  type: RouteType;         // 道路、航线、河流等
  from: ID;               // 起点地点
  to: ID;                 // 终点地点
  waypoints: { x: number; y: number }[];  // 途经点
  distance: number;
  travelTime: { walking: number; horse: number; ship: number; };
  terrainDifficulty: number;  // 地形难度 1-5
}
```

### 枚举类型

```typescript
type TerrainType = 'plains' | 'mountains' | 'forest' | 'desert' | 'ocean' 
                 | 'swamp' | 'tundra' | 'hills' | 'jungle' | 'wasteland'
                 | 'basin' | 'plateau' | 'valley' | 'canyon' | 'coast'
                 | 'volcano' | 'glacier' | 'oasis';

type LocationType = 'city' | 'town' | 'village' | 'fortress' | 'ruins' 
                  | 'landmark' | 'port' | 'temple' | 'dungeon' | 'capital' | 'other';

type RouteType = 'road' | 'path' | 'sea_route' | 'air_route' | 'river';
```

---

## 时间系统 (Chronology)

### Era — 纪元

```typescript
interface Era {
  id: ID;
  worldId: ID;
  name: string;           // 如"第一纪元"
  order: number;          // 排序
  startYear: number;
  endYear?: number;
  description: string;
}
```

### Age — 时代

```typescript
interface Age {
  id: ID;
  eraId: ID;              // 所属纪元
  name: string;           // 如"星火时代"
  order: number;
  startYear: number;
  endYear?: number;
  description: string;
}
```

### WorldEvent — 事件

```typescript
interface WorldEvent {
  id: ID;
  worldId: ID;
  name: string;
  type: EventType;
  ageId: ID;              // 所属时代
  startDate: TimelineDate;
  endDate?: TimelineDate;
  description: string;
  locationId?: ID;        // 发生地点
  participants: ID[];     // 参与方
  causes: ID[];           // 原因事件（因果链）
  effects: ID[];          // 结果事件
  createdAt: DateTime;
}
```

### TimelineDate — 时间线日期

```typescript
interface TimelineDate {
  eraId?: ID;
  ageId?: ID;
  year: number;
  month?: number;
  day?: number;
  displayString: string;  // 人类可读格式，如"第三纪元 342年"
}
```

### 枚举类型

```typescript
type EventType = 'war' | 'disaster' | 'discovery' | 'founding' | 'death' 
              | 'birth' | 'treaty' | 'revolution' | 'migration' | 'cataclysm' | 'other';
```

---

## 社会系统 (Society)

### Faction — 势力

```typescript
interface Faction {
  id: ID;
  worldId: ID;
  name: string;
  type: FactionType;
  ideology?: string;       // 意识形态
  foundedAt?: ID;          // 成立事件
  dissolvedAt?: ID;        // 解散事件
  controlledRegions: ID[]; // 控制区域
  militaryStrength?: number;
  economyLevel: number;    // 经济水平 1-10
  religion?: string;
  description: string;
  color?: string;          // 地图显示颜色
  createdAt: DateTime;
}
```

### Character — 人物

```typescript
interface Character {
  id: ID;
  worldId: ID;
  name: string;
  titles: string[];        // 称号
  bornAt?: TimelineDate;
  diedAt?: TimelineDate;
  birthplace?: ID;         // 出生地
  factionId?: ID;          // 所属势力
  description: string;
  relationships: {
    targetId: ID;
    type: RelationType;
  }[];
  events: ID[];            // 参与事件
  createdAt: DateTime;
}
```

### 关联表

```typescript
// 势力对区域的控制关系（随时间变化）
interface FactionControl {
  id: ID;
  factionId: ID;
  regionId: ID;
  startedAt: ID;           // 开始事件
  endedAt?: ID;            // 结束事件
  controlType: 'full' | 'partial' | 'occupied';
}
```

### 枚举类型

```typescript
type FactionType = 'nation' | 'empire' | 'kingdom' | 'tribe' | 'guild' 
                | 'religion' | 'order' | 'syndicate' | 'rebellion' | 'other';

type RelationType = 'parent' | 'child' | 'sibling' | 'spouse' | 'mentor' 
                  | 'student' | 'ally' | 'enemy' | 'rival' | 'friend' | 'other';
```

---

## 插件系统 (Plugin System)

### 插件清单

```typescript
interface PluginManifest {
  id: string;              // 唯一标识
  name: string;            // 显示名称
  version: string;         // 版本号
  type: PluginType;
  description?: string;
  permissions: string[];   // 所需权限
  config: Record<string, unknown>;  // 配置项
  enabled: boolean;        // 是否启用
}
```

### 事件系统类型

```typescript
type PluginType = 'event-listener' | 'data-exporter' | 'data-importer' 
               | 'validator' | 'sync-adapter';

interface WorldEventPayload {
  type: 'entity:created' | 'entity:updated' | 'entity:deleted';
  entityType: string;
  entityId: ID;
  data: unknown;
  timestamp: DateTime;
}

type EventHandler = (payload: WorldEventPayload) => void;
```

### 插件接口

```typescript
// 导出器
interface ExporterPlugin {
  format: string;
  fileExtension: string;
  export(data: unknown, options: ExportOptions): Promise<string>;
}

// 导入器
interface ImporterPlugin {
  format: string;
  fileExtension: string;
  import(data: string, options: ImportOptions): Promise<ImportResult>;
}

// 校验器
interface ValidatorPlugin {
  name: string;
  validate(world: World, entities: Map<string, unknown[]>): ValidationIssue[];
}
```

### WorldForge API（暴露给插件）

```typescript
interface WorldForgeAPI {
  getWorld(): World | null;
  getEntity(type: string, id: ID): unknown | null;
  queryEntities(type: string, filter?: Record<string, unknown>): unknown[];
  
  // 事件订阅
  on(event: string, handler: EventHandler): void;
  off(event: string, handler: EventHandler): void;
  
  // 注册插件功能
  registerExporter(format: string, exporter: ExporterPlugin): void;
  registerImporter(format: string, importer: ImporterPlugin): void;
  registerValidator(name: string, validator: ValidatorPlugin): void;
  
  // 数据操作
  export(format: string, options?: ExportOptions): Promise<string>;
  import(format: string, data: string, options?: ImportOptions): Promise<ImportResult>;
}
```

### 辅助类型

```typescript
interface ExportOptions {
  includeTypes?: string[];    // 包含的实体类型
  excludeTypes?: string[];    // 排除的实体类型
  format?: 'pretty' | 'compact';
  template?: string;          // 导出模板
}

interface ImportOptions {
  mergeStrategy?: 'replace' | 'merge' | 'skip';
  validateBeforeImport?: boolean;
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  warnings: string[];
}

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  entityType?: string;
  entityId?: ID;
  ruleName?: string;
}
```

---

## 实体类型联合

```typescript
type EntityType = 'world' | 'continent' | 'region' | 'location' 
                | 'route' | 'era' | 'age' | 'event' | 'faction' | 'character';

type Entity = World | Continent | Region | Location | Route 
            | Era | Age | WorldEvent | Faction | Character;
```
