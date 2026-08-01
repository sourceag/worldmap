// ============================================
// WorldForge 文件格式 (.wf.json)
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

export const WF_FILE_VERSION = '1.0.0';
export const WF_FILE_EXTENSION = '.wf.json';

export interface WFFile {
  _format: 'worldforge';
  _version: string;
  _exportedAt: string;
  world: World;
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

export interface WFValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  data?: WFFile;
}

// 导出为 WF 文件
export function exportToWFFile(data: {
  world: World;
  continents: Continent[];
  regions: Region[];
  locations: Location[];
  routes: Route[];
  eras: Era[];
  ages: Age[];
  events: WorldEvent[];
  factions: Faction[];
  characters: Character[];
}): WFFile {
  return {
    _format: 'worldforge',
    _version: WF_FILE_VERSION,
    _exportedAt: new Date().toISOString(),
    world: data.world,
    continents: data.continents,
    regions: data.regions,
    locations: data.locations,
    routes: data.routes,
    eras: data.eras,
    ages: data.ages,
    events: data.events,
    factions: data.factions,
    characters: data.characters,
  };
}

// 验证 WF 文件
export function validateWFFile(data: unknown): WFValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['文件内容不是有效的 JSON 对象'], warnings: [] };
  }

  const file = data as Partial<WFFile>;

  // 检查格式标识
  if (file._format !== 'worldforge') {
    errors.push('不是有效的 WorldForge 文件（缺少 _format 标识）');
    return { valid: false, errors, warnings };
  }

  // 检查版本兼容性
  if (!file._version) {
    warnings.push('文件缺少版本信息，可能不兼容');
  } else if (!isVersionCompatible(file._version, WF_FILE_VERSION)) {
    warnings.push(`文件版本 ${file._version} 与当前版本 ${WF_FILE_VERSION} 不完全兼容`);
  }

  // 检查必要字段
  if (!file.world || typeof file.world !== 'object') {
    errors.push('缺少世界数据（world）');
  }
  if (!file.world?.name) {
    errors.push('世界缺少名称');
  }

  // 检查数组字段
  const arrayFields = ['continents', 'regions', 'locations', 'routes', 'eras', 'ages', 'events', 'factions', 'characters'] as const;
  for (const field of arrayFields) {
    if (file[field] && !Array.isArray(file[field])) {
      errors.push(`字段 ${field} 必须是数组`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  return {
    valid: true,
    errors: [],
    warnings,
    data: file as WFFile,
  };
}

// 从 WF 文件导入
export function importFromWFFile(file: WFFile): {
  world: World;
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
    world: file.world,
    continents: file.continents || [],
    regions: file.regions || [],
    locations: file.locations || [],
    routes: file.routes || [],
    eras: file.eras || [],
    ages: file.ages || [],
    events: file.events || [],
    factions: file.factions || [],
    characters: file.characters || [],
  };
}

// 简单的版本兼容性检查
function isVersionCompatible(fileVersion: string, currentVersion: string): boolean {
  const [fileMajor] = fileVersion.split('.');
  const [currentMajor] = currentVersion.split('.');
  return fileMajor === currentMajor;
}

// 下载 WF 文件
export function downloadWFFile(data: WFFile, filename?: string) {
  const content = JSON.stringify(data, null, 2);
  const name = filename || `${data.world.name}-${new Date().toISOString().slice(0, 10)}.wf.json`;
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 读取并解析 WF 文件
export async function readWFFile(file: File): Promise<WFValidationResult> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    return validateWFFile(data);
  } catch (error) {
    return {
      valid: false,
      errors: [`文件解析失败: ${(error as Error).message}`],
      warnings: [],
    };
  }
}
