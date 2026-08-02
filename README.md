<div align="center">

# 🌍 WorldForge

**世界观构建工作台 — 为游戏玩家、小说创作者和同人创作者打造的交互式地图编辑器**

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/yourusername/worldforge)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)

[English](./docs/en/README.md) · [中文](./docs/zh/README.md)

</div>

---

## 📖 简介

WorldForge 是一个用于构建虚构世界观的交互式工具。你可以在画布上绘制大陆和区域、标注地点、建立时间线，并将所有元素组织成一个完整的世界观。

无论是 TRPG 跑团、小说写作还是同人创作，WorldForge 都能帮助你直观地构建和管理你的世界。

---

## ✨ 核心功能

### 🗺️ 地图绘制
- **多边形绘制** — 自由绘制大陆和区域轮廓
- **地点标记** — 在地图上标注城市、要塞、遗迹等地点
- **平移缩放** — 支持鼠标拖拽平移、滚轮缩放
- **编辑模式** — 拖拽顶点调整形状

### 📅 时间线
- **事件系统** — 为区域添加历史事件
- **时间排序** — 按年份自动排列事件
- **区域关联** — 每个事件关联到具体区域

### 🎨 视觉系统
- **地形着色** — 18 种地形类型，自动填充对应颜色
- **主题配置** — 统一的颜色配置文件，易于定制
- **深色主题** — 护眼的深色界面

### 💾 数据管理
- **本地存储** — 数据自动保存到 IndexedDB
- **撤销/重做** — 完整的操作历史记录
- **导入导出** — 支持 JSON 格式备份与恢复

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/yourusername/worldforge.git
cd worldforge

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开浏览器访问 `http://localhost:5173` 即可开始使用。

### 生产构建

```bash
npm run build
```

构建产物在 `dist/` 目录下。

---

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| React 18 + TypeScript | UI 框架 |
| Vite | 构建工具 |
| Zustand | 状态管理 |
| Canvas 2D | 地图渲染 |
| IndexedDB | 本地持久化 |
| idb | IndexedDB 封装 |

---

## 📁 项目结构

```
worldforge/
├── src/
│   ├── components/       # UI 组件
│   │   ├── MapView.tsx       # 地图视图（核心）
│   │   ├── Sidebar.tsx       # 侧边栏
│   │   ├── PropertiesPanel.tsx # 属性面板
│   │   ├── TimelineView.tsx  # 时间线视图
│   │   └── Navbar.tsx        # 顶部导航
│   ├── store/            # 状态管理
│   │   └── worldStore.ts     # Zustand Store
│   ├── types/            # TypeScript 类型定义
│   │   └── index.ts
│   ├── config/           # 配置文件
│   │   └── colors.ts         # 颜色主题配置
│   ├── core/             # 核心模块
│   │   ├── History.ts        # 撤销/重做
│   │   ├── Storage.ts        # 持久化
│   │   └── ...
│   └── hooks/            # React Hooks
│       └── useUndoRedo.ts
├── docs/                 # 文档
│   ├── modules/              # 模块架构文档
│   └── DESIGN.md             # 设计文档
├── package.json
└── vite.config.ts
```

---

## 🏗️ 架构概览

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
└─────────────────────────────────────────────────────────┘
```

---

## 📚 文档

| 文档 | 说明 |
|------|------|
| [设计文档](docs/DESIGN.md) | 整体设计思路与交互规范 |
| [模块文档](docs/modules/) | 各模块详细架构说明 |
| [类型系统](docs/modules/types.md) | 所有 TypeScript 类型定义 |
| [状态管理](docs/modules/store.md) | Store 设计与数据流 |
| [组件文档](docs/modules/components/) | UI 组件详解 |

---

## 🗺️ 路线图

- [x] 地图绘制（大陆、区域、地点）
- [x] 时间线与事件系统
- [x] 撤销/重做
- [x] 本地持久化
- [x] 主题颜色配置
- [ ] 关系图谱视图
- [ ] 一致性检查
- [ ] 插件系统
- [ ] 多世界支持
- [ ] 协作编辑

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目基于 [MIT](LICENSE) 许可证开源。

---

## 🙏 致谢

- 所有使用并反馈的用户
- 开源社区的优秀项目

---

<div align="center">

⭐ 如果这个项目对你有帮助，请给一个 Star！

</div>
