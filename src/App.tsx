// ============================================
// App 主组件
// ============================================

import { useEffect, useState } from 'react';
import { useWorldStore } from './store/worldStore';
import { registerBuiltInPlugins } from './plugins';
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
  const { world, activeView } = useWorldStore();
  const [pluginsRegistered, setPluginsRegistered] = useState(false);

  useEffect(() => {
    if (!pluginsRegistered) {
      registerBuiltInPlugins();
      setPluginsRegistered(true);
    }
  }, [pluginsRegistered]);

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
    </div>
  );
}

export default App;
