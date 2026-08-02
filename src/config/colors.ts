// ============================================
// 完整主题配置 — 项目唯一颜色源
// ============================================

// === 基础主题变量（对应 CSS custom properties） ===

export const Theme = {
  // 背景色（三层深度）
  bgPrimary: '#05077a',
  bgSecondary: '#07065b',
  bgTertiary: '#310582',

  // 文字色
  textPrimary: '#e4e4e7',
  textSecondary: '#a1a1aa',

  // 交互色
  accent: '#e94560',
  accentHover: '#ff6b6b',
  border: '#2d2d44',

  // 语义色
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',

  // 尺寸
  sidebarWidth: 260,
  panelWidth: 320,
  navbarHeight: 48,
} as const;

// === Canvas 绘制颜色 ===

export const CanvasColors = {
  // 大陆
  continent: {
    fill: 'rgba(30, 41, 59, 0.6)',
    stroke: '#475569',
    strokeSelected: '#3b82f6',
    label: Theme.textPrimary,
  },

  // 区域
  region: {
    stroke: '#334155',
    strokeSelected: Theme.accent,
    strokeEditing: Theme.accent,
    strokeBelongsToTarget: '#60a5fa',
    label: '#cbd5e1',
  },

  // 地点
  location: {
    fill: '#3b82f6',
    fillSelected: Theme.accent,
    stroke: '#1e293b',
    label: Theme.textPrimary,
  },

  // 正在绘制的多边形
  drawing: {
    line: Theme.accent,
    vertex: Theme.accent,
    firstVertex: Theme.success, // 第一个点（可闭合时变绿）
    closeHint: Theme.success,  // 靠近起点时的提示圈
  },

  // 编辑模式
  edit: {
    vertexHandle: Theme.accent,
    vertexHandleStroke: '#fff',
  },

  // 遮罩
  mask: {
    nonTargetContinent: 'rgba(0, 0, 0, 0.4)',
  },

  // 网格
  grid: {
    line: 'rgba(255, 255, 255, 0.03)',
  },

  // 画布背景
  canvasBackground: '#064446',
} as const;

// === 地形颜色 ===

export const TerrainColors: Record<string, string> = {
  plains: 'rgba(101, 163, 13, 0.25)',      // 平原 - 草绿
  mountains: 'rgba(120, 113, 108, 0.35)',  // 山脉 - 深灰
  forest: 'rgba(22, 101, 52, 0.35)',       // 森林 - 深绿
  desert: 'rgba(234, 179, 8, 0.3)',        // 沙漠 - 金黄
  ocean: 'rgba(59, 130, 246, 0.35)',       // 海洋 - 蓝色
  swamp: 'rgba(101, 163, 13, 0.3)',        // 沼泽 - 暗绿
  tundra: 'rgba(147, 197, 253, 0.3)',      // 冻原 - 浅蓝
  hills: 'rgba(161, 98, 7, 0.3)',          // 丘陵 - 棕色
  jungle: 'rgba(22, 163, 74, 0.35)',       // 丛林 - 翠绿
  wasteland: 'rgba(120, 113, 108, 0.2)',   // 荒地 - 灰褐
  basin: 'rgba(245, 158, 11, 0.25)',       // 盆地 - 橙黄
  plateau: 'rgba(180, 83, 9, 0.3)',        // 高原 - 赭石
  valley: 'rgba(34, 197, 94, 0.3)',        // 山谷 - 青绿
  canyon: 'rgba(185, 28, 28, 0.25)',       // 峡谷 - 红褐
  coast: 'rgba(20, 184, 166, 0.3)',        // 海岸 - 青色
  volcano: 'rgba(239, 68, 68, 0.35)',      // 火山 - 红色
  glacier: 'rgba(186, 230, 253, 0.4)',     // 冰川 - 冰蓝
  oasis: 'rgba(34, 211, 238, 0.4)',        // 绿洲 - 亮蓝
};

export const DEFAULT_TERRAIN_COLOR = 'rgba(100, 116, 139, 0.15)';

// === 地形标签 ===

export const TerrainLabels: Record<string, string> = {
  plains: '🌾 平原',
  mountains: '⛰️ 山脉',
  forest: '🌲 森林',
  desert: '🏜️ 沙漠',
  ocean: '🌊 海洋',
  swamp: '🌿 沼泽',
  tundra: '❄️ 冻原',
  hills: '⛰️ 丘陵',
  jungle: '🌴 丛林',
  wasteland: '🪨 荒地',
  basin: '🥣 盆地',
  plateau: '🏔️ 高原',
  valley: '🏞️ 山谷',
  canyon: '🪨 峡谷',
  coast: '🏖️ 海岸',
  volcano: '🌋 火山',
  glacier: '🧊 冰川',
  oasis: '💧 绿洲',
};

export const DEFAULT_TERRAIN_LABEL = '未知地形';

// === CSS 变量注入 ===

// 将主题配置映射为 CSS custom properties
const cssVariableMap: Record<string, string> = {
  '--color-bg-primary': Theme.bgPrimary,
  '--color-bg-secondary': Theme.bgSecondary,
  '--color-bg-tertiary': Theme.bgTertiary,
  '--color-text-primary': Theme.textPrimary,
  '--color-text-secondary': Theme.textSecondary,
  '--color-accent': Theme.accent,
  '--color-accent-hover': Theme.accentHover,
  '--color-border': Theme.border,
  '--color-success': Theme.success,
  '--color-warning': Theme.warning,
  '--color-error': Theme.error,
  '--sidebar-width': `${Theme.sidebarWidth}px`,
  '--panel-width': `${Theme.panelWidth}px`,
  '--navbar-height': `${Theme.navbarHeight}px`,
};

let injected = false;

/** 注入 CSS 变量到 document.documentElement（只需调用一次） */
export function injectCSSVariables(): void {
  if (injected || typeof document === 'undefined') return;
  
  const root = document.documentElement;
  for (const [name, value] of Object.entries(cssVariableMap)) {
    root.style.setProperty(name, value);
  }
  injected = true;
}
