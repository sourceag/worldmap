// ============================================
// 内置插件：Obsidian 同步适配器
// ============================================

import type { PluginManifest, WorldEventPayload, ImporterPlugin, ImportOptions, ImportResult } from '../types';

// Obsidian note frontmatter type
interface ObsidianFrontmatter {
  [key: string]: unknown;
}

function entityToObsidianContent(
  entityType: string,
  entity: Record<string, unknown>,
  allEntities: Map<string, unknown[]>
): string {
  const frontmatter: ObsidianFrontmatter = {
    type: entityType,
    id: entity.id as string,
    created: entity.createdAt || new Date().toISOString(),
  };

  const lines: string[] = [];

  // Build YAML frontmatter
  lines.push('---');
  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const v of value) {
        lines.push(`  - "${v}"`);
      }
    } else {
      lines.push(`${key}: "${value}"`);
    }
  }
  lines.push('---');
  lines.push('');

  // Build content based on entity type
  switch (entityType) {
    case 'location': {
      lines.push(`# ${entity.name}`);
      lines.push('');
      if (entity.type) lines.push(`**类型**: ${entity.type}`);
      if (entity.description) {
        lines.push('');
        lines.push(entity.description as string);
      }
      if (entity.controlledBy) {
        const factions = allEntities.get('faction') || [];
        const faction = factions.find((f) => (f as Record<string, unknown>).id === entity.controlledBy);
        if (faction) {
          lines.push('');
          lines.push(`**控制方**: [[${(faction as Record<string, unknown>).name}]]`);
        }
      }
      if (entity.regionId) {
        const regions = allEntities.get('region') || [];
        const region = regions.find((r) => (r as Record<string, unknown>).id === entity.regionId);
        if (region) {
          lines.push(`**所属区域**: [[${(region as Record<string, unknown>).name}]]`);
        }
      }
      break;
    }
    case 'faction': {
      lines.push(`# ${entity.name}`);
      lines.push('');
      if (entity.type) lines.push(`**类型**: ${entity.type}`);
      if (entity.description) {
        lines.push('');
        lines.push(entity.description as string);
      }
      if (entity.controlledRegions && (entity.controlledRegions as string[]).length > 0) {
        lines.push('');
        lines.push('**控制区域**:');
        const regions = allEntities.get('region') || [];
        for (const regionId of entity.controlledRegions as string[]) {
          const region = regions.find((r) => (r as Record<string, unknown>).id === regionId);
          if (region) {
            lines.push(`- [[${(region as Record<string, unknown>).name}]]`);
          }
        }
      }
      break;
    }
    case 'character': {
      lines.push(`# ${entity.name}`);
      lines.push('');
      if (entity.titles && (entity.titles as string[]).length > 0) {
        lines.push(`**称号**: ${(entity.titles as string[]).join(', ')}`);
      }
      if (entity.description) {
        lines.push('');
        lines.push(entity.description as string);
      }
      if (entity.factionId) {
        const factions = allEntities.get('faction') || [];
        const faction = factions.find((f) => (f as Record<string, unknown>).id === entity.factionId);
        if (faction) {
          lines.push('');
          lines.push(`**所属势力**: [[${(faction as Record<string, unknown>).name}]]`);
        }
      }
      if (entity.relationships && (entity.relationships as unknown[]).length > 0) {
        lines.push('');
        lines.push('**人物关系**:');
        for (const rel of entity.relationships as Array<{ targetId: string; type: string }>) {
          const characters = allEntities.get('character') || [];
          const target = characters.find((c) => (c as Record<string, unknown>).id === rel.targetId);
          if (target) {
            lines.push(`- ${rel.type} [[${(target as Record<string, unknown>).name}]]`);
          }
        }
      }
      break;
    }
    case 'event': {
      lines.push(`# ${entity.name}`);
      lines.push('');
      if (entity.type) lines.push(`**类型**: ${entity.type}`);
      if (entity.description) {
        lines.push('');
        lines.push(entity.description as string);
      }
      if (entity.startDate) {
        const startDate = entity.startDate as { displayString: string };
        lines.push(`**时间**: ${startDate.displayString}`);
      }
      if (entity.locationId) {
        const locations = allEntities.get('location') || [];
        const location = locations.find((l) => (l as Record<string, unknown>).id === entity.locationId);
        if (location) {
          lines.push(`**地点**: [[${(location as Record<string, unknown>).name}]]`);
        }
      }
      if (entity.participants && (entity.participants as string[]).length > 0) {
        lines.push('');
        lines.push('**参与方**:');
        const factions = allEntities.get('faction') || [];
        const characters = allEntities.get('character') || [];
        for (const participantId of entity.participants as string[]) {
          const faction = factions.find((f) => (f as Record<string, unknown>).id === participantId);
          const character = characters.find((c) => (c as Record<string, unknown>).id === participantId);
          if (faction) lines.push(`- [[${(faction as Record<string, unknown>).name}]]`);
          if (character) lines.push(`- [[${(character as Record<string, unknown>).name}]]`);
        }
      }
      break;
    }
    default: {
      lines.push(`# ${entity.name || entityType}`);
      lines.push('');
      if (entity.description) {
        lines.push(entity.description as string);
      }
      break;
    }
  }

  return lines.join('\n');
}

