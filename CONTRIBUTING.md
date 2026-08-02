# 贡献指南

感谢你对本项目的兴趣！以下是参与贡献的指南。

---

## 开发流程

### 1. 准备工作

```bash
# Fork 仓库后克隆到本地
git clone https://github.com/YOUR_USERNAME/worldforge.git
cd worldforge

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 2. 创建分支

```bash
# 从 main 创建新分支
git checkout -b feature/your-feature-name

# 或修复 bug
git checkout -b fix/your-bug-fix
```

分支命名规范：
- `feature/xxx` — 新功能
- `fix/xxx` — Bug 修复
- `docs/xxx` — 文档更新
- `refactor/xxx` — 代码重构

### 3. 开发规范

#### 代码风格

- 使用 TypeScript，避免 `any` 类型
- 使用命名导出：`export const MyComponent = () => { ... }`
- 函数和变量使用 camelCase
- 组件和类型使用 PascalCase
- 文件名使用 PascalCase（组件）或 camelCase（工具）

#### 提交规范

提交信息格式：`<type>: <description>`

| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `refactor` | 代码重构 |
| `style` | 代码格式调整 |
| `test` | 测试相关 |
| `chore` | 构建/工具变更 |

示例：
```
feat: 添加区域事件时间线视图
fix: 修复多边形自相交导致的镂空问题
docs: 更新 README 添加架构图
```

### 4. 提交前检查

```bash
# 确保构建通过
npm run build

# 确保没有 TypeScript 错误
npx tsc --noEmit
```

### 5. 提交 PR

1. 推送分支到你的 Fork
2. 在 GitHub 上创建 Pull Request
3. 填写 PR 模板（描述变更、测试方式、截图）
4. 等待维护者审核

---

## 项目结构

```
src/
├── components/       # UI 组件
├── store/            # Zustand 状态管理
├── types/            # TypeScript 类型定义
├── config/           # 配置文件（颜色、常量）
├── core/             # 核心逻辑（History、Storage、Plugin）
└── hooks/            # React Hooks
```

---

## 文档

- 重大变更请同步更新 `docs/` 下的文档
- 新增模块请在 `docs/modules/` 下添加对应说明
- 设计决策请在 `docs/DESIGN.md` 中记录

---

## 行为准则

参与本项目即表示遵守 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)。

---

## 问题咨询

如有疑问，请通过 Issue 或 Discussion 提出。
