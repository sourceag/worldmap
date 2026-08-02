# UI 组件 (components/)

---

## App.tsx — 应用入口

**文件**: `src/App.tsx` (165 行)

应用根组件，负责初始化、持久化触发、布局和可调整面板。

```typescript
function App() {
  const { world, activeView, saveToStorage, loadFromStorage } = useWorldStore();
  const { toast } = useUndoRedo();
  
  // 面板宽度状态
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [propertiesWidth, setPropertiesWidth] = useState(320);
  
  // 拖拽状态（使用 ref 避免频繁渲染）
  const dragRef = useRef({ type, startX, startWidth });
  
  // 启动时从 IndexedDB 加载数据
  // 注册内置插件
  // 数据变化时自动保存（防抖 500ms）
  // 全局 mousemove/mouseup 处理拖拽
}
```

**布局结构**:
```
┌─────────────────────────────────────────────┐
│                  Navbar                     │
├──────────┬───┬──────────────────────┬───┤
│ Sidebar  │ ║ │     Main Canvas      │ ║ │ Properties │
│ (可拖拽) │ ║ │  (Map/Timeline/...)  │ ║ │  (可拖拽)  │
└──────────┴───┴──────────────────────┴───┘
```
其中 `║` 为拖拽手柄 (resize-handle)

### 可调整面板

| 面板 | 默认宽度 | 最小宽度 | 最大宽度 |
|---|---|---|---|
| Sidebar | 260px | 180px | 500px |
| Properties | 320px | 220px | 600px |

**拖拽交互**:
- 拖拽左侧手柄调整 Sidebar 宽度
- 拖拽右侧手柄调整 Properties 宽度
- Main Canvas 自动填充剩余空间
- 拖拽时手柄高亮显示

**实现细节**:
- 使用 `useRef` 存储拖拖拽状态，避免拖拽过程中频繁触发 React 渲染
- `window.addEventListener('mousemove')` 全局监听拖拽
- 拖拽时通过 `setSidebarWidth` / `setPropertiesWidth` 更新宽度

**自动保存触发条件**: world, continents, regions, locations, routes, eras, ages, events, factions, characters 任一变化。

---

## MapView.tsx — 地图视图（核心）

**文件**: `src/components/MapView.tsx` (770+ 行)

最复杂的组件，负责 Canvas 渲染和交互。

### 状态

```typescript
viewport: { x: number; y: number; zoom: number }  // 视口变换
tool: ToolMode                                       // 当前工具
drawing: DrawingState | null                         // 绘制中状态
polygonEdit: PolygonEditState | null                 // 编辑中状态
canvasBgColor: string                                // 背景色
zoomSpeed: number                                    // 缩放速度
showDialog: boolean                                  // 属性对话框
dialogData: { name, description, terrain }          // 对话框数据
```

### 工具模式

| 工具 | 说明 | 交互 |
|---|---|---|
| `select` | 选择实体 | 点击选中，拖拽顶点（编辑模式） |
| `pan` | 平移画布 | 拖拽平移 |
| `draw-continent` | 绘制大陆 | 点击添加顶点，双击闭合 |
| `draw-region` | 绘制区域 | 首次点击检测所属大陆，后续绘制 |
| `add-location` | 添加地点 | 点击放置地点 |
| `edit-polygon` | 编辑形状 | 拖拽顶点调整 |

### 绘制流程

```
1. 用户选择 draw-continent / draw-region
2. 点击画布 → 添加顶点（屏幕坐标转世界坐标）
3. 移动鼠标 → 实时预览线
4. 双击/点击起点 → 闭合多边形
5. 弹出对话框 → 输入名称等属性
6. 调用 Store 创建实体
```

### Canvas 渲染管线

```typescript
draw():
  1. 设置 canvas 尺寸 (CSS × DPR)
  2. reset transform → clearRect (清除整个缓冲区)
  3. 绘制背景色
  4. 绘制网格 (drawGrid)
  5. 绘制大陆（目标大陆高亮蓝色，非目标大陆变暗）
  6. 绘制区域（同大陆区域蓝色边框）
  7. 绘制地点
  8. 绘制绘制中的多边形预览
  9. 绘制编辑模式的顶点控制柄
  10. ctx.restore()
```

### 坐标转换

