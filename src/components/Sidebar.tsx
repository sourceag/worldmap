// ============================================
// Sidebar 侧边栏
// ============================================

import { useState } from 'react';
import { useWorldStore } from '../store/worldStore';
import '../App.css';

// 可折叠的分区组件
function CollapsibleSection({
  title,
  count,
  collapsed,
  onToggle,
  children,
}: {
  title: string;
  count?: number;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            className={`sidebar-collapse-btn ${collapsed ? 'collapsed' : ''}`}
            onClick={onToggle}
            title={collapsed ? '展开' : '收起'}
          >
            ▼
          </button>
          <span>{title}{count !== undefined && ` (${count})`}</span>
        </div>
      </div>
      {!collapsed && children}
    </div>
  );
}

export function Sidebar({ style }: { style?: React.CSSProperties }) {
  const {
    world,
    continents,
    regions,
    locations,
    factions,
    events,
    characters,
    selectedEntityType,
    selectedEntityId,
    selectEntity,
  } = useWorldStore();

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!world) return null;

  return (
    <aside className="sidebar" style={style}>
      <div className="sidebar-header">世界结构</div>
      <div className="sidebar-content">
        {/* Continents & Regions (嵌套显示) */}
        <CollapsibleSection
          title="大陆"
          count={continents.length}
          collapsed={!!collapsedSections.continents}
          onToggle={() => toggleSection('continents')}
        >
          {continents.map((c) => {
            const continentRegions = regions.filter(r => r.continentId === c.id);
            return (
              <div key={c.id}>
                <div
                  className={`sidebar-item ${selectedEntityType === 'continent' && selectedEntityId === c.id ? 'selected' : ''}`}
                  onClick={() => selectEntity('continent', c.id)}
                >
                  <span className="sidebar-item-icon">🌍</span>
                  {c.name}
                  {continentRegions.length > 0 && (
                    <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.5 }}>
                      {continentRegions.length}
                    </span>
                  )}
                </div>
                {/* 嵌套显示该大陆下的区域 */}
                {continentRegions.map((r) => (
                  <div
                    key={r.id}
                    className={`sidebar-item sidebar-item-nested ${selectedEntityType === 'region' && selectedEntityId === r.id ? 'selected' : ''}`}
                    onClick={() => selectEntity('region', r.id)}
                  >
                    <span className="sidebar-item-icon">🏔️</span>
                    {r.name}
                  </div>
                ))}
              </div>
            );
          })}
        </CollapsibleSection>

        {/* 未分配大陆的区域 */}
        {regions.filter(r => !r.continentId || !continents.find(c => c.id === r.continentId)).length > 0 && (
          <CollapsibleSection
            title="未分配区域"
            collapsed={!!collapsedSections.unassignedRegions}
            onToggle={() => toggleSection('unassignedRegions')}
          >
            {regions.filter(r => !r.continentId || !continents.find(c => c.id === r.continentId)).map((r) => (
              <div
                key={r.id}
                className={`sidebar-item ${selectedEntityType === 'region' && selectedEntityId === r.id ? 'selected' : ''}`}
                onClick={() => selectEntity('region', r.id)}
              >
                <span className="sidebar-item-icon">🏔️</span>
                {r.name}
              </div>
            ))}
          </CollapsibleSection>
        )}

        {/* Locations */}
        <CollapsibleSection
          title="地点"
          count={locations.length}
          collapsed={!!collapsedSections.locations}
          onToggle={() => toggleSection('locations')}
        >
          {locations.map((l) => (
            <div
              key={l.id}
              className={`sidebar-item ${selectedEntityType === 'location' && selectedEntityId === l.id ? 'selected' : ''}`}
              onClick={() => selectEntity('location', l.id)}
            >
              <span className="sidebar-item-icon">📍</span>
              {l.name}
            </div>
          ))}
        </CollapsibleSection>

        {/* Factions */}
        <CollapsibleSection
          title="势力"
          count={factions.length}
          collapsed={!!collapsedSections.factions}
          onToggle={() => toggleSection('factions')}
        >
          {factions.map((f) => (
            <div
              key={f.id}
              className={`sidebar-item ${selectedEntityType === 'faction' && selectedEntityId === f.id ? 'selected' : ''}`}
              onClick={() => selectEntity('faction', f.id)}
            >
              <span className="sidebar-item-icon">⚔️</span>
              {f.name}
            </div>
          ))}
        </CollapsibleSection>

        {/* Events */}
        <CollapsibleSection
          title="事件"
          count={events.length}
          collapsed={!!collapsedSections.events}
          onToggle={() => toggleSection('events')}
        >
          {events.map((e) => (
            <div
              key={e.id}
              className={`sidebar-item ${selectedEntityType === 'event' && selectedEntityId === e.id ? 'selected' : ''}`}
              onClick={() => selectEntity('event', e.id)}
            >
              <span className="sidebar-item-icon">📜</span>
              {e.name}
            </div>
          ))}
        </CollapsibleSection>

        {/* Characters */}
        <CollapsibleSection
          title="人物"
          count={characters.length}
          collapsed={!!collapsedSections.characters}
          onToggle={() => toggleSection('characters')}
        >
          {characters.map((c) => (
            <div
              key={c.id}
              className={`sidebar-item ${selectedEntityType === 'character' && selectedEntityId === c.id ? 'selected' : ''}`}
              onClick={() => selectEntity('character', c.id)}
            >
              <span className="sidebar-item-icon">👤</span>
              {c.name}
            </div>
          ))}
        </CollapsibleSection>
      </div>
    </aside>
  );
}
