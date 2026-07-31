// ============================================
// TimelineView 时间线视图
// ============================================

import { useWorldStore } from '../store/worldStore';
import '../App.css';

export function TimelineView() {
  const { events, eras, ages, factions, selectedEntityId, selectEntity } = useWorldStore();

  const sortedEvents = [...events].sort((a, b) => a.startDate.year - b.startDate.year);

  return (
    <div className="timeline-view">
      <h2 style={{ marginBottom: '24px', fontSize: '18px' }}>📅 时间线</h2>
      
      {eras.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>纪元</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {eras.sort((a, b) => a.order - b.order).map((era) => (
              <div
                key={era.id}
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: selectedEntityId === era.id ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                }}
                onClick={() => selectEntity('era', era.id)}
              >
                <div style={{ fontWeight: 600 }}>{era.name}</div>
                <div style={{ fontSize: '12px', opacity: 0.6 }}>{era.startYear} - {era.endYear || '今'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="timeline-container">
        <div className="timeline-track" />
        {sortedEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📜</div>
            <div className="empty-state-text">暂无事件，请在左侧添加</div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '16px', paddingTop: '240px', overflowX: 'auto' }}>
            {sortedEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  minWidth: '180px',
                  padding: '12px',
                  backgroundColor: selectedEntityId === event.id ? 'rgba(233, 69, 96, 0.1)' : 'var(--color-bg-tertiary)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: selectedEntityId === event.id ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                }}
                onClick={() => selectEntity('event', event.id)}
              >
                <div style={{ fontSize: '11px', color: 'var(--color-accent)', marginBottom: '4px' }}>
                  {event.startDate.displayString}
                </div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{event.name}</div>
                <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '8px' }}>{event.type}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {event.description.substring(0, 50)}
                  {event.description.length > 50 ? '...' : ''}
                </div>
                {event.participants.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.5 }}>
                    参与方: {event.participants.length}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
