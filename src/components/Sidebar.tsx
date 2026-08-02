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
  onAdd,
  children,
}: {
  title: string;
  count?: number;
  collapsed: boolean;
  onToggle: () => void;
  onAdd?: () => void;
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
        {onAdd && (
          <button onClick={onAdd} title={`添加${title}`}>+</button>
        )}
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
    createContinent,
    createRegion,
    createLocation,
    createFaction,
    createEvent,
    createCharacter,
  } = useWorldStore();

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!world) return null;

  const handleCreateContinent = () => {
    const name = prompt('大陆名称:');
    if (name) {
      createContinent({
        name,
        description: '',
        bounds: { points: [] },
        climate: '',
      });
    }
  };

  const handleCreateRegion = () => {
    const name = prompt('区域名称:');
    if (name && continents.length > 0) {
      createRegion({
        continentId: continents[0].id,
        name,
        description: '',
        bounds: { points: [] },
        terrain: 'plains',
        resources: [],
      });
    }
  };

  const handleCreateLocation = () => {
    const name = prompt('地点名称:');
    if (name && regions.length > 0) {
      createLocation({
        regionId: regions[0].id,
        name,
        aliases: [],
        type: 'city',
        position: { x: 200, y: 200 },
        description: '',
        notableSites: [],
        resources: [],
      });
    }
  };

  const handleCreateFaction = () => {
    const name = prompt('势力名称:');
    if (name) {
      createFaction({
        name,
        type: 'nation',
        controlledRegions: [],
        economyLevel: 5,
        description: '',
      });
    }
  };

  const handleCreateEvent = () => {
    const name = prompt('事件名称:');
    if (name) {
      createEvent({
        name,
        type: 'other',
        ageId: '',
        startDate: { year: 0, displayString: '元年' },
        description: '',
        participants: [],
        causes: [],
        effects: [],
      });
    }
  };

  const handleCreateCharacter = () => {
    const name = prompt('人物姓名:');
    if (name) {
      createCharacter({
        name,
        titles: [],
        description: '',
        relationships: [],
        events: [],
      });
    }
  };

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
          onAdd={handleCreateContinent}
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
          onAdd={handleCreateLocation}
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
          onAdd={handleCreateFaction}
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
          onAdd={handleCreateEvent}
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
          onAdd={handleCreateCharacter}
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
