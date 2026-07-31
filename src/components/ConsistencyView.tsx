// ============================================
// ConsistencyView 一致性检查视图
// ============================================

import { useState, useEffect } from 'react';
import { useWorldStore } from '../store/worldStore';
import { pluginManager } from '../core/PluginManager';
import type { ValidationIssue } from '../types';
import '../App.css';

export function ConsistencyView() {
  const { world, events, factions, characters } = useWorldStore();
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const runCheck = async () => {
    if (!world) return;
    setIsChecking(true);

    const allEntities = new Map<string, unknown[]>([
      ['event', events],
      ['faction', factions],
      ['character', characters],
    ]);

    // Built-in checks
    const foundIssues: ValidationIssue[] = [];

    // Check events without participants
    for (const event of events) {
      if (event.participants.length === 0) {
        foundIssues.push({
          severity: 'info',
          message: `事件 "${event.name}" 没有参与方`,
          entityType: 'event',
          entityId: event.id,
          ruleName: 'event-has-participants',
        });
      }
    }

    // Check characters without faction
    for (const character of characters) {
      if (!character.factionId) {
        foundIssues.push({
          severity: 'info',
          message: `人物 "${character.name}" 没有所属势力`,
          entityType: 'character',
          entityId: character.id,
          ruleName: 'character-has-faction',
        });
      }
    }

    // Check factions without controlled regions
    for (const faction of factions) {
      if (faction.controlledRegions.length === 0) {
        foundIssues.push({
          severity: 'warning',
          message: `势力 "${faction.name}" 没有控制任何区域`,
          entityType: 'faction',
          entityId: faction.id,
          ruleName: 'faction-has-regions',
        });
      }
    }

    // Run plugin validators
    const pluginIssues = await pluginManager.runValidation(world, allEntities);
    foundIssues.push(...pluginIssues);

    setIssues(foundIssues);
    setIsChecking(false);
  };

  useEffect(() => {
    runCheck();
  }, [world, events, factions, characters]);

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const infos = issues.filter((i) => i.severity === 'info');

  return (
    <div className="consistency-view" style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px' }}>✅ 一致性检查</h2>
        <button className="btn btn-primary" onClick={runCheck} disabled={isChecking}>
          {isChecking ? '检查中...' : '🔄 重新检查'}
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '12px 20px', backgroundColor: 'var(--color-bg-tertiary)', borderRadius: '8px', flex: 1 }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-error)' }}>{errors.length}</div>
          <div style={{ fontSize: '12px', opacity: 0.6 }}>错误</div>
        </div>
        <div style={{ padding: '12px 20px', backgroundColor: 'var(--color-bg-tertiary)', borderRadius: '8px', flex: 1 }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-warning)' }}>{warnings.length}</div>
          <div style={{ fontSize: '12px', opacity: 0.6 }}>警告</div>
        </div>
        <div style={{ padding: '12px 20px', backgroundColor: 'var(--color-bg-tertiary)', borderRadius: '8px', flex: 1 }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-info)' }}>{infos.length}</div>
          <div style={{ fontSize: '12px', opacity: 0.6 }}>提示</div>
        </div>
      </div>

      {/* Issues list */}
      {issues.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎉</div>
          <div className="empty-state-text">没有发现一致性问题！</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {issues.map((issue, index) => (
            <div
              key={index}
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--color-bg-tertiary)',
                borderRadius: '8px',
                borderLeft: `3px solid ${issue.severity === 'error' ? 'var(--color-error)' : issue.severity === 'warning' ? 'var(--color-warning)' : 'var(--color-info)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span className={`badge badge-${issue.severity}`}>
                {issue.severity === 'error' ? '错误' : issue.severity === 'warning' ? '警告' : '提示'}
              </span>
              <span style={{ fontSize: '13px', flex: 1 }}>{issue.message}</span>
              {issue.entityType && (
                <span style={{ fontSize: '11px', opacity: 0.5 }}>{issue.entityType}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
