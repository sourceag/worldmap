// ============================================
// Navbar 顶部导航栏
// ============================================

import { useWorldStore } from '../store/worldStore';
import '../App.css';

const tabs = [
  { id: 'map', label: '🗺️ 地图' },
  { id: 'timeline', label: '📅 时间线' },
  { id: 'relations', label: '🔗 关系图' },
  { id: 'consistency', label: '✅ 一致性' },
  { id: 'plugins', label: '🧩 插件' },
] as const;

export function Navbar() {
  const { world, activeView, setActiveView } = useWorldStore();

  return (
    <nav className="navbar">
      <div className="navbar-title">🔨 WorldForge</div>
      <div className="navbar-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`navbar-tab ${activeView === tab.id ? 'active' : ''}`}
            onClick={() => setActiveView(tab.id as typeof activeView)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {world && (
        <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {world.name}
        </div>
      )}
    </nav>
  );
}
