# MapView — 地图视图组件

---

## 概述

**文件**: `src/components/MapView.tsx` (1200 行)

MapView 是 WorldForge 的核心组件，提供基于 HTML5 Canvas 2D 的交互式地图编辑功能。用户可以在画布上绘制大陆多边形、区域多边形、添加地点标记，并进行选择、平移、缩放、编辑、删除等操作。

---

## 核心架构

### 技术选型

| 技术 | 选择 | 原因 |
|------|------|------|
| 渲染引擎 | Canvas 2D | 需要绘制大量多边形和标记，Canvas 性能远高于 DOM |
| 状态管理 | Zustand | 与 store 直接交互，无需 props 层层传递 |
| 坐标变换 | viewport 状态 | 通过 translate + scale 实现平移缩放 |
| 事件系统 | React 合成事件 | 统一处理鼠标、键盘、滚轮事件 |

### 数据流

```
用户交互 (鼠标/键盘)
       │
       ▼
  handleMouseDown / handleMouseMove / handleWheel / ...
       │
       ▼
  调用 Store 方法 (createContinent, updateRegion, ...)
       │
       ▼
  Zustand Store 更新状态
       │
       ▼
  draw() 函数自动重绘画布 (useEffect 依赖)
```

---

## 工具模式 (ToolMode)

```typescript
type ToolMode = 'select' | 'pan' | 'draw-continent' | 'draw-region' | 'add-location' | 'edit-polygon';
```

| 模式 | 图标 | 光标 | 功能 |
|------|------|------|------|
| `select` | 👆 | default | 点击选中实体（大陆/区域/地点） |
| `pan` | ✋ | grab | 拖拽平移视图 |
| `draw-continent` | 🌍 | crosshair | 逐点击绘制大陆多边形 |
| `draw-region` | 🏔️ | crosshair | 在大陆内绘制区域多边形 |
| `add-location` | 📍 | crosshair | 点击添加地点标记 |
| `edit-polygon` | ✏️ | move | 拖拽多边形顶点调整形状 |

---

## 状态定义

### viewport — 视口变换

```typescript
const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
```

| 字段 | 含义 | 范围 |
|------|------|------|
| `x` | 水平偏移量（屏幕像素） | 无限制 |
| `y` | 垂直偏移量（屏幕像素） | 无限制 |
| `zoom` | 缩放比例 | 0.1 ~ 10 (10% ~ 1000%) |

### drawing — 绘制中的多边形

```typescript
interface DrawingState {
  points: { x: number; y: number }[];       // 已确定的顶点
  targetContinentId?: string;                // 区域所属的大陆 ID
  snapToEdge?: 'continent' | 'region';       // 边缘贴合模式
  snappedEdgeId?: string;                    // 贴合的边缘所属实体 ID
}
```

### polygonEdit — 多边形编辑状态

```typescript
interface PolygonEditState {
  entityType: 'continent' | 'region';  // 编辑的实体类型
  entityId: string;                     // 编辑的实体 ID
  dragVertexIndex: number | null;       // 当前拖拽的顶点索引
}
```

### dialogData — 创建对话框数据

```typescript
const [dialogData, setDialogData] = useState({
  name: '',
  description: '',
  terrain: 'plains' as TerrainType
});
```

---

## 坐标系统

地图存在两套坐标，通过 viewport 互相转换：

| 坐标系 | 说明 | 示例 |
|--------|------|------|
| **世界坐标** | 地图上的逻辑位置，与缩放无关 | `{ x: 500, y: 300 }` |
| **屏幕坐标** | 浏览器像素位置 | `{ x: 1200, y: 600 }` |

### 转换函数

```typescript
// 屏幕 → 世界
const screenToWorld = (clientX, clientY) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left - viewport.x) / viewport.zoom,
    y: (clientY - rect.top - viewport.y) / viewport.zoom,
  };
};

// 世界 → 屏幕
const worldToScreen = (worldX, worldY) => {
  return {
    x: worldX * viewport.zoom + viewport.x,
    y: worldY * viewport.zoom + viewport.y,
  };
};
```

