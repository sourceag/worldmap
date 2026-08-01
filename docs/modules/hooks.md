# React Hooks (hooks/)

---

## useUndoRedo.ts — 撤销/重做快捷键

**文件**: `src/hooks/useUndoRedo.ts` (80 行)

全局撤销/重做快捷键绑定，订阅 HistoryManager 变化。

```typescript
export function useUndoRedo(): {
  canUndo: boolean;
  canRedo: boolean;
  undoDescription: string | null;
  redoDescription: string | null;
  toast: string | null;
}
```

### 键盘快捷键

| 快捷键 | 功能 |
|---|---|
| Ctrl+Z | 撤销上一步操作 |
| Ctrl+Shift+Z | 重做 |
| Ctrl+Y | 重做（备选） |

### 实现逻辑

```typescript
// 订阅 HistoryManager 变化
useEffect(() => {
  const unsubscribe = historyManager.subscribe(updateState);
  return unsubscribe;
}, []);

// 键盘事件处理
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      if (historyManager.canUndo()) {
        undo();
        setToast(`↩️ 撤销: ${description}`);
      }
    }
    // ... Ctrl+Shift+Z / Ctrl+Y 类似
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [undo, redo]);

// Toast 自动消失
useEffect(() => {
  if (toast) {
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }
}, [toast]);
```

### 使用位置

`App.tsx` — 渲染 Toast 提示。

---

## 与其他模块的交互

```
useUndoRedo
    ↓ 订阅
HistoryManager (core/History.ts)
    ↓ undo/redo 返回快照
useWorldStore (store/worldStore.ts)
    ↓ set(restoreSnapshot(snapshot))
React 重绘
```
