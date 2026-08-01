# 状态管理 (store/)

**文件**: `src/store/worldStore.ts` (490 行)

使用 Zustand 的全局状态管理，是应用的核心数据中枢。

---

## 状态结构

```typescript
interface WorldState {
  // === 实体数据 ===
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
  
  // === UI 状态 ===
  activeView: 'map' | 'timeline' | 'relations' | 'consistency' | 'plugins';
  selectedEntityType: string | null;
  selectedEntityId: ID | null;
  currentTimePoint: number | null;  // 时间线视图当前时间点
}
```

---

## CRUD 操作

### World

```typescript
createWorld(name: string, description?: string): World
updateWorld(updates: Partial<World>): void
```

### Continent

```typescript
createContinent(data: Omit<Continent, 'id' | 'createdAt' | 'worldId'>): Continent
updateContinent(id: ID, updates: Partial<Continent>): void
deleteContinent(id: ID): void
```

### Region

```typescript
createRegion(data: Omit<Region, 'id' | 'createdAt'>): Region
updateRegion(id: ID, updates: Partial<Region>): void
deleteRegion(id: ID): void
```

### Location

```typescript
createLocation(data: Omit<Location, 'id' | 'createdAt'>): Location
updateLocation(id: ID, updates: Partial<Location>): void
deleteLocation(id: ID): void
```

### Route

```typescript
createRoute(data: Omit<Route, 'id'>): Route
updateRoute(id: ID, updates: Partial<Route>): void
deleteRoute(id: ID): void
```

### Era

```typescript
createEra(data: Omit<Era, 'id' | 'worldId'>): Era
updateEra(id: ID, updates: Partial<Era>): void
deleteEra(id: ID): void
```

### Age

```typescript
createAge(data: Omit<Age, 'id'>): Age
updateAge(id: ID, updates: Partial<Age>): void
deleteAge(id: ID): void
```

### WorldEvent

```typescript
createEvent(data: Omit<WorldEvent, 'id' | 'createdAt' | 'worldId'>): WorldEvent
updateEvent(id: ID, updates: Partial<WorldEvent>): void
deleteEvent(id: ID): void
```

### Faction

```typescript
createFaction(data: Omit<Faction, 'id' | 'createdAt' | 'worldId'>): Faction
updateFaction(id: ID, updates: Partial<Faction>): void
deleteFaction(id: ID): void
```

### Character

```typescript
createCharacter(data: Omit<Character, 'id' | 'createdAt' | 'worldId'>): Character
updateCharacter(id: ID, updates: Partial<Character>): void
deleteCharacter(id: ID): void
```

---

## 级联删除

删除大陆时自动删除其下属区域和地点：

```typescript
cascadeDeleteContinent(id: ID): void
// 1. 查找 continentId === id 的所有区域
// 2. 删除这些区域
// 3. 删除 regionId 属于这些区域的所有地点
// 4. 删除大陆本身

cascadeDeleteRegion(id: ID): void
// 1. 删除区域
// 2. 删除 regionId === id 的所有地点
```

---

## 持久化

```typescript
saveToStorage(): void
// 将当前所有实体数据保存到 IndexedDB

loadFromStorage(): Promise<boolean>
// 从 IndexedDB 加载数据，返回是否成功
```

---

## 撤销/重做

```typescript
undo(): void    // 撤销上一步
redo(): void    // 重做
canUndo(): boolean
canRedo(): boolean
getUndoDescription(): string | null
getRedoDescription(): string | null

_pushHistory(action: ActionType, description: string, before: WorldSnapshot): void
// 内部方法：记录历史（在每次 CRUD 操作中自动调用）
```

---

## UI 操作

```typescript
setActiveView(view: WorldState['activeView']): void
selectEntity(entityType: string | null, entityId: ID | null): void
setCurrentTimePoint(time: number | null): void
getEntityById(type: string, id: ID): unknown | null
```

---

## 数据流

```
用户操作 → Store 方法调用:
  1. createSnapshot(get()) → 保存 before 状态
  2. set() → 更新状态
  3. _pushHistory() → 记录到 HistoryManager
  4. worldForgeAPI.emitEntityEvent() → 触发插件事件
```