公式：
```
屏幕坐标 = 世界坐标 × 缩放比例 + 偏移量
世界坐标 = (屏幕坐标 - 偏移量) / 缩放比例
```

---

## 渲染流程

### draw() 主函数

```typescript
const draw = useCallback(() => {
  // 1. 获取 Canvas 上下文
  const ctx = canvas.getContext('2d');

  // 2. 设置画布尺寸（考虑 DPR 高清屏）
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  // 3. 清除画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 4. 应用视口变换
  ctx.scale(dpr, dpr);
  ctx.translate(viewport.x, viewport.y);
  ctx.scale(viewport.zoom, viewport.zoom);

  // 5. 按顺序绘制各层
  drawBackground();       // 背景色
  drawGrid();             // 网格线
  drawContinents();       // 大陆多边形
  drawRegions();          // 区域多边形
  drawLocations();        // 地点标记
  drawCurrentDrawing();   // 正在绘制的多边形预览
  drawEditHandles();      // 编辑模式顶点控制点

  // 6. 恢复变换
  ctx.restore();
}, [continents, regions, locations, viewport, drawing, ...]);
```

### 绘制层级（从底到顶）

```
第 1 层：背景色 (canvasBgColor)
第 2 层：网格线 (grid)
第 3 层：大陆多边形 (continents)
第 4 层：区域多边形 (regions)
第 5 层：地点标记 (locations)
第 6 层：绘制中的多边形预览
第 7 层：编辑模式顶点控制点
```

### 重绘触发时机

| 触发源 | 机制 |
|--------|------|
| 数据变化 | useEffect 监听 draw 函数的依赖变化 |
| 窗口缩放 | ResizeObserver 监听容器尺寸变化 |
| 鼠标移动 | setMousePos 触发状态更新 |
| 滚轮缩放 | setViewport 触发状态更新 |
| 定时器 | requestAnimationFrame 节流 ResizeObserver |

---

## 交互详解

### 1. 平移 (Pan)

```
按下鼠标 → 记录起始位置 → 拖拽时更新 viewport.x/y → 松开结束
```

```typescript
const handleMouseDown = (e) => {
  if (tool === 'pan') {
    setIsDragging(true);
    setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
  }
};

const handleMouseMove = (e) => {
  if (isDragging && tool === 'pan') {
    setViewport((v) => ({
      ...v,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  }
};
```

### 2. 缩放 (Zoom)

使用**指数缩放**实现平滑效果，以画布中心为缩放锚点：

```typescript
const handleWheel = (e) => {
  e.preventDefault();
  const delta = -e.deltaY * zoomSpeed;
  const factor = Math.exp(delta);  // 指数缩放
  setViewport((v) => ({
    ...v,
    zoom: Math.max(0.1, Math.min(10, v.zoom * factor))
  }));
};
```

缩放速度提供 5 档可调：极慢(0.002) / 慢速(0.005) / 正常(0.01) / 快速(0.02) / 极快(0.04)

### 3. 绘制多边形

#### 3.1 绘制流程

```
点击"绘制大陆" → 选择 draw-continent 模式
       │
       ▼
逐点击添加顶点 → 实时显示折线预览
       │
       ▼
闭合方式：
  ├─ 双击
  └─ 点击靠近第一个点（< 15px）
       │
       ▼
弹出对话框 → 填写名称/描述/地形 → 创建
```

#### 3.2 辅助操作

| 快捷键 | 作用 |
|--------|------|
| `Ctrl+Z` | 撤销最后一个点 |
| `Escape` | 取消绘制 |
| 双击 | 闭合多边形 |

#### 3.3 闭合检测

```typescript
// 当鼠标点击靠近第一个点（距离 < 15/zoom 像素）
const dist = Math.sqrt(dx * dx + dy * dy);
if (dist < 15 / viewport.zoom) {
  handleClosePolygon();  // 闭合
}
```

