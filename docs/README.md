# WorldForge 模块架构文档

本文档按模块拆分，每个文件对应一个功能模块的详细架构说明。

---

## 文档索引

| 文件 | 模块 | 说明 |
|---|---|---|
| [modules/types.md](modules/types.md) | 类型系统 | 所有 TypeScript 接口和类型定义 |
| [modules/core.md](modules/core.md) | 核心层 | EventBus、History、PluginManager、Storage、WFFile、API |
| [modules/store.md](modules/store.md) | 状态管理 | Zustand Store、CRUD、级联删除、持久化 |
| [modules/plugins.md](modules/plugins.md) | 插件系统 | 导出器、导入器、Obsidian 同步 |
| [modules/hooks.md](modules/hooks.md) | React Hooks | 撤销/重做快捷键绑定 |
| [modules/utils.md](modules/utils.md) | 工具函数 | ID 生成、文件下载 |
| [modules/components.md](modules/components.md) | UI 组件 | App、MapView、Sidebar 等所有组件 |

---

## 架构总览

```
┌─────────────────────────────────────────────────────────┐
│                      UI Layer                           │
│  ┌─────────┐ ┌──────────┐ ┌────────────┐               │
│  │ Navbar  │ │ Sidebar  │ │ Properties │               │
│  └─────────┘ └──────────┘ └────────────┘               │
│  ┌──────────────────────────────────────┐               │
│  │         View (Map/Timeline/...)      │               │
│  └──────────────────────────────────────┘               │
├─────────────────────────────────────────────────────────┤
│                    Hooks Layer                          │
│  ┌──────────────────┐ ┌───────────────────────┐        │
│  │  useUndoRedo     │ │  React Zustand Hooks  │        │
│  └──────────────────┘ └───────────────────────┘        │
├─────────────────────────────────────────────────────────┤
│                    Store Layer                          │
│  ┌────────────────────────────────────────────┐        │
│  │           useWorldStore (Zustand)          │        │
│  │  - 所有实体 CRUD                            │        │
│  │  - 历史记录追踪                            │        │
│  │  - 持久化触发                              │        │
│  └────────────────────────────────────────────┘        │
├─────────────────────────────────────────────────────────┤
│                    Core Layer                           │
│  ┌────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐  │
│  │ Event  │ │ History  │ │ Plugin    │ │ Storage  │  │
│  │ Bus    │ │ Manager  │ │ Manager   │ │ (IndexedDB)│ │
│  └────────┘ └──────────┘ └───────────┘ └──────────┘  │
│  ┌──────────────────┐ ┌──────────────────────┐        │
│  │  WorldForgeAPI   │ │  WFFile (导入导出)    │        │
│  └──────────────────┘ └──────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

---

## 数据流

### 用户操作 → 数据更新

```
用户点击/绘制
    ↓
MapView.handleMouseDown / handleMouseMove
    ↓
screenToWorld() 坐标转换
    ↓
调用 Store 方法 (createContinent/updateRegion/...)
    ↓
Store 内部:
  1. createSnapshot() → 保存 before 状态
  2. set() → 更新状态
  3. _pushHistory() → 记录到 HistoryManager
  4. emitEntityEvent() → 触发插件事件
    ↓
App 层 useEffect 检测到状态变化
    ↓
防抖 500ms → saveToStorage() → IndexedDB
```

### 撤销/重做流

```
Ctrl+Z → useUndoRedo hook
    ↓
historyManager.undo()
    ↓
返回 before 快照
    ↓
Store.setState(restoreSnapshot(before))
    ↓
触发重绘
```

---

*最后更新: 2026-08-01 | 版本: WorldForge v0.1.0*
