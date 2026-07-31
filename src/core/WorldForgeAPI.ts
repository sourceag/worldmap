// ============================================
// WorldForge API 实现
// ============================================

import type {
  WorldForgeAPI,
  World,
  ExportOptions,
  ImportOptions,
  ImportResult,
  WorldEventPayload,
  EventHandler,
} from '../types';
import { pluginManager } from './PluginManager';
import { useWorldStore } from '../store/worldStore';

class WorldForgeAPIImpl implements WorldForgeAPI {
  getWorld(): World | null {
    return useWorldStore.getState().world;
  }

  getEntity(type: string, id: string): unknown | null {
    const state = useWorldStore.getState();
    const collection = this.getCollection(state, type);
    if (!collection) return null;
    return (collection as Array<{ id: string }>).find(e => e.id === id) ?? null;
  }

  queryEntities(type: string, filter?: Record<string, unknown>): unknown[] {
    const state = useWorldStore.getState();
    const collection = this.getCollection(state, type);
    if (!collection) return [];
    
    if (!filter) return collection;
    
    return collection.filter((entity) => {
      const record = entity as Record<string, unknown>;
      return Object.entries(filter).every(([key, value]) => record[key] === value);
    });
  }

  private getCollection(state: ReturnType<typeof useWorldStore.getState>, type: string): unknown[] | null {
    const mapping: Record<string, unknown[]> = {
      world: state.world ? [state.world] : [],
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
    return mapping[type] ?? null;
  }

  on(event: string, handler: EventHandler): void {
    pluginManager.on(event, handler);
  }

  off(event: string, handler: EventHandler): void {
    pluginManager.off(event, handler);
  }

  registerExporter(format: string, exporter: Parameters<typeof pluginManager.registerExporter>[1]): void {
    pluginManager.registerExporter(format, exporter);
  }

  registerImporter(format: string, importer: Parameters<typeof pluginManager.registerImporter>[1]): void {
    pluginManager.registerImporter(format, importer);
  }

  registerValidator(name: string, validator: Parameters<typeof pluginManager.registerValidator>[1]): void {
    pluginManager.registerValidator(name, validator);
  }

  async export(format: string, options: ExportOptions = {}): Promise<string> {
    const state = useWorldStore.getState();
    const data = this.collectExportData(state, options);
    return pluginManager.export(format, data, options);
  }

  async import(format: string, data: string, options: ImportOptions = {}): Promise<ImportResult> {
    return pluginManager.import(format, data, options);
  }

  private collectExportData(state: ReturnType<typeof useWorldStore.getState>, options: ExportOptions): Record<string, unknown> {
    const types = options.includeTypes ?? ['world', 'continent', 'region', 'location', 'route', 'era', 'age', 'event', 'faction', 'character'];
    const excludeTypes = options.excludeTypes ?? [];
    
    const data: Record<string, unknown> = {};
    for (const type of types) {
      if (excludeTypes.includes(type)) continue;
      switch (type) {
        case 'world': data.world = state.world; break;
        case 'continent': data.continents = state.continents; break;
        case 'region': data.regions = state.regions; break;
        case 'location': data.locations = state.locations; break;
        case 'route': data.routes = state.routes; break;
        case 'era': data.eras = state.eras; break;
        case 'age': data.ages = state.ages; break;
        case 'event': data.events = state.events; break;
        case 'faction': data.factions = state.factions; break;
        case 'character': data.characters = state.characters; break;
      }
    }
    return data;
  }

  emitEntityEvent(type: 'entity:created' | 'entity:updated' | 'entity:deleted', entityType: string, entityId: string, data: unknown): void {
    const payload: WorldEventPayload = {
      type,
      entityType,
      entityId,
      data,
      timestamp: new Date().toISOString(),
    };
    pluginManager.emit(type, payload);
    pluginManager.emit('*', payload);
  }
}

// Singleton
export const worldForgeAPI = new WorldForgeAPIImpl();
export default worldForgeAPI;
