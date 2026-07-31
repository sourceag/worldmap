// ============================================
// WelcomeScreen 欢迎/创建世界界面
// ============================================

import { useState } from 'react';
import { useWorldStore } from '../store/worldStore';
import '../App.css';

export function WelcomeScreen() {
  const [worldName, setWorldName] = useState('');
  const [worldDescription, setWorldDescription] = useState('');
  const { createWorld } = useWorldStore();

  const handleCreate = () => {
    if (worldName.trim()) {
      createWorld(worldName.trim(), worldDescription.trim());
    }
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
          创建世界
        </button>
      </div>
    </div>
  );
}