### 4. 选择 (Select)

点击时按优先级检测：

```
1. 检查是否点击在地点上（圆形检测）
2. 检查是否点击在大陆内部（isPointInPolygon）
3. 检查是否点击在区域内部（isPointInPolygon）
4. 都没选中 → 不做操作
```

### 5. 添加地点

```typescript
if (tool === 'add-location') {
  const name = prompt('地点名称:');
  if (name) {
    createLocation({
      regionId,
      name,
      type: 'city',
      position: worldPos,
      // ...
    });
  }
}
```

### 6. 编辑多边形

```
选中大陆/区域 → 点击"编辑形状"
       │
       ▼
顶点显示为红色圆点 → 拖拽顶点调整形状
       │
       ▼
点击"完成编辑" 或 切换回"选择"模式
```

### 7. 删除实体

```typescript
const handleDeleteSelected = () => {
  const message = selectedEntityType === 'continent'
    ? `确定要删除大陆"${entityName}"吗？下属的区域和地点也会被删除。`
    : selectedEntityType === 'region'
    ? `确定要删除区域"${entityName}"吗？下属的地点也会被删除。`
    : `确定要删除"${entityName}"吗？`;
  
  if (!confirm(message)) return;
  
  switch (selectedEntityType) {
    case 'continent': cascadeDeleteContinent(id); break;  // 级联删除
    case 'region':    cascadeDeleteRegion(id); break;     // 级联删除
    case 'location':  deleteLocation(id); break;
    // ...
  }
};
```

---

## 辅助函数

### 绘制类

| 函数 | 作用 |
|------|------|
| `drawGrid(ctx, width, height, viewport)` | 绘制背景网格线 |
| `drawPolygon(ctx, points, fillColor, strokeColor, lineWidth, label, fontSize, labelColor)` | 绘制填充多边形 + 中心标签 |
| `getCenter(points)` | 计算多边形几何中心（用于标签定位） |

### 几何计算类

| 函数 | 作用 |
|------|------|
| `isPointInPolygon(point, polygon)` | 射线法判断点是否在多边形内部 |
| `getTerrainColor(terrain)` | 地形类型 → 填充颜色映射 |
| `getTerrainLabel(terrain)` | 地形类型 → 显示标签映射 |
| `getCursor(tool)` | 工具模式 → 鼠标光标样式 |

---

## 工具栏 UI

```typescript
<div className="map-toolbar">
  <button className={tool === 'select' ? 'active' : ''}>👆 选择</button>
  <button className={tool === 'pan' ? 'active' : ''}>✋ 平移</button>
  <button className={tool === 'draw-continent' ? 'active' : ''}>🌍 绘制大陆</button>
  <button className={tool === 'draw-region' ? 'active' : ''}>🏔️ 绘制区域</button>
  <button className={tool === 'add-location' ? 'active' : ''}>📍 添加地点</button>
  
  {/* 选中实体后才显示 */}
  {selectedEntityType && selectedEntityId && (
    <>
      <button>✏️ 编辑形状</button>
      <button>🗑️ 删除</button>
    </>
  )}
  
  <button>🔄 重置</button>
  
  {/* 右侧控件 */}
  <input type="color" value={canvasBgColor} />    {/* 背景色 */}
  <span>缩放: {Math.round(viewport.zoom * 100)}%</span>
  <select value={zoomSpeed}>                       {/* 缩放速度 */}
    <option value="0.002">极慢</option>
    <option value="0.005">慢速</option>
    <option value="0.01">正常</option>
    <option value="0.02">快速</option>
    <option value="0.04">极快</option>
  </select>
</div>
```

---

## 对话框

### 创建大陆/区域对话框

