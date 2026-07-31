// ============================================
// Zustand Store - 世界状态管理
// ============================================

import { create } from 'zustand';
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
  ID,
} from '../types';
import { generateId } from '../utils/id';
import { worldForgeAPI } from '../core/WorldForgeAPI';

interface WorldState {
  // 数据
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
  currentTimePoint: number | null; // 用于时间线视图

  // World 操作
  createWorld: (name: string, description?: string) => World;
  updateWorld: (updates: Partial<World>) => void;

  // Continent 操作
  createContinent: (data: Omit<Continent, 'id' | 'createdAt' | 'worldId'>) => Continent;
  updateContinent: (id: ID, updates: Partial<Continent>) => void;
  deleteContinent: (id: ID) => void;

  // Region 操作
  createRegion: (data: Omit<Region, 'id' | 'createdAt'>) => Region;
  updateRegion: (id: ID, updates: Partial<Region>) => void;
  deleteRegion: (id: ID) => void;

  // Location 操作
  createLocation: (data: Omit<Location, 'id' | 'createdAt'>) => Location;
  updateLocation: (id: ID, updates: Partial<Location>) => void;
  deleteLocation: (id: ID) => void;

  // Route 操作
  createRoute: (data: Omit<Route, 'id'>) => Route;
  updateRoute: (id: ID, updates: Partial<Route>) => void;
  deleteRoute: (id: ID) => void;

  // Era 操作
  createEra: (data: Omit<Era, 'id' | 'worldId'>) => Era;
  updateEra: (id: ID, updates: Partial<Era>) => void;
  deleteEra: (id: ID) => void;

  // Age 操作
  createAge: (data: Omit<Age, 'id'>) => Age;
  updateAge: (id: ID, updates: Partial<Age>) => void;
  deleteAge: (id: ID) => void;

  // Event 操作
  createEvent: (data: Omit<WorldEvent, 'id' | 'createdAt' | 'worldId'>) => WorldEvent;
  updateEvent: (id: ID, updates: Partial<WorldEvent>) => void;
  deleteEvent: (id: ID) => void;

  // Faction 操作
  createFaction: (data: Omit<Faction, 'id' | 'createdAt' | 'worldId'>) => Faction;
  updateFaction: (id: ID, updates: Partial<Faction>) => void;
  deleteFaction: (id: ID) => void;

  // Character 操作
  createCharacter: (data: Omit<Character, 'id' | 'createdAt' | 'worldId'>) => Character;
  updateCharacter: (id: ID, updates: Partial<Character>) => void;
  deleteCharacter: (id: ID) => void;

  // UI 操作
  setActiveView: (view: WorldState['activeView']) => void;
  selectEntity: (entityType: string | null, entityId: ID | null) => void;
  setCurrentTimePoint: (time: number | null) => void;

  // 工具
  getEntityById: (type: string, id: ID) => unknown | null;
}

