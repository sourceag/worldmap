// ============================================
// WelcomeScreen 欢迎/创建世界界面
// ============================================

import { useState, useEffect } from 'react';
import { useWorldStore } from '../store/worldStore';
import { loadWorldData } from '../core/Storage';
import '../App.css';

export function WelcomeScreen() {
  const [worldName, setWorldName] = useState('');
  const [worldDescription, setWorldDescription] = useState('');
  const [hasExistingData, setHasExistingData] = useState(false);
  const { createWorld } = useWorldStore();

  useEffect(() => {
    const checkExisting = async () => {
      const data = await loadWorldData();
      setHasExistingData(!!data?.world);
    };
    checkExisting();
  }, []);

  const handleCreate = () => {
    if (worldName.trim()) {
      createWorld(worldName.trim(), worldDescription.trim());
    }
  };

  const handleRestore = async () => {
    // The App component will auto-load, so we just need to set a flag
    // Actually, the loadFromStorage is called on mount, so we just need to create a dummy world
    // and the auto-load will replace it. But better to just reload the window.
    window.location.reload();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-title">🔨 WorldForge</div>
      <div className="welcome-subtitle">
        为创作者设计的结构化世界观构建系统。<br />
        以空间为锚点，整合时间、社会与叙事，构建逻辑自洽的虚构世界。
      </div>

      {hasExistingData && (
        <div style={{
          padding: '16px 24px',
          backgroundColor: 'var(--color-bg-tertiary)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          textAlign: 'center',
        }}>
          <p style={{ marginBottom: '12px' }}>📦 发现已保存的世界数据</p>
          <button className="btn btn-primary" onClick={handleRestore}>
            恢复上次的世界
          </button>
        </div>
      )}

      <div className="welcome-form">
        <input
          type="text"
          placeholder="世界名称（如：艾泽拉斯、中土大陆...）"
          value={worldName}
          onChange={(e) => setWorldName(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <input
          type="text"
          placeholder="世界描述（可选）"
          value={worldDescription}
          onChange={(e) => setWorldDescription(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleCreate} disabled={!worldName.trim()}>
          创建新世界
        </button>
      </div>
    </div>
  );
}
