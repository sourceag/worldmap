// ============================================
// PropertiesPanel 属性面板
// ============================================

import { useWorldStore } from '../store/worldStore';
import '../App.css';

export function PropertiesPanel({ style }: { style?: React.CSSProperties }) {
  const {
    selectedEntityType,
    selectedEntityId,
    continents,
    regions,
    locations,
    factions,
    events,
    characters,
    updateContinent,
    updateRegion,
    updateLocation,
    updateFaction,
    updateEvent,
    updateCharacter,
    cascadeDeleteContinent,
    cascadeDeleteRegion,
    deleteLocation,
    deleteFaction,
    deleteEvent,
    deleteCharacter,
  } = useWorldStore();

  // These are used in handleDelete
  void cascadeDeleteContinent;
  void cascadeDeleteRegion;
  void deleteLocation;
  void deleteFaction;
  void deleteEvent;
  void deleteCharacter;

  const handleDelete = () => {
    if (!selectedEntityType || !selectedEntityId) return;
    
    const entityName = getEntityName(selectedEntityType, selectedEntityId);
    const message = selectedEntityType === 'continent'
      ? `确定要删除大陆"${entityName}"吗？下属的区域和地点也会被删除。`
      : selectedEntityType === 'region'
      ? `确定要删除区域"${entityName}"吗？下属的地点也会被删除。`
      : `确定要删除${getEntityTypeName(selectedEntityType)}"${entityName}"吗？`;

    if (!confirm(message)) return;

    switch (selectedEntityType) {
      case 'continent':
        cascadeDeleteContinent(selectedEntityId);
        break;
      case 'region':
        cascadeDeleteRegion(selectedEntityId);
        break;
      case 'location':
        deleteLocation(selectedEntityId);
        break;
      case 'faction':
        deleteFaction(selectedEntityId);
        break;
      case 'event':
        deleteEvent(selectedEntityId);
        break;
      case 'character':
        deleteCharacter(selectedEntityId);
        break;
    }
  };

  const getEntityName = (type: string, id: string): string => {
    const entity = useWorldStore.getState().getEntityById(type, id);
    return (entity as { name?: string })?.name || '(未知)';
  };

  const getEntityTypeName = (type: string): string => {
    const names: Record<string, string> = {
      continent: '大陆',
      region: '区域',
      location: '地点',
      route: '路线',
      era: '纪元',
      age: '时代',
      event: '事件',
      faction: '势力',
      character: '人物',
    };
    return names[type] || type;
  };

  if (!selectedEntityType || !selectedEntityId) {
    return (
      <aside className="properties-panel" style={style}>
        <div className="properties-panel-header">属性</div>
        <div className="properties-panel-content">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">选择一个实体查看属性</div>
          </div>
        </div>
      </aside>
    );
  }

  const renderProperties = () => {
    switch (selectedEntityType) {
      case 'continent': {
        const continent = continents.find((c) => c.id === selectedEntityId);
        if (!continent) return null;
        return (
          <div>
            <div className="form-group">
              <label className="form-label">名称</label>
              <input
                className="form-input"
                value={continent.name}
                onChange={(e) => updateContinent(continent.id, { name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">描述</label>
              <textarea
                className="form-input form-textarea"
                value={continent.description}
                onChange={(e) => updateContinent(continent.id, { description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">气候</label>
              <input
                className="form-input"
                value={continent.climate || ''}
                onChange={(e) => updateContinent(continent.id, { climate: e.target.value })}
                placeholder="如：温带、热带..."
              />
            </div>
            <button className="btn btn-danger" onClick={handleDelete}>
              删除大陆
            </button>
          </div>
        );
      }
      case 'region': {
        const region = regions.find((r) => r.id === selectedEntityId);
        if (!region) return null;
        return (
          <div>
            <div className="form-group">
              <label className="form-label">名称</label>
              <input
                className="form-input"
                value={region.name}
                onChange={(e) => updateRegion(region.id, { name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">描述</label>
              <textarea
                className="form-input form-textarea"
                value={region.description}
                onChange={(e) => updateRegion(region.id, { description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">地形</label>
              <select
                className="form-input"
                value={region.terrain}
                onChange={(e) => updateRegion(region.id, { terrain: e.target.value as any })}
              >
                <option value="plains">🌾 平原</option>
                <option value="mountains">⛰️ 山脉</option>
                <option value="forest">🌲 森林</option>
                <option value="desert">🏜️ 沙漠</option>
                <option value="ocean">🌊 海洋</option>
                <option value="swamp">🌿 沼泽</option>
                <option value="tundra">❄️ 冻原</option>
                <option value="hills">⛰️ 丘陵</option>
                <option value="jungle">🌴 丛林</option>
                <option value="wasteland">🪨 荒地</option>
                <option value="basin">🥣 盆地</option>
                <option value="plateau">🏔️ 高原</option>
                <option value="valley">🏞️ 山谷</option>
                <option value="canyon">🪨 峡谷</option>
                <option value="coast">🏖️ 海岸</option>
                <option value="volcano">🌋 火山</option>
                <option value="glacier">🧊 冰川</option>
                <option value="oasis">💧 绿洲</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">资源（逗号分隔）</label>
              <input
                className="form-input"
                value={region.resources.join(', ')}
                onChange={(e) => updateRegion(region.id, { resources: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              />
            </div>
            <button className="btn btn-danger" onClick={handleDelete}>
              删除区域
            </button>
          </div>
        );
      }
      case 'location': {
        const location = locations.find((l) => l.id === selectedEntityId);
        if (!location) return null;
        return (
          <div>
            <div className="form-group">
              <label className="form-label">名称</label>
              <input
                className="form-input"
                value={location.name}
                onChange={(e) => updateLocation(location.id, { name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">类型</label>
              <select
                className="form-input"
                value={location.type}
                onChange={(e) => updateLocation(location.id, { type: e.target.value as any })}
              >
                <option value="city">城市</option>
                <option value="town">城镇</option>
                <option value="village">村庄</option>
                <option value="fortress">要塞</option>
                <option value="ruins">遗迹</option>
                <option value="landmark">地标</option>
                <option value="port">港口</option>
                <option value="temple">神庙</option>
                <option value="dungeon">地牢</option>
                <option value="capital">首都</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">描述</label>
              <textarea
                className="form-input form-textarea"
                value={location.description}
                onChange={(e) => updateLocation(location.id, { description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">人口</label>
              <input
                className="form-input"
                type="number"
                value={location.population || ''}
                onChange={(e) => updateLocation(location.id, { population: parseInt(e.target.value) || undefined })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">别名</label>
              <input
                className="form-input"
                value={location.aliases.join(', ')}
                onChange={(e) => updateLocation(location.id, { aliases: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              />
            </div>
            <button className="btn btn-danger" onClick={handleDelete}>
              删除地点
            </button>
          </div>
        );
      }
      case 'faction': {
        const faction = factions.find((f) => f.id === selectedEntityId);
        if (!faction) return null;
        return (
          <div>
            <div className="form-group">
              <label className="form-label">名称</label>
              <input
                className="form-input"
                value={faction.name}
                onChange={(e) => updateFaction(faction.id, { name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">类型</label>
              <select
                className="form-input"
                value={faction.type}
                onChange={(e) => updateFaction(faction.id, { type: e.target.value as any })}
              >
                <option value="nation">国家</option>
                <option value="empire">帝国</option>
                <option value="kingdom">王国</option>
                <option value="tribe">部落</option>
                <option value="guild">行会</option>
                <option value="religion">宗教</option>
                <option value="order">教团</option>
                <option value="syndicate">财团</option>
                <option value="rebellion">起义军</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">描述</label>
              <textarea
                className="form-input form-textarea"
                value={faction.description}
                onChange={(e) => updateFaction(faction.id, { description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">意识形态</label>
              <input
                className="form-input"
                value={faction.ideology || ''}
                onChange={(e) => updateFaction(faction.id, { ideology: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">经济水平 (1-10)</label>
              <input
                className="form-input"
                type="number"
                min="1"
                max="10"
                value={faction.economyLevel}
                onChange={(e) => updateFaction(faction.id, { economyLevel: parseInt(e.target.value) || 5 })}
              />
            </div>
            <button className="btn btn-danger" onClick={handleDelete}>
              删除势力
            </button>
          </div>
        );
      }
      case 'event': {
        const event = events.find((e) => e.id === selectedEntityId);
        if (!event) return null;
        return (
          <div>
            <div className="form-group">
              <label className="form-label">名称</label>
              <input
                className="form-input"
                value={event.name}
                onChange={(e) => updateEvent(event.id, { name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">类型</label>
              <select
                className="form-input"
                value={event.type}
                onChange={(e) => updateEvent(event.id, { type: e.target.value as any })}
              >
                <option value="war">战争</option>
                <option value="disaster">灾难</option>
                <option value="discovery">发现</option>
                <option value="founding">建立</option>
                <option value="death">死亡</option>
                <option value="birth">诞生</option>
                <option value="treaty">条约</option>
                <option value="revolution">革命</option>
                <option value="migration">迁徙</option>
                <option value="cataclysm">大灾变</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">描述</label>
              <textarea
                className="form-input form-textarea"
                value={event.description}
                onChange={(e) => updateEvent(event.id, { description: e.target.value })}
              />
            </div>
            <button className="btn btn-danger" onClick={handleDelete}>
              删除事件
            </button>
          </div>
        );
      }
      case 'character': {
        const character = characters.find((c) => c.id === selectedEntityId);
        if (!character) return null;
        return (
          <div>
            <div className="form-group">
              <label className="form-label">姓名</label>
              <input
                className="form-input"
                value={character.name}
                onChange={(e) => updateCharacter(character.id, { name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">称号</label>
              <input
                className="form-input"
                value={character.titles.join(', ')}
                onChange={(e) => updateCharacter(character.id, { titles: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">描述</label>
              <textarea
                className="form-input form-textarea"
                value={character.description}
                onChange={(e) => updateCharacter(character.id, { description: e.target.value })}
              />
            </div>
            <button className="btn btn-danger" onClick={handleDelete}>
              删除人物
            </button>
          </div>
        );
      }
      default:
        return <div>未知实体类型</div>;
    }
  };

  return (
    <aside className="properties-panel" style={style}>
      <div className="properties-panel-header">
        {selectedEntityType ? `${selectedEntityType}` : '属性'}
      </div>
      <div className="properties-panel-content">
        {renderProperties()}
      </div>
    </aside>
  );
}