export const useWorldStore = create<WorldState>((set, get) => ({
  // 初始状态
  world: null,
  continents: [],
  regions: [],
  locations: [],
  routes: [],
  eras: [],
  ages: [],
  events: [],
  factions: [],
  characters: [],
  activeView: 'map',
  selectedEntityType: null,
  selectedEntityId: null,
  currentTimePoint: null,

  // === World ===
  createWorld: (name: string, description = '') => {
    const world: World = {
      id: generateId(),
      name,
      description,
      scale: { unit: '公里', pixelsPerUnit: 1 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({ world });
    return world;
  },

  updateWorld: (updates) => {
    const { world } = get();
    if (!world) return;
    set({ world: { ...world, ...updates, updatedAt: new Date().toISOString() } });
  },

  // === Continent ===
  createContinent: (data) => {
    const { world } = get();
    if (!world) throw new Error('No world created yet');
    const continent: Continent = {
      ...data,
      id: generateId(),
      worldId: world.id,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ continents: [...state.continents, continent] }));
    worldForgeAPI.emitEntityEvent('entity:created', 'continent', continent.id, continent);
    return continent;
  },

  updateContinent: (id, updates) => {
    set((state) => ({
      continents: state.continents.map((c) => c.id === id ? { ...c, ...updates } : c),
    }));
    const updated = get().continents.find(c => c.id === id);
    if (updated) worldForgeAPI.emitEntityEvent('entity:updated', 'continent', id, updated);
  },

  deleteContinent: (id) => {
    set((state) => ({ continents: state.continents.filter((c) => c.id !== id) }));
    worldForgeAPI.emitEntityEvent('entity:deleted', 'continent', id, null);
  },

  // === Region ===
  createRegion: (data) => {
    const region: Region = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ regions: [...state.regions, region] }));
    worldForgeAPI.emitEntityEvent('entity:created', 'region', region.id, region);
    return region;
  },

  updateRegion: (id, updates) => {
    set((state) => ({
      regions: state.regions.map((r) => r.id === id ? { ...r, ...updates } : r),
    }));
    const updated = get().regions.find(r => r.id === id);
    if (updated) worldForgeAPI.emitEntityEvent('entity:updated', 'region', id, updated);
  },

  deleteRegion: (id) => {
    set((state) => ({ regions: state.regions.filter((r) => r.id !== id) }));
    worldForgeAPI.emitEntityEvent('entity:deleted', 'region', id, null);
  },

  // === Location ===
  createLocation: (data) => {
    const location: Location = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ locations: [...state.locations, location] }));
    worldForgeAPI.emitEntityEvent('entity:created', 'location', location.id, location);
    return location;
  },

  updateLocation: (id, updates) => {
    set((state) => ({
      locations: state.locations.map((l) => l.id === id ? { ...l, ...updates } : l),
    }));
    const updated = get().locations.find(l => l.id === id);
    if (updated) worldForgeAPI.emitEntityEvent('entity:updated', 'location', id, updated);
  },

  deleteLocation: (id) => {
    set((state) => ({ locations: state.locations.filter((l) => l.id !== id) }));
    worldForgeAPI.emitEntityEvent('entity:deleted', 'location', id, null);
  },

  // === Route ===
  createRoute: (data) => {
    const route: Route = { ...data, id: generateId() };
    set((state) => ({ routes: [...state.routes, route] }));
    worldForgeAPI.emitEntityEvent('entity:created', 'route', route.id, route);
    return route;
  },

  updateRoute: (id, updates) => {
    set((state) => ({
      routes: state.routes.map((r) => r.id === id ? { ...r, ...updates } : r),
    }));
    const updated = get().routes.find(r => r.id === id);
    if (updated) worldForgeAPI.emitEntityEvent('entity:updated', 'route', id, updated);
  },

  deleteRoute: (id) => {
    set((state) => ({ routes: state.routes.filter((r) => r.id !== id) }));
    worldForgeAPI.emitEntityEvent('entity:deleted', 'route', id, null);
  },

  // === Era ===
  createEra: (data) => {
    const { world } = get();
    if (!world) throw new Error('No world created yet');
    const era: Era = { ...data, id: generateId(), worldId: world.id };
    set((state) => ({ eras: [...state.eras, era] }));
    worldForgeAPI.emitEntityEvent('entity:created', 'era', era.id, era);
    return era;
  },

  updateEra: (id, updates) => {
    set((state) => ({
      eras: state.eras.map((e) => e.id === id ? { ...e, ...updates } : e),
    }));
    const updated = get().eras.find(e => e.id === id);
    if (updated) worldForgeAPI.emitEntityEvent('entity:updated', 'era', id, updated);
  },

  deleteEra: (id) => {
    set((state) => ({ eras: state.eras.filter((e) => e.id !== id) }));
    worldForgeAPI.emitEntityEvent('entity:deleted', 'era', id, null);
  },

  // === Age ===
  createAge: (data) => {
    const age: Age = { ...data, id: generateId() };
    set((state) => ({ ages: [...state.ages, age] }));
    worldForgeAPI.emitEntityEvent('entity:created', 'age', age.id, age);
    return age;
  },

  updateAge: (id, updates) => {
    set((state) => ({
      ages: state.ages.map((a) => a.id === id ? { ...a, ...updates } : a),
    }));
    const updated = get().ages.find(a => a.id === id);
    if (updated) worldForgeAPI.emitEntityEvent('entity:updated', 'age', id, updated);
  },

  deleteAge: (id) => {
    set((state) => ({ ages: state.ages.filter((a) => a.id !== id) }));
    worldForgeAPI.emitEntityEvent('entity:deleted', 'age', id, null);
  },

  // === Event ===
  createEvent: (data) => {
    const { world } = get();
    if (!world) throw new Error('No world created yet');
    const event: WorldEvent = {
      ...data,
      id: generateId(),
      worldId: world.id,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ events: [...state.events, event] }));
    worldForgeAPI.emitEntityEvent('entity:created', 'event', event.id, event);
    return event;
  },

  updateEvent: (id, updates) => {
    set((state) => ({
      events: state.events.map((e) => e.id === id ? { ...e, ...updates } : e),
    }));
    const updated = get().events.find(e => e.id === id);
    if (updated) worldForgeAPI.emitEntityEvent('entity:updated', 'event', id, updated);
  },

  deleteEvent: (id) => {
    set((state) => ({ events: state.events.filter((e) => e.id !== id) }));
    worldForgeAPI.emitEntityEvent('entity:deleted', 'event', id, null);
  },

  // === Faction ===
  createFaction: (data) => {
    const { world } = get();
    if (!world) throw new Error('No world created yet');
    const faction: Faction = {
      ...data,
      id: generateId(),
      worldId: world.id,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ factions: [...state.factions, faction] }));
    worldForgeAPI.emitEntityEvent('entity:created', 'faction', faction.id, faction);
    return faction;
  },

  updateFaction: (id, updates) => {
    set((state) => ({
      factions: state.factions.map((f) => f.id === id ? { ...f, ...updates } : f),
    }));
    const updated = get().factions.find(f => f.id === id);
    if (updated) worldForgeAPI.emitEntityEvent('entity:updated', 'faction', id, updated);
  },

  deleteFaction: (id) => {
    set((state) => ({ factions: state.factions.filter((f) => f.id !== id) }));
    worldForgeAPI.emitEntityEvent('entity:deleted', 'faction', id, null);
  },

  // === Character ===
  createCharacter: (data) => {
    const { world } = get();
    if (!world) throw new Error('No world created yet');
    const character: Character = {
      ...data,
      id: generateId(),
      worldId: world.id,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ characters: [...state.characters, character] }));
    worldForgeAPI.emitEntityEvent('entity:created', 'character', character.id, character);
    return character;
  },

  updateCharacter: (id, updates) => {
    set((state) => ({
      characters: state.characters.map((c) => c.id === id ? { ...c, ...updates } : c),
    }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) worldForgeAPI.emitEntityEvent('entity:updated', 'character', id, updated);
  },

  deleteCharacter: (id) => {
    set((state) => ({ characters: state.characters.filter((c) => c.id !== id) }));
    worldForgeAPI.emitEntityEvent('entity:deleted', 'character', id, null);
  },

  // === UI ===
  setActiveView: (view) => set({ activeView: view }),
  selectEntity: (entityType, entityId) => set({ selectedEntityType: entityType, selectedEntityId: entityId }),
  setCurrentTimePoint: (time) => set({ currentTimePoint: time }),

  // === 工具 ===
  getEntityById: (type, id) => {
    const state = get();
    const collection: Record<string, Array<{ id: string }>> = {
      continent: state.continents,
      region: state.regions,
      location: state.locations,
      route: state.routes,
      era: state.eras,
      age: state.ages,
      event: state.events,
      faction: state.factions,
      character: state.characters,
    };
    const items = collection[type];
    if (!items) return null;
    return items.find((item) => item.id === id) ?? null;
  },
}));
