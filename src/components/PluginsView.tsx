// ============================================
// PluginsView 插件管理视图
// ============================================

import { useState, useEffect, useRef } from 'react';
import { pluginManager } from '../core/PluginManager';
import { worldForgeAPI } from '../core/WorldForgeAPI';
import { useWorldStore } from '../store/worldStore';
import { downloadFile, downloadJSON, downloadMarkdown } from '../utils/download';
import { exportToWFFile, readWFFile, downloadWFFile, type WFFile } from '../core/WFFile';
import { historyManager } from '../core/History';
import type { PluginManifest } from '../types';
import '../App.css';

export function PluginsView() {
  const [plugins, setPlugins] = useState<PluginManifest[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginManifest | null>(null);
  const [exportFormat, setExportFormat] = useState<string>('markdown');
  const [exportResult, setExportResult] = useState<string>('');
  const [availableExporters, setAvailableExporters] = useState<string[]>([]);
  const [importMessage, setImportMessage] = useState<string>('');
  const [importError, setImportError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { world, continents, regions, locations, routes, eras, ages, events, factions, characters } = useWorldStore();

  useEffect(() => {
    setPlugins(pluginManager.getAllPlugins());
    setAvailableExporters(pluginManager.getAvailableExporters());
  }, []);

  const handleTogglePlugin = (plugin: PluginManifest) => {
    if (plugin.enabled) {
      pluginManager.disablePlugin(plugin.id);
    } else {
      pluginManager.enablePlugin(plugin.id);
    }
    setPlugins([...pluginManager.getAllPlugins()]);
  };

  // 导出为 WorldForge 文件
  const handleExportWF = () => {
    if (!world) return;
    const wfData = exportToWFFile({
      world,
      continents,
      regions,
      locations,
      routes,
      eras,
      ages,
      events,
      factions,
      characters,
    });
    downloadWFFile(wfData);
    setImportMessage('✅ WorldForge 文件已导出');
    setImportError('');
  };

  // 导入 WorldForge 文件
  const handleImportWF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportMessage('');
    setImportError('');

    const result = await readWFFile(file);

    if (!result.valid) {
      setImportError(`导入失败: ${result.errors.join(', ')}`);
      return;
    }

    if (result.warnings.length > 0) {
      setImportMessage(`⚠️ 警告: ${result.warnings.join(', ')}`);
    }

    if (result.data) {
      const data = result.data;
      if (confirm(`确定要导入世界"${data.world.name}"吗？这将覆盖当前的所有数据。`)) {
        // 清除历史
        historyManager.clear();
        // 加载数据
        useWorldStore.setState({
          world: data.world,
          continents: data.continents || [],
          regions: data.regions || [],
          locations: data.locations || [],
          routes: data.routes || [],
          eras: data.eras || [],
          ages: data.ages || [],
          events: data.events || [],
          factions: data.factions || [],
          characters: data.characters || [],
        });
        // 保存到存储
        useWorldStore.getState().saveToStorage();
        setImportMessage(`✅ 成功导入世界"${data.world.name}"！`);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = async (download: boolean = false) => {
    try {
      const result = await worldForgeAPI.export(exportFormat, { format: 'pretty' });
      const content = typeof result === 'string' ? result : String(result);
      
      if (download) {
        // Trigger file download
        const worldName = world?.name || 'world';
        const timestamp = new Date().toISOString().slice(0, 10);
        
        if (exportFormat === 'json') {
          downloadJSON(JSON.parse(content), `${worldName}-${timestamp}.json`);
        } else if (exportFormat === 'markdown') {
          downloadMarkdown(content, `${worldName}-${timestamp}.md`);
        } else {
          downloadFile(content, `${worldName}-${timestamp}.${exportFormat}`);
        }
        setExportResult('✅ 文件已下载');
      } else {
        setExportResult(content);
      }
    } catch (error) {
      setExportResult(`导出失败: ${(error as Error).message}`);
    }
  };

  return (
    <div className="plugins-view" style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '18px' }}>🧩 插件管理</h2>

      {/* Export Section */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
          数据导出
        </h3>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <select
            className="form-input"
            style={{ width: '200px' }}
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
          >
            {availableExporters.map((format) => (
              <option key={format} value={format}>
                {format.toUpperCase()}
              </option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={() => handleExport(false)}>
            👁️ 预览
          </button>
          <button className="btn btn-primary" onClick={() => handleExport(true)}>
            📥 下载文件
          </button>
        </div>
        {exportResult && (
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--color-bg-tertiary)',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '12px',
              maxHeight: '300px',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {exportResult}
          </div>
        )}
      </div>

      {/* WorldForge File Import/Export */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
          📦 WorldForge 文件 (.wf.json)
        </h3>
        <p style={{ fontSize: '12px', opacity: 0.6, marginBottom: '12px' }}>
          导出完整世界观数据，或导入他人分享的 .wf.json 文件继续编辑
        </p>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <button
            className="btn btn-primary"
            onClick={handleExportWF}
            disabled={!world}
          >
            📤 导出 .wf.json
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            📥 导入 .wf.json
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".wf.json,.json"
            style={{ display: 'none' }}
            onChange={handleImportWF}
          />
        </div>
        {importMessage && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '6px',
            fontSize: '13px',
            color: 'var(--color-success)',
            marginBottom: '8px',
          }}>
            {importMessage}
          </div>
        )}
        {importError && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '6px',
            fontSize: '13px',
            color: 'var(--color-error)',
            marginBottom: '8px',
          }}>
            {importError}
          </div>
        )}
      </div>

      {/* Data Management */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
          数据管理
        </h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => useWorldStore.getState().saveToStorage()}
          >
            💾 立即保存
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
                localStorage.location.reload();
              }
            }}
          >
            🗑️ 清除数据
          </button>
        </div>
        <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '8px' }}>
          数据自动保存到浏览器本地存储（IndexedDB）
        </p>
      </div>

      {/* Plugin List */}
      <div>
        <h3 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
          已安装插件 ({plugins.length})
        </h3>
        {plugins.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧩</div>
            <div className="empty-state-text">暂无插件</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {plugins.map((plugin) => (
              <div
                key={plugin.id}
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedPlugin(plugin)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{plugin.name}</div>
                    <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
                      {plugin.type} · v{plugin.version}
                    </div>
                    {plugin.description && (
                      <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--color-text-secondary)' }}>
                        {plugin.description}
                      </div>
                    )}
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={plugin.enabled}
                      onChange={() => handleTogglePlugin(plugin)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span style={{ fontSize: '12px' }}>{plugin.enabled ? '已启用' : '已禁用'}</span>
                  </label>
                </div>
                {selectedPlugin?.id === plugin.id && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                      <strong>权限:</strong>{' '}
                      {plugin.permissions.length > 0 ? plugin.permissions.join(', ') : '无'}
                    </div>
                    <div style={{ fontSize: '12px' }}>
                      <strong>配置:</strong>
                      <pre style={{ marginTop: '4px', opacity: 0.7 }}>
                        {JSON.stringify(plugin.config, null, 2)}
                      </pre>
                    </div>
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
