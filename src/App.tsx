// ============================================
// App 主组件
// ============================================

import { useEffect, useState, useCallback, useRef } from 'react';
import { useWorldStore } from './store/worldStore';
import { registerBuiltInPlugins } from './plugins';
import { useUndoRedo } from './hooks/useUndoRedo';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MapView } from './components/MapView';
import { TimelineView } from './components/TimelineView';
import { RelationsView } from './components/RelationsView';
import { ConsistencyView } from './components/ConsistencyView';
import { PluginsView } from './components/PluginsView';
import { PropertiesPanel } from './components/PropertiesPanel';
import { WelcomeScreen } from './components/WelcomeScreen';
import './App.css';

// 面板最小宽度常量
const MIN_SIDEBAR_WIDTH = 180;
const MIN_PROPERTIES_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 500;
const MAX_PROPERTIES_WIDTH = 600;

function App() {
  const { world, activeView, saveToStorage, loadFromStorage } = useWorldStore();
  const [pluginsRegistered, setPluginsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useUndoRedo();

  // 面板宽度状态
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [propertiesWidth, setPropertiesWidth] = useState(320);

  // 拖拽状态（使用 ref 避免频繁渲染）
  const dragRef = useRef<{
    type: 'sidebar' | 'properties';
    startX: number;
    startWidth: number;
  } | null>(null);

  // 启动时加载数据
  useEffect(() => {
    const init = async () => {
      await loadFromStorage();
      setIsLoading(false);
    };
    init();
  }, []);

  // 注册插件
  useEffect(() => {
    if (!pluginsRegistered) {
      registerBuiltInPlugins();
      setPluginsRegistered(true);
    }
  }, [pluginsRegistered]);

  // 数据变化时自动保存
  useEffect(() => {
    if (world) {
      const timeoutId = setTimeout(() => {
        saveToStorage();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [
    world,
    useWorldStore.getState().continents,
    useWorldStore.getState().regions,
    useWorldStore.getState().locations,
    useWorldStore.getState().routes,
    useWorldStore.getState().eras,
    useWorldStore.getState().ages,
    useWorldStore.getState().events,
    useWorldStore.getState().factions,
    useWorldStore.getState().characters,
    saveToStorage,
  ]);

  // 拖拽处理
  const handleMouseDown = useCallback((type: 'sidebar' | 'properties') => (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = {
      type,
      startX: e.clientX,
      startWidth: type === 'sidebar' ? sidebarWidth : propertiesWidth,
    };
  }, [sidebarWidth, propertiesWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;

      const { type, startX, startWidth } = dragRef.current;
      const delta = e.clientX - startX;

      if (type === 'sidebar') {
        const newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, startWidth + delta));
        setSidebarWidth(newWidth);
      } else {
        const newWidth = Math.max(MIN_PROPERTIES_WIDTH, Math.min(MAX_PROPERTIES_WIDTH, startWidth - delta));
        setPropertiesWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      dragRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (isLoading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
      }}>
        加载中...
      </div>
    );
  }

  if (!world) {
    return <WelcomeScreen />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'map':
        return <MapView />;
      case 'timeline':
        return <TimelineView />;
      case 'relations':
        return <RelationsView />;
      case 'consistency':
        return <ConsistencyView />;
      case 'plugins':
        return <PluginsView />;
      default:
        return <MapView />;
    }
  };

  return (
    <div className="app">
      <Navbar />
      <div className="app-body">
        <Sidebar style={{ width: sidebarWidth }} />
        <div
          className="resize-handle resize-handle-sidebar"
          onMouseDown={handleMouseDown('sidebar')}
        />
        <main className="main-canvas">
          {renderView()}
        </main>
        <div
          className="resize-handle resize-handle-properties"
          onMouseDown={handleMouseDown('properties')}
        />
        <PropertiesPanel style={{ width: propertiesWidth }} />
      </div>
      {toast && (
        <div className="undo-toast">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
