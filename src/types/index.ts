// ============================================
// WorldForge 类型定义
// ============================================

// === 基础类型 ===
export type ID = string;
export type DateTime = string; // ISO 8601

// === 空间系统 ===

export interface World {
  id: ID;
  name: string;
  description: string;
  scale: {
    unit: string;
    pixelsPerUnit: number;
  };
  createdAt: DateTime;
  updatedAt: DateTime;
}

export type TerrainType = 'plains' | 'mountains' | 'forest' | 'desert' | 'ocean' | 'swamp' | 'tundra' | 'hills' | 'jungle' | 'wasteland' | 'basin' | 'plateau' | 'valley' | 'canyon' | 'coast' | 'volcano' | 'glacier' | 'oasis';

export interface Continent {
  id: ID;
  worldId: ID;
  name: string;
  description: string;
  bounds: {
    points: { x: number; y: number }[];
  };
  climate?: string;
  createdAt: DateTime;
}

export interface Region {
  id: ID;
  continentId: ID;
  name: string;
  description: string;
  bounds: {
    points: { x: number; y: number }[];
  };
  terrain: TerrainType;
  climate?: string;
  resources: string[];
  createdAt: DateTime;
}

export type LocationType = 'city' | 'town' | 'village' | 'fortress' | 'ruins' | 'landmark' | 'port' | 'temple' | 'dungeon' | 'capital' | 'other';

export interface Location {
  id: ID;
  regionId: ID;
  name: string;
  aliases: string[];
  type: LocationType;
  position: { x: number; y: number };
  population?: number;
  description: string;
  controlledBy?: ID;
  notableSites: string[];
  resources: string[];
  createdAt: DateTime;
}

export type RouteType = 'road' | 'path' | 'sea_route' | 'air_route' | 'river';

export interface Route {
  id: ID;
  name: string;
  type: RouteType;
  from: ID;
  to: ID;
  waypoints: { x: number; y: number }[];
  distance: number;
  travelTime: {
    walking: number;
    horse: number;
    ship: number;
  };
  terrainDifficulty: number;
}

// === 时间系统 ===

export interface Era {
  id: ID;
  worldId: ID;
  name: string;
  order: number;
  startYear: number;
  endYear?: number;
  description: string;
}

export interface Age {
  id: ID;
  eraId: ID;
  name: string;
  order: number;
  startYear: number;
  endYear?: number;
  description: string;
}

export type EventType = 'war' | 'disaster' | 'discovery' | 'founding' | 'death' | 'birth' | 'treaty' | 'revolution' | 'migration' | 'cataclysm' | 'other';

export interface TimelineDate {
  eraId?: ID;
  ageId?: ID;
  year: number;
  month?: number;
  day?: number;
  displayString: string;
}

export interface WorldEvent {
  id: ID;
  worldId: ID;
  name: string;
  type: EventType;
  ageId: ID;
  startDate: TimelineDate;
  endDate?: TimelineDate;
  description: string;
  locationId?: ID;
  participants: ID[];
  causes: ID[];
  effects: ID[];
  createdAt: DateTime;
}

// === 社会系统 ===

export type FactionType = 'nation' | 'empire' | 'kingdom' | 'tribe' | 'guild' | 'religion' | 'order' | 'syndicate' | 'rebellion' | 'other';

export interface Faction {
  id: ID;
  worldId: ID;
  name: string;
  type: FactionType;
  ideology?: string;
  foundedAt?: ID;
  dissolvedAt?: ID;
  controlledRegions: ID[];
  militaryStrength?: number;
  economyLevel: number;
  religion?: string;
  description: string;
  color?: string;
  createdAt: DateTime;
}

export interface FactionControl {
  id: ID;
  factionId: ID;
  regionId: ID;
  startedAt: ID;
  endedAt?: ID;
  controlType: 'full' | 'partial' | 'occupied';
}

export type RelationType = 'parent' | 'child' | 'sibling' | 'spouse' | 'mentor' | 'student' | 'ally' | 'enemy' | 'rival' | 'friend' | 'other';

export interface Character {
  id: ID;
  worldId: ID;
  name: string;
  titles: string[];
  bornAt?: TimelineDate;
  diedAt?: TimelineDate;
  birthplace?: ID;
  factionId?: ID;
  description: string;
  relationships: {
    targetId: ID;
    type: RelationType;
  }[];
  events: ID[];
  createdAt: DateTime;
}

// === 插件系统 ===

export type PluginType = 'event-listener' | 'data-exporter' | 'data-importer' | 'validator' | 'sync-adapter';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  type: PluginType;
  description?: string;
  permissions: string[];
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface EventHandler {
  (event: WorldEventPayload): void;
}

export interface WorldEventPayload {
  type: 'entity:created' | 'entity:updated' | 'entity:deleted';
  entityType: string;
  entityId: ID;
  data: unknown;
  timestamp: DateTime;
}

export interface WorldForgeAPI {
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
}

export interface ExporterPlugin {
  format: string;
  fileExtension: string;
  export(data: unknown, options: ExportOptions): Promise<string>;
}

export interface ImporterPlugin {
  format: string;
  fileExtension: string;
  import(data: string, options: ImportOptions): Promise<ImportResult>;
}

export interface ValidatorPlugin {
  name: string;
  validate(world: World, entities: Map<string, unknown[]>): ValidationIssue[];
}

export interface ExportOptions {
  includeTypes?: string[];
  excludeTypes?: string[];
  format?: 'pretty' | 'compact';
  template?: string;
}

export interface ImportOptions {
  mergeStrategy?: 'replace' | 'merge' | 'skip';
  validateBeforeImport?: boolean;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  warnings: string[];
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  entityType?: string;
  entityId?: ID;
  ruleName?: string;
}

// === 实体类型联合 ===

export type EntityType = 'world' | 'continent' | 'region' | 'location' | 'route' | 'era' | 'age' | 'event' | 'faction' | 'character';

export type Entity = World | Continent | Region | Location | Route | Era | Age | WorldEvent | Faction | Character;
