// ============================================
// 内置插件：Markdown 导出器
// ============================================

import type { ExporterPlugin, ExportOptions } from '../types';

export const markdownExporter: ExporterPlugin = {
  format: 'markdown',
  fileExtension: '.md',

  async export(data: unknown, options: ExportOptions): Promise<string> {
    const d = data as Record<string, unknown>;
    const lines: string[] = [];

    // World
    if (d.world) {
      const world = d.world as { name: string; description: string };
      lines.push(`# ${world.name}`);
      lines.push('');
      if (world.description) {
        lines.push(world.description);
        lines.push('');
      }
      lines.push('---');
      lines.push('');
    }

    // Continents
    if (d.continents && (d.continents as unknown[]).length > 0) {
      lines.push('## 大陆');
      lines.push('');
      for (const continent of d.continents as Array<{ name: string; description: string }>) {
        lines.push(`### ${continent.name}`);
        lines.push('');
        if (continent.description) {
          lines.push(continent.description);
          lines.push('');
        }
      }
    }

    // Regions
    if (d.regions && (d.regions as unknown[]).length > 0) {
      lines.push('## 区域');
      lines.push('');
      for (const region of d.regions as Array<{ name: string; description: string; terrain: string }>) {
        lines.push(`### ${region.name}`);
        lines.push('');
        lines.push(`- 地形: ${region.terrain}`);
        if (region.description) {
          lines.push(`- 描述: ${region.description}`);
        }
        lines.push('');
      }
    }

    // Locations
    if (d.locations && (d.locations as unknown[]).length > 0) {
      lines.push('## 地点');
      lines.push('');
      for (const location of d.locations as Array<{ name: string; description: string; type: string }>) {
        // Use Obsidian wiki-link syntax for names
        lines.push(`### [[${location.name}]]`);
        lines.push('');
        lines.push(`- 类型: ${location.type}`);
        if (location.description) {
          lines.push(`- 描述: ${location.description}`);
        }
        lines.push('');
      }
    }

    // Factions
    if (d.factions && (d.factions as unknown[]).length > 0) {
      lines.push('## 势力');
      lines.push('');
      for (const faction of d.factions as Array<{ name: string; description: string; type: string }>) {
        lines.push(`### [[${faction.name}]]`);
        lines.push('');
        lines.push(`- 类型: ${faction.type}`);
        if (faction.description) {
          lines.push(`- 描述: ${faction.description}`);
        }
        lines.push('');
      }
    }

    // Events
    if (d.events && (d.events as unknown[]).length > 0) {
      lines.push('## 事件');
      lines.push('');
      for (const event of d.events as Array<{ name: string; description: string; type: string }>) {
        lines.push(`### ${event.name}`);
        lines.push('');
        lines.push(`- 类型: ${event.type}`);
        if (event.description) {
          lines.push(`- 描述: ${event.description}`);
        }
        lines.push('');
      }
    }

    // Characters
    if (d.characters && (d.characters as unknown[]).length > 0) {
      lines.push('## 人物');
      lines.push('');
      for (const character of d.characters as Array<{ name: string; description: string }>) {
        lines.push(`### [[${character.name}]]`);
        lines.push('');
        if (character.description) {
          lines.push(character.description);
          lines.push('');
        }
      }
    }

    return lines.join('\n');
  },
};
