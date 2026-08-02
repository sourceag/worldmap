// ============================================
// Sidebar 侧边栏
// ============================================

import { useWorldStore } from '../store/worldStore';
import '../App.css';

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
        {/* Continents */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">
            <span>大陆 ({continents.length})</span>
            <button onClick={handleCreateContinent} title="添加大陆">+</button>
          </div>
          {continents.map((c) => (
            <div
              key={c.id}
              className={`sidebar-item ${selectedEntityType === 'continent' && selectedEntityId === c.id ? 'selected' : ''}`}
              onClick={() => selectEntity('continent', c.id)}
            >
              <span className="sidebar-item-icon">🌍</span>
              {c.name}
            </div>
          ))}
        </div>

        {/* Regions */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">
            <span>区域 ({regions.length})</span>
            <button onClick={handleCreateRegion} title="添加区域">+</button>
          </div>
          {regions.map((r) => (
            <div
              key={r.id}
              className={`sidebar-item ${selectedEntityType === 'region' && selectedEntityId === r.id ? 'selected' : ''}`}
              onClick={() => selectEntity('region', r.id)}
            >
              <span className="sidebar-item-icon">🏔️</span>
              {r.name}
            </div>
          ))}
        </div>

        {/* Locations */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">
            <span>地点 ({locations.length})</span>
            <button onClick={handleCreateLocation} title="添加地点">+</button>
          </div>
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
        </div>

        {/* Factions */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">
            <span>势力 ({factions.length})</span>
            <button onClick={handleCreateFaction} title="添加势力">+</button>
          </div>
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
        </div>

        {/* Events */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">
            <span>事件 ({events.length})</span>
            <button onClick={handleCreateEvent} title="添加事件">+</button>
          </div>
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
        </div>

        {/* Characters */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">
            <span>人物 ({characters.length})</span>
            <button onClick={handleCreateCharacter} title="添加人物">+</button>
          </div>
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
        </div>
      </div>
    </aside>
  );
}