```typescript
screenToWorld(screenX, screenY) → { x: number, y: number }
// world = (screen - viewportOffset) / zoom

worldToScreen(worldX, worldY) → { x: number, y: number }
// screen = world * zoom + viewportOffset
```

### 键盘事件

| 快捷键 | 功能 |
|---|---|
| Ctrl+Z | 撤销（全局历史 / 绘制时撤销顶点） |
| Ctrl+Shift+Z / Ctrl+Y | 重做 |
| Escape | 取消绘制 / 退出编辑模式 |

### 视觉反馈

- **目标大陆**: 蓝色粗边框 + 高亮
- **非目标大陆**: 半透明黑色遮罩变暗
- **已有区域（同大陆）**: 蓝色边框
- **选中实体**: 红色边框
- **编辑中顶点**: 红色控制柄圆点

### 地形系统

每个区域可独立设置地形类型，地图上以不同颜色区分：

| 地形 | 颜色 | 说明 |
|---|---|---|
| 🌾 平原 | 草绿 | 默认地形 |
| ⛰️ 山脉 | 深灰 | 高海拔地形 |
| 🌲 森林 | 深绿 | 密布树木 |
| 🏜️ 沙漠 | 金黄 | 干旱地区 |
| 🌊 海洋 | 蓝色 | 水域 |
| 🌿 沼泽 | 暗绿 | 湿地 |
| ❄️ 冻原 | 浅蓝 | 寒冷地区 |
| ⛰️ 丘陵 | 棕色 | 低矮山丘 |
| 🌴 丛林 | 翠绿 | 热带密林 |
| 🪨 荒地 | 灰褐 | 贫瘠土地 |
| 🥣 盆地 | 橙黄 | 四周高中间低 |
| 🏔️ 高原 | 赭石 | 高耸平地 |
| 🏞️ 山谷 | 青绿 | 两山之间 |
| 🪨 峡谷 | 红褐 | 深切河谷 |
| 🏖️ 海岸 | 青色 | 海陆交界 |
| 🌋 火山 | 红色 | 活火山 |
| 🧊 冰川 | 冰蓝 | 永久冰雪 |
| 💧 绿洲 | 亮蓝 | 沙漠水源 |

## Sidebar.tsx — 侧边栏

**文件**: `src/components/Sidebar.tsx` (228 行)

实体树形列表，支持快速创建和选择。接受 `style`  prop 以支持动态宽度调整。

```typescript
export function Sidebar({ style }: { style?: React.CSSProperties }) {
  // ...
  return <aside className="sidebar" style={style}>...</aside>;
}
```

```typescript
// 按类型分组显示
sections = [
  { title: '大陆', items: continents, icon: '🌍', onCreate: handleCreateContinent },
  { title: '区域', items: regions, icon: '🏔️', onCreate: handleCreateRegion },
  { title: '地点', items: locations, icon: '📍', onCreate: handleCreateLocation },
  { title: '势力', items: factions, icon: '⚔️', onCreate: handleCreateFaction },
  { title: '事件', items: events, icon: '📜', onCreate: handleCreateEvent },
  { title: '人物', items: characters, icon: '👤', onCreate: handleCreateCharacter },
]
```

**交互**: 点击实体选中，点击 "+" 按钮快速创建。

---

## PropertiesPanel.tsx — 属性面板

**文件**: `src/components/PropertiesPanel.tsx` (426 行)

根据选中实体类型渲染不同表单。接受 `style` prop 以支持动态宽度调整。

```typescript
export function PropertiesPanel({ style }: { style?: React.CSSProperties }) {
  // ...
  return <aside className="properties-panel" style={style}>...</aside>;
}
```

**支持的编辑**:

| 实体 | 可编辑字段 |
|---|---|
| Continent | 名称、描述、气候 |
| Region | 名称、描述、地形、资源 |
| Location | 名称、类型、描述、人口、别名 |
| Faction | 名称、类型、描述、意识形态、经济水平 |
| Event | 名称、类型、描述 |
| Character | 名称、称号、描述 |

