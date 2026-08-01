// ============================================
// IndexedDB 持久化存储
// ============================================

import { openDB, type IDBPDatabase } from 'idb';
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

let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;
  
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object stores for each entity type
      if (!db.objectStoreNames.contains('kv')) {
        db.createObjectStore('kv');
      }
    },
  });
  
  return dbInstance;
}

// Save entire world state
export async function saveWorldData(data: WorldData): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('kv', 'readwrite');
  const store = tx.objectStore('kv');
  
  await store.put(data, 'worldData');
  await tx.done;
}

// Load entire world state
export async function loadWorldData(): Promise<WorldData | null> {
  const db = await getDB();
  const data = await db.get('kv', 'worldData');
  return data || null;
}

// Clear all data
export async function clearWorldData(): Promise<void> {
  const db = await getDB();
  await db.delete('kv', 'worldData');
}

// Export for debugging
export async function getStorageSize(): Promise<string> {
  const data = await loadWorldData();
  if (! data) return '0 KB';
  const bytes = JSON.stringify(data).length;
  return `${(bytes / 1024).toFixed(1)} KB`;
}