```typescript
{showDialog && (
  <div className="map-dialog-overlay">
    <div className="map-dialog">
      <h3>{tool === 'draw-continent' ? '🌍 新建大陆' : '🏔️ 新建区域'}</h3>
      <input placeholder="名称 *" value={dialogData.name} />
      <textarea placeholder="描述" value={dialogData.description} />
      {tool === 'draw-region' && (
        <select value={dialogData.terrain}>
          <option value="plains">🌾 平原</option>
          <!-- ... 18 种地形 -->
        </select>
      )}
      <button onClick={handleDialogCancel}>取消</button>
      <button onClick={handleDialogSubmit} disabled={!dialogData.name.trim()}>创建</button>
    </div>
  </div>
)}
```

---

## 颜色配置

所有地图绘制颜色和全局主题变量由 `src/config/colors.ts` 统一管理：

```typescript
import { CanvasColors, TerrainColors, DEFAULT_TERRAIN_COLOR, Theme } from '../config/colors';
```

| 配置模块 | 作用 |
|---------|------|
| `Theme` | 全局主题变量（背景、文字、边框、强调色、尺寸） |
| `CanvasColors` | 大陆、区域、地点、绘制中多边形、编辑模式、遮罩、网格颜色 |
| `TerrainColors` | 18 种地形填充色 |
| `injectCSSVariables()` | 将 Theme 注入为 CSS custom properties |

修改颜色只需编辑 `src/config/colors.ts`，无需修改组件代码。

---

## 性能优化

| 优化点 | 实现方式 |
|--------|----------|
| 按需渲染 | 只在状态变化时重绘，不设置渲染循环 |
| Resize 节流 | 使用 ResizeObserver + requestAnimationFrame |
| 指数缩放 | `Math.exp(delta)` 避免缩放突变 |
| Canvas 尺寸限制 | DPR 上限设为 2，避免高分屏过度渲染 |
| 依赖精确控制 | useCallback 的依赖数组精确列出，避免不必要的重建 |
| 视口裁剪 | 只绘制可见区域的网格线 |

---

## 依赖关系

### 从 Store 导入

```typescript
const {
  continents,        // 大陆列表
  regions,           // 区域列表
  locations,         // 地点列表
  selectedEntityType,// 当前选中类型
  selectedEntityId,  // 当前选中 ID
  selectEntity,      // 选中实体
  createContinent,   // 创建大陆
  createRegion,      // 创建区域
  createLocation,    // 创建地点
  updateContinent,   // 更新大陆
  updateRegion,      // 更新区域
  cascadeDeleteContinent,  // 级联删除大陆
  cascadeDeleteRegion,     // 级联删除区域
  deleteLocation,    // 删除地点
  deleteFaction,     // 删除势力
  deleteEvent,       // 删除事件
  deleteCharacter,   // 删除角色
} = useWorldStore();
```

### 从 types 导入

```typescript
import type { Continent, Region, Location, TerrainType } from '../types';
```

### 从 colors 配置导入

```typescript
import { CanvasColors, TerrainColors, DEFAULT_TERRAIN_COLOR } from '../config/colors';
```

---

## 与其他组件的协作

```
App.tsx
  └── activeView === 'map' 时渲染
        │
        ▼
    MapView.tsx
        │
        ├─ 读取 Store 数据 (continents, regions, locations)
        ├─ 修改 Store 数据 (create/update/delete)
        ├─ 影响 PropertiesPanel（选中实体后右侧面板显示详情）
        └─ 影响 Sidebar（数据变化后侧边栏列表更新）
```

---

## 总结

MapView 是一个**自包含的 Canvas 地图编辑器**，核心设计思路：

1. **数据驱动渲染** — Store 数据变化 → 自动重绘
2. **工具模式切换** — 一个组件支持 6 种交互模式
3. **坐标变换系统** — viewport 状态统一管理平移缩放
4. **分层绘制** — 背景 → 网格 → 大陆 → 区域 → 地点 → 预览 → 控制点
5. **配置驱动颜色** — 所有颜色由 `src/config/colors.ts` 统一管理