**删除逻辑**:
```typescript
handleDelete() {
  const message = selectedEntityType === 'continent'
    ? `确定要删除大陆"${name}"吗？下属的区域和地点也会被删除。`
    : selectedEntityType === 'region'
    ? `确定要删除区域"${name}"吗？下属的地点也会被删除。`
    : `确定要删除"${name}"吗？`;
  
  if (confirm(message)) {
    switch (selectedEntityType) {
      case 'continent': cascadeDeleteContinent(id); break;
      case 'region': cascadeDeleteRegion(id); break;
      default: deleteXxx(id);
    }
  }
}
```

---

## TimelineView.tsx — 时间线视图

**文件**: `src/components/TimelineView.tsx` (90 行)

按时间顺序显示事件。

```typescript
// 按年份排序事件
const sortedEvents = [...events].sort((a, b) => a.startDate.year - b.startDate.year);

// 显示结构
// - 纪元横向卡片
// - 事件卡片（时间、名称、类型、描述、参与方数量）
```

---

## RelationsView.tsx — 关系图谱（简化版）

**文件**: `src/components/RelationsView.tsx` (80 行)

当前为简化实现，显示实体节点和控制关系文本。

```typescript
// 实体节点列表（势力、地点、人物）
nodes = [...factions, ...locations.slice(0, 10), ...characters.slice(0, 10)]

// 控制关系（文本形式）
edges = factions.flatMap(f => 
  f.controlledRegions.map(rId => ({
    from: f.id, to: rId, label: '控制'
  }))
)
```

**待实现**: 力导向图可视化。

---

## ConsistencyView.tsx — 一致性检查

**文件**: `src/components/ConsistencyView.tsx` (100 行)

自动检测并显示设定矛盾。

```typescript
// 内置检查规则
const builtInChecks = [
  { rule: 'event-has-participants', check: events.filter(e => e.participants.length === 0) },
  { rule: 'character-has-faction', check: characters.filter(c => !c.factionId) },
  { rule: 'faction-has-regions', check: factions.filter(f => f.controlledRegions.length === 0) },
];

// 运行插件校验器
const pluginIssues = await pluginManager.runValidation(world, allEntities);
```

**UI**: 问题按严重程度分类（错误/警告/信息），可点击跳转到相关实体。

---

## PluginsView.tsx — 插件管理

**文件**: `src/components/PluginsView.tsx` (200 行)

插件管理 + 数据导出/导入 UI。

**功能区块**:
1. **WorldForge 文件** — 导入/导出 .wf.json
2. **数据导出** — 选择格式、预览/下载
3. **数据管理** — 立即保存/清除数据
4. **已安装插件** — 列表、启用/禁用、配置查看

---

## Navbar.tsx — 顶部导航

**文件**: `src/components/Navbar.tsx` (40 行)

视图切换标签 + 世界名称显示。

```typescript
const tabs = [
  { id: 'map', label: '🗺️ 地图' },
  { id: 'timeline', label: '📅 时间线' },
  { id: 'relations', label: '🔗 关系图' },
  { id: 'consistency', label: '✅ 一致性' },
  { id: 'plugins', label: '🧩 插件' },
];
```

---

## WelcomeScreen.tsx — 欢迎界面

**文件**: `src/components/WelcomeScreen.tsx` (60 行)

创建新世界或恢复已有数据。

```typescript
// 检测已有数据
useEffect(() => {
  const check = async () => {
    const data = await loadWorldData();
    setHasExistingData(!!data?.world);
  };
  check();
}, []);

// UI: 如果有已有数据，显示"恢复上次的世界"
//     否则显示创建表单（世界名称 + 描述）
```

---

## CSS — 拖拽调整手柄

**文件**: `src/App.css`

```css
/* 拖拽调整手柄 */
.resize-handle {
  width: 5px;
  cursor: col-resize;
  background-color: var(--color-border);
  transition: background-color 0.15s ease;
  flex-shrink: 0;
  z-index: 10;
}

.resize-handle:hover,
.resize-handle:active {
  background-color: var(--color-accent);  /* 悬停时高亮 */
}
```

**布局约束**:
```css
.sidebar {
  flex-shrink: 0;      /* 防止被压缩 */
  min-width: 180px;    /* 最小宽度 */
}

.properties-panel {
  flex-shrink: 0;
  min-width: 220px;
}

.main-canvas {
  flex: 1;             /* 自动填充剩余空间 */
  min-width: 0;
}
```
