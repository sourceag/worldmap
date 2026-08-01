// ============================================
// App 主组件
// ============================================

import { useEffect, useState } from 'react';
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

function App() {
  const { world, activeView, saveToStorage, loadFromStorage } = useWorldStore();
  const [pluginsRegistered, setPluginsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useUndoRedo();

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
      }, 500); // 防抖 500ms
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
        <Sidebar />
        <main className="main-canvas">
          {renderView()}
        </main>
        <PropertiesPanel />
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
