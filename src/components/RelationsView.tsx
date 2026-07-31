// ============================================
// RelationsView 关系图视图（简化版）
// ============================================

import { useWorldStore } from '../store/worldStore';
import '../App.css';

export function RelationsView() {
  const { factions, locations, characters, events, selectEntity } = useWorldStore();

  // Build simple relation nodes
  const nodes = [
    ...factions.map((f) => ({ id: f.id, label: f.name, type: 'faction', color: f.color || '#e94560' })),
    ...locations.slice(0, 10).map((l) => ({ id: l.id, label: l.name, type: 'location', color: '#3b82f6' })),
    ...characters.slice(0, 10).map((c) => ({ id: c.id, label: c.name, type: 'character', color: '#10b981' })),
  ];

  const edges = factions.flatMap((f) =>
    f.controlledRegions.map((rId) => ({
      from: f.id,
      to: rId,
      label: '控制',
    }))
  );

  return (
    <div className="relations-view" style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '18px' }}>🔗 关系图</h2>
      
      {nodes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔗</div>
          <div className="empty-state-text">暂无数据，添加势力、地点或人物后查看关系</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Entity list as a simple relation view */}
          <div>
            <h3 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
              实体节点 ({nodes.length})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {nodes.map((node) => (
                <div
                  key={node.id}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: '1px solid var(--color-border)',
                    fontSize: '13px',
                  }}
                  onClick={() => selectEntity(node.type, node.id)}
                >
                  <span style={{ color: node.color, marginRight: '6px' }}>
                    {node.type === 'faction' ? '⚔️' : node.type === 'location' ? '📍' : '👤'}
                  </span>
                  {node.label}
                </div>
              ))}
            </div>
          </div>

          {/* Simple edge list */}
          {edges.length > 0 && (
            <div>
              <h3 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                控制关系 ({edges.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {edges.map((edge, i) => {
                  const fromNode = nodes.find((n) => n.id === edge.from);
                  const toNode = nodes.find((n) => n.id === edge.to);
                  return (
                    <div key={i} style={{ fontSize: '13px', padding: '4px 0' }}>
                      <span style={{ color: fromNode?.color }}>{fromNode?.label}</span>
                      <span style={{ opacity: 0.5, margin: '0 8px' }}>→ 控制 →</span>
                      <span style={{ color: toNode?.color }}>{toNode?.label || '(未知区域)'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
