// ============================================
// 撤销/重做历史管理器
// ============================================

import type {
  World,
  Continent,
  Region,
  Location,
  Route,
  Era,
  Age,
  WorldEvent,
  Faction,
  Character,
} from '../types';

const MAX_HISTORY = 50;

// 可撤销的操作类型
export type ActionType =
  | 'create-world'
  | 'update-world'
  | 'delete-world'
  | 'create-continent'
  | 'update-continent'
  | 'delete-continent'
  | 'create-region'
  | 'update-region'
  | 'delete-region'
  | 'create-location'
  | 'update-location'
  | 'delete-location'
  | 'create-faction'
  | 'update-faction'
  | 'delete-faction'
  | 'create-event'
  | 'update-event'
  | 'delete-event'
  | 'create-character'
  | 'update-character'
  | 'delete-character'
  | 'cascade-delete-continent'
  | 'cascade-delete-region'
  | 'batch'; // 批量操作

// 历史记录条目
export interface HistoryEntry {
  id: string;
  timestamp: number;
  action: ActionType;
  description: string;
  // 操作前的状态（用于撤销）
  before: WorldSnapshot;
  // 操作后的状态（用于重做）
  after: WorldSnapshot;
}

// 世界状态快照
export interface WorldSnapshot {
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
  private entries: HistoryEntry[] = [];
  private currentIndex: number = -1;
  private listeners: Set<() => void> = new Set();

  // 添加历史记录
  push(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void {
    // 如果当前不在最新位置，删除后面的历史
    if (this.currentIndex < this.entries.length - 1) {
      this.entries = this.entries.slice(0, this.currentIndex + 1);
    }

    const fullEntry: HistoryEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: Date.now(),
    };

    this.entries.push(fullEntry);
    this.currentIndex = this.entries.length - 1;

    // 限制历史记录数量
    if (this.entries.length > MAX_HISTORY) {
      this.entries = this.entries.slice(-MAX_HISTORY);
      this.currentIndex = this.entries.length - 1;
    }

    this.notifyListeners();
  }

  // 撤销
  undo(): WorldSnapshot | null {
    if (!this.canUndo()) return null;
    const entry = this.entries[this.currentIndex];
    this.currentIndex--;
    this.notifyListeners();
    return entry.before;
  }

  // 重做
  redo(): WorldSnapshot | null {
    if (!this.canRedo()) return null;
    this.currentIndex++;
    const entry = this.entries[this.currentIndex];
    this.notifyListeners();
    return entry.after;
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.entries.length - 1;
  }

  getUndoDescription(): string | null {
    if (!this.canUndo()) return null;
    return this.entries[this.currentIndex].description;
  }

  getRedoDescription(): string | null {
    if (!this.canRedo()) return null;
    return this.entries[this.currentIndex + 1].description;
  }

  getHistory(): HistoryEntry[] {
    return [...this.entries];
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  clear(): void {
    this.entries = [];
    this.currentIndex = -1;
    this.notifyListeners();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l());
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 10);
  }
}

// Singleton
export const historyManager = new HistoryManager();

// 创建当前状态的快照
export function createSnapshot(state: {
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
}): WorldSnapshot {
  return {
    world: state.world ? { ...state.world } : null,
    continents: state.continents.map(c => ({ ...c, bounds: { points: c.bounds.points.map(p => ({ ...p })) } })),
    regions: state.regions.map(r => ({ ...r, bounds: { points: r.bounds.points.map(p => ({ ...p })) } })),
    locations: state.locations.map(l => ({ ...l, position: { ...l.position } })),
    routes: state.routes.map(r => ({ ...r })),
    eras: state.eras.map(e => ({ ...e })),
    ages: state.ages.map(a => ({ ...a })),
    events: state.events.map(e => ({ ...e })),
    factions: state.factions.map(f => ({ ...f })),
    characters: state.characters.map(c => ({ ...c })),
  };
}

// 从快照恢复状态
export function restoreSnapshot(snapshot: WorldSnapshot): {
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
} {
  return {
    world: snapshot.world,
    continents: snapshot.continents,
    regions: snapshot.regions,
    locations: snapshot.locations,
    routes: snapshot.routes,
    eras: snapshot.eras,
    ages: snapshot.ages,
    events: snapshot.events,
    factions: snapshot.factions,
    characters: snapshot.characters,
  };
}