// Helper to convert wiki-links back to plain text
function obsidianContentToEntity(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  // Parse YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const fm = frontmatterMatch[1];
    for (const line of fm.split('\n')) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
        result[key] = value;
      }
    }
  }

  // Extract description (content after frontmatter)
  const afterFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');
  const lines = afterFrontmatter.split('\n');
  
  // Skip title line and metadata lines, collect description
  let inDescription = false;
  const descriptionLines: string[] = [];
  
  for (const line of lines) {
    if (line.startsWith('# ')) continue;
    if (line.startsWith('**') && line.includes(':')) continue;
    if (line === '') {
      if (inDescription) descriptionLines.push('');
      continue;
    }
    if (line.startsWith('- ')) continue;
    inDescription = true;
    descriptionLines.push(line);
  }
  
  if (descriptionLines.length > 0) {
    result.description = descriptionLines.join('\n').trim();
  }

  return result;
}

export const obsidianSyncAdapter: PluginManifest = {
  id: 'obsidian-sync',
  name: 'Obsidian 同步',
  version: '1.0.0',
  type: 'sync-adapter',
  description: '与 Obsidian 笔记双向同步世界观数据',
  permissions: ['read:locations', 'read:factions', 'read:characters', 'read:events', 'write:locations', 'write:factions', 'write:characters', 'write:events'],
  config: {
    vaultPath: '',
    syncInterval: 30,
    enabled: true,
  },
  enabled: true,
};

export function createObsidianEventHandler(allEntities: Map<string, unknown[]>) {
  return async (payload: WorldEventPayload): Promise<void> => {
    if (!payload.data) return;
    
    const entityData = payload.data as Record<string, unknown>;
    const noteName = entityData.name as string;
    
    if (!noteName || noteName.trim() === '') return;
    
    const content = entityToObsidianContent(payload.entityType, entityData, allEntities);
    
    // In Tauri context, this would write to file
    // For now, just log the action
    console.log(`[Obsidian Sync] ${payload.type} event for ${payload.entityType}: ${noteName}`);
    console.log(`[Obsidian Sync] Content length: ${content.length} chars`);
    
    // TODO: Implement actual file I/O via Tauri
  };
}

export const obsidianImporter: ImporterPlugin = {
  format: 'obsidian',
  fileExtension: '.md',

  async import(data: string, options: ImportOptions): Promise<ImportResult> {
    try {
      const entity = obsidianContentToEntity(data);
      return {
        success: true,
        imported: 1,
        errors: [],
        warnings: [],
        ...entity,
      };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [`Obsidian import error: ${(error as Error).message}`],
        warnings: [],
      };
    }
  },
};
