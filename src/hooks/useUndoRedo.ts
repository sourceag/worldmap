// ============================================
// 撤销/重做快捷键 Hook
// ============================================

import { useEffect, useState, useCallback } from 'react';
import { useWorldStore } from '../store/worldStore';
import { historyManager } from '../core/History';

interface UndoRedoState {
  canUndo: boolean;
  canRedo: boolean;
  undoDescription: string | null;
  redoDescription: string | null;
}

export function useUndoRedo() {
  const { undo, redo } = useWorldStore();
  const [state, setState] = useState<UndoRedoState>({
    canUndo: false,
    canRedo: false,
    undoDescription: null,
    redoDescription: null,
  });
  const [toast, setToast] = useState<string | null>(null);

  // Update state from history manager
  const updateState = useCallback(() => {
    setState({
      canUndo: historyManager.canUndo(),
      canRedo: historyManager.canRedo(),
      undoDescription: historyManager.getUndoDescription(),
      redoDescription: historyManager.getRedoDescription(),
    });
  }, []);

  // Subscribe to history changes
  useEffect(() => {
    updateState();
    const unsubscribe = historyManager.subscribe(updateState);
    return unsubscribe;
  }, [updateState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (historyManager.canUndo()) {
          undo();
          const desc = historyManager.getRedoDescription(); // After undo, the undone action becomes redo
          setToast(`↩️ 撤销: ${desc || '上一步操作'}`);
        }
      }
      // Ctrl+Shift+Z or Ctrl+Y: Redo
      if (((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        if (historyManager.canRedo()) {
          redo();
          const desc = historyManager.getUndoDescription(); // After redo, the redone action becomes undo
          setToast(`↪️ 重做: ${desc || '下一步操作'}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Clear toast after delay
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return { ...state, toast };
}
