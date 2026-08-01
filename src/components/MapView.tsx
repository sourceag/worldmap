// ============================================
// MapView 地图视图 - 多边形绘制工具
// ============================================

import { useRef, useEffect, useState, useCallback } from 'react';
import { useWorldStore } from '../store/worldStore';
import type { Continent, Region, Location, TerrainType } from '../types';
import '../App.css';

type ToolMode = 'select' | 'pan' | 'draw-continent' | 'draw-region' | 'add-location' | 'edit-polygon' | 'split';

interface DrawingState {
  points: { x: number; y: number }[];
  targetContinentId?: string; // For region drawing
}

interface SplitState {
  startPoint: { x: number; y: number } | null;
  endPoint: { x: number; y: number } | null;
  selectedContinentId: string | null;
}

interface PolygonEditState {
  entityType: 'continent' | 'region';
  entityId: string;
  dragVertexIndex: number | null;
}

export function MapView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    continents,
    regions,
    locations,
    selectedEntityType,
    selectedEntityId,
    selectEntity,
    createContinent,
    createRegion,
    createLocation,
    updateContinent,
    updateRegion,
    cascadeDeleteContinent,
    cascadeDeleteRegion,
    deleteLocation,
    deleteFaction,
    deleteEvent,
    deleteCharacter,
  } = useWorldStore();

  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<ToolMode>('select');
  const [drawing, setDrawing] = useState<DrawingState | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [polygonEdit, setPolygonEdit] = useState<PolygonEditState | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogData, setDialogData] = useState({ name: '', description: '', terrain: 'plains' as TerrainType });
  const [zoomSpeed, setZoomSpeed] = useState<number>(0.005); // 缩放速度：0.001(慢) ~ 0.02(快)
  const [canvasBgColor, setCanvasBgColor] = useState('#16213e'); // 画布背景色
  const [splitState, setSplitState] = useState<SplitState>({ startPoint: null, endPoint: null, selectedContinentId: null });

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - viewport.x) / viewport.zoom,
      y: (clientY - rect.top - viewport.y) / viewport.zoom,
    };
  }, [viewport]);

  // Convert world coordinates to screen coordinates
  const worldToScreen = useCallback((worldX: number, worldY: number) => {
    return {
      x: worldX * viewport.zoom + viewport.x,
      y: worldY * viewport.zoom + viewport.y,
    };
  }, [viewport]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    // 绘制缓冲区严格匹配 CSS 尺寸，防止溢出
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    // 确保 CSS 尺寸严格限制
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    // 先重置变换，清除整个画布
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 应用视口变换（包含 DPR 缩放）
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    // 绘制可视区域背景（防止透明区域）
    ctx.fillStyle = canvasBgColor;
    ctx.fillRect(
      -viewport.x / viewport.zoom - 1,
      -viewport.y / viewport.zoom - 1,
      canvas.width / viewport.zoom + 2,
      canvas.height / viewport.zoom + 2
    );

    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height, viewport);

    // Draw continents
    for (const continent of continents) {
      drawPolygon(
        ctx,
        continent.bounds.points,
        'rgba(30, 41, 59, 0.6)',
        selectedEntityType === 'continent' && selectedEntityId === continent.id ? '#e94560' : '#475569',
        selectedEntityType === 'continent' && selectedEntityId === continent.id ? 3 : 1,
        continent.name,
        14,
        '#e4e4e7'
      );
    }

    // Draw regions
    for (const region of regions) {
      const isSelected = selectedEntityType === 'region' && selectedEntityId === region.id;
      const isEditing = polygonEdit?.entityType === 'region' && polygonEdit?.entityId === region.id;
      drawPolygon(
        ctx,
        region.bounds.points,
        getTerrainColor(region.terrain),
        isSelected || isEditing ? '#e94560' : '#334155',
        isSelected || isEditing ? 2 : 1,
        region.name,
        12,
        '#cbd5e1'
      );

      // Draw vertex handles when editing
      if (isEditing) {
        for (const point of region.bounds.points) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#e94560';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }

    // Draw locations
    for (const location of locations) {
      const { x, y } = location.position;
      const isSelected = selectedEntityId === location.id;

      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 8 : 5, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#e94560' : '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#e4e4e7';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(location.name, x, y - 12);
    }

    // Draw current polygon being drawn
    if (drawing && drawing.points.length > 0) {
      const allPoints = mousePos ? [...drawing.points, mousePos] : drawing.points;

      // Draw lines
      if (allPoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(allPoints[0].x, allPoints[0].y);
        for (let i = 1; i < allPoints.length; i++) {
          ctx.lineTo(allPoints[i].x, allPoints[i].y);
        }
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw points
      for (let i = 0; i < drawing.points.length; i++) {
        const point = drawing.points[i];
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 && drawing.points.length >= 3 ? '#10b981' : '#e94560';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw closing hint
      if (drawing.points.length >= 3 && mousePos) {
        const firstPoint = drawing.points[0];
        const dx = mousePos.x - firstPoint.x;
        const dy = mousePos.y - firstPoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 15) {
          ctx.beginPath();
          ctx.arc(firstPoint.x, firstPoint.y, 10, 0, Math.PI * 2);
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }
    }

    // 绘制切分线预览
    if (tool === 'split' && splitState.startPoint && splitState.endPoint) {
      ctx.beginPath();
      ctx.moveTo(splitState.startPoint.x, splitState.startPoint.y);
      ctx.lineTo(splitState.endPoint.x, splitState.endPoint.y);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 绘制端点
      ctx.beginPath();
      ctx.arc(splitState.startPoint.x, splitState.startPoint.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(splitState.endPoint.x, splitState.endPoint.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
    }

    ctx.restore();
  }, [continents, regions, locations, selectedEntityType, selectedEntityId, viewport, drawing, mousePos, polygonEdit, splitState, tool]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    // 基于 deltaY 的幅度计算缩放量，使缩放更平滑
    const delta = -e.deltaY * zoomSpeed;
    const factor = Math.exp(delta); // 使用指数缩放，更自然
    setViewport((v) => ({
      ...v,
      zoom: Math.max(0.1, Math.min(10, v.zoom * factor))
    }));
  };

  // 绘制模式下 Ctrl+Z 撤销最后一个点
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      if (drawing && drawing.points.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        setDrawing((d) => {
          if (!d) return null;
          const newPoints = d.points.slice(0, -1);
          return newPoints.length > 0 ? { ...d, points: newPoints } : null;
        });
      }
    }
    // Escape 取消绘制
    if (e.key === 'Escape') {
      if (drawing) {
        setDrawing(null);
      } else if (polygonEdit) {
        setPolygonEdit(null);
        setTool('select');
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);

    if (tool === 'pan') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      return;
    }

    // 切分工具：选择大陆并绘制切分线
    if (tool === 'split') {
      // 查找点击的大陆
      let clickedContinent: string | null = null;
      for (const continent of continents) {
        if (isPointInPolygon(worldPos, continent.bounds.points)) {
          clickedContinent = continent.id;
          break;
        }
      }

      if (clickedContinent) {
        if (!splitState.startPoint) {
          // 第一次点击：设置起点
          setSplitState({ startPoint: worldPos, endPoint: null, selectedContinentId: clickedContinent });
          selectEntity('continent', clickedContinent);
        } else if (splitState.selectedContinentId === clickedContinent) {
          // 第二次点击（同一个大陆）：执行切分
          const result = splitPolygon(
            continents.find(c => c.id === clickedContinent)!.bounds.points,
            splitState.startPoint,
            worldPos
          );
          if (result) {
            handleSplitContinent(clickedContinent, result[0], result[1]);
          }
          setSplitState({ startPoint: null, endPoint: null, selectedContinentId: null });
        }
      }
      return;
    }

    // 编辑模式下拖动顶点（必须在最外层判断，不依赖 tool === 'select'）
    if (polygonEdit && tool === 'edit-polygon') {
      const entity = polygonEdit.entityType === 'continent'
        ? continents.find(c => c.id === polygonEdit.entityId)
        : regions.find(r => r.id === polygonEdit.entityId);
      if (entity) {
        for (let i = 0; i < entity.bounds.points.length; i++) {
          const point = entity.bounds.points[i];
          const dx = point.x - worldPos.x;
          const dy = point.y - worldPos.y;
          if (Math.sqrt(dx * dx + dy * dy) < 10 / viewport.zoom) {
            setPolygonEdit({ ...polygonEdit, dragVertexIndex: i });
            return;
          }
        }
      }
    }

    if (tool === 'select') {
      // Check if clicking on a location
      for (const location of locations) {
        const dx = location.position.x - worldPos.x;
        const dy = location.position.y - worldPos.y;
        if (Math.sqrt(dx * dx + dy * dy) < 10 / viewport.zoom) {
          selectEntity('location', location.id);
          return;
        }
      }

      // Check if clicking on a continent
      for (const continent of continents) {
        if (isPointInPolygon(worldPos, continent.bounds.points)) {
          selectEntity('continent', continent.id);
          return;
        }
      }

      // Check if clicking on a region
      for (const region of regions) {
        if (isPointInPolygon(worldPos, region.bounds.points)) {
          selectEntity('region', region.id);
          return;
        }
      }

      return;
    }

    if (tool === 'draw-continent' || tool === 'draw-region') {
      if (!drawing) {
        setDrawing({ points: [worldPos] });
      } else {
        // Check if clicking near first point to close
        if (drawing.points.length >= 3) {
          const firstPoint = drawing.points[0];
          const dx = worldPos.x - firstPoint.x;
          const dy = worldPos.y - firstPoint.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 15 / viewport.zoom) {
            // Close polygon
            handleClosePolygon();
            return;
          }
        }
        setDrawing({ ...drawing, points: [...drawing.points, worldPos] });
      }
      return;
    }

    if (tool === 'add-location') {
      const name = prompt('地点名称:');
      if (name) {
        const regionId = regions.length > 0 ? regions[0].id : '';
        createLocation({
          regionId,
          name,
          aliases: [],
          type: 'city',
          position: worldPos,
          description: '',
          notableSites: [],
          resources: [],
        });
      }
      return;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    setMousePos(worldPos);

    if (isDragging && tool === 'pan') {
      setViewport((v) => ({
        ...v,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
      return;
    }

    // 切分工具：更新切分线终点预览
    if (tool === 'split' && splitState.startPoint) {
      setSplitState({ ...splitState, endPoint: worldPos });
    }

    // Handle vertex dragging in polygon edit mode
    if (polygonEdit?.dragVertexIndex !== null && polygonEdit?.dragVertexIndex !== undefined) {
      const { entityType, entityId, dragVertexIndex } = polygonEdit;
      if (entityType === 'continent') {
        const continent = continents.find(c => c.id === entityId);
        if (continent && dragVertexIndex !== null) {
          const newPoints = [...continent.bounds.points];
          newPoints[dragVertexIndex] = worldPos;
          updateContinent(entityId, { bounds: { points: newPoints } });
        }
      } else if (entityType === 'region') {
        const region = regions.find(r => r.id === entityId);
        if (region && dragVertexIndex !== null) {
          const newPoints = [...region.bounds.points];
          newPoints[dragVertexIndex] = worldPos;
          updateRegion(entityId, { bounds: { points: newPoints } });
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (polygonEdit) {
      setPolygonEdit({ ...polygonEdit, dragVertexIndex: null });
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if ((tool === 'draw-continent' || tool === 'draw-region') && drawing && drawing.points.length >= 3) {
      handleClosePolygon();
    }
  };

  const handleClosePolygon = () => {
    if (!drawing || drawing.points.length < 3) return;
    setShowDialog(true);
  };

  // 执行大陆切分：删除原大陆，创建两个新区域
  const handleSplitContinent = (continentId: string, poly1: { x: number; y: number }[], poly2: { x: number; y: number }[]) => {
    const continent = continents.find(c => c.id === continentId);
    if (!continent) return;

    // 删除原大陆
    cascadeDeleteContinent(continentId);

    // 创建两个新区域
    createRegion({
      continentId: continentId, // 使用原大陆ID（虽然大陆已删除，但区域仍可存在）,
      name: `${continent.name} - A`,
      description: `从${continent.name}切分出的区域A`,
      bounds: { points: poly1 },
      terrain: 'plains',
      resources: [],
    });

    createRegion({
      continentId: continentId,
      name: `${continent.name} - B`,
      description: `从${continent.name}切分出的区域B`,
      bounds: { points: poly2 },
      terrain: 'plains',
      resources: [],
    });
  };

  const handleDialogSubmit = () => {
    if (!drawing || drawing.points.length < 3) return;

    if (tool === 'draw-continent') {
      createContinent({
        name: dialogData.name,
        description: dialogData.description,
        bounds: { points: drawing.points },
        climate: '',
      });
    } else if (tool === 'draw-region') {
      const continentId = drawing.targetContinentId || (continents.length > 0 ? continents[0].id : '');
      createRegion({
        continentId,
        name: dialogData.name,
        description: dialogData.description,
        bounds: { points: drawing.points },
        terrain: dialogData.terrain,
        resources: [],
      });
    }

    setShowDialog(false);
    setDrawing(null);
    setDialogData({ name: '', description: '', terrain: 'plains' });
    setTool('select');
  };

  const handleDialogCancel = () => {
    setShowDialog(false);
    setDrawing(null);
    setDialogData({ name: '', description: '', terrain: 'plains' });
  };

  const handleStartEdit = (entityType: 'continent' | 'region', entityId: string) => {
    setPolygonEdit({ entityType, entityId, dragVertexIndex: null });
    setTool('edit-polygon');
    selectEntity(entityType, entityId);
  };

  const handleFinishEdit = () => {
    setPolygonEdit(null);
    setTool('select');
  };

  const handleDeleteSelected = () => {
    if (!selectedEntityId || !selectedEntityType) return;
    
    const entityName = getEntityName(selectedEntityType, selectedEntityId);
    const message = selectedEntityType === 'continent'
      ? `确定要删除大陆"${entityName}"吗？下属的区域和地点也会被删除。`
      : selectedEntityType === 'region'
      ? `确定要删除区域"${entityName}"吗？下属的地点也会被删除。`
      : `确定要删除"${entityName}"吗？`;

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
    selectEntity(null, null);
  };

  const getEntityName = (type: string, id: string): string => {
    const entity = useWorldStore.getState().getEntityById(type, id);
    return (entity as { name?: string })?.name || '(未知)';
  };

  return (
    <div className="map-view">
      <canvas
        ref={canvasRef}
        className="map-canvas"
        tabIndex={0}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        style={{ cursor: getCursor(tool), outline: 'none' }}
      />
      <div className="map-toolbar">
        <button
          className={tool === 'select' ? 'active' : ''}
          onClick={() => { setTool('select'); setPolygonEdit(null); }}
        >
          👆 选择
        </button>
        <button
          className={tool === 'pan' ? 'active' : ''}
          onClick={() => { setTool('pan'); setPolygonEdit(null); }}
        >
          ✋ 平移
        </button>
        <button
          className={tool === 'draw-continent' ? 'active' : ''}
          onClick={() => { setTool('draw-continent'); setDrawing(null); setPolygonEdit(null); }}
        >
          🌍 绘制大陆
        </button>
        <button
          className={tool === 'draw-region' ? 'active' : ''}
          onClick={() => { setTool('draw-region'); setDrawing(null); setPolygonEdit(null); }}
        >
          🏔️ 绘制区域
        </button>
        <button
          className={tool === 'add-location' ? 'active' : ''}
          onClick={() => { setTool('add-location'); setPolygonEdit(null); }}
        >
          📍 添加地点
        </button>
        <button
          className={tool === 'split' ? 'active' : ''}
          onClick={() => { setTool('split'); setPolygonEdit(null); setSplitState({ startPoint: null, endPoint: null, selectedContinentId: null }); }}
        >
          ✂️ 切分大陆
        </button>
        {selectedEntityType && selectedEntityId && (
          <>
            <button
              className={tool === 'edit-polygon' ? 'active' : ''}
              onClick={() => handleStartEdit(selectedEntityType as 'continent' | 'region', selectedEntityId)}
            >
              ✏️ 编辑形状
            </button>
            <button onClick={handleDeleteSelected}>
              🗑️ 删除
            </button>
          </>
        )}
        <button onClick={() => setViewport({ x: 0, y: 0, zoom: 1 })}>
          🔄 重置
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <input
            type="color"
            value={canvasBgColor}
            onChange={(e) => setCanvasBgColor(e.target.value)}
            title="画布背景色"
            style={{ width: '28px', height: '24px', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer', padding: '0' }}
          />
          <span style={{ fontSize: '12px', opacity: 0.6 }}>
            缩放: {Math.round(viewport.zoom * 100)}%
          </span>
          <select
            className="form-input"
            style={{ width: '70px', padding: '2px 6px', fontSize: '11px' }}
            value={zoomSpeed}
            onChange={(e) => setZoomSpeed(parseFloat(e.target.value))}
            title="滚轮缩放速度"
          >
            <option value="0.002">极慢</option>
            <option value="0.005">慢速</option>
            <option value="0.01">正常</option>
            <option value="0.02">快速</option>
            <option value="0.04">极快</option>
          </select>
        </div>
      </div>

      {/* Drawing hint */}
      {drawing && (
        <div className="map-hint">
          {drawing.points.length < 3
            ? `继续点击添加顶点 (${drawing.points.length}/3+)`
            : '双击或点击第一个点闭合多边形'}
        </div>
      )}

      {/* Polygon edit hint */}
      {polygonEdit && (
        <div className="map-hint">
          拖拽顶点调整形状 · 点击"选择"工具退出编辑
          <button onClick={handleFinishEdit} style={{ marginLeft: '12px' }}>
            ✓ 完成编辑
          </button>
        </div>
      )}

      {/* Split hint */}
      {tool === 'split' && (
        <div className="map-hint">
          {!splitState.startPoint
            ? '点击大陆选择切分起点'
            : '再次点击同一大陆完成切分（两点确定一条切分线）'}
        </div>
      )}

      {/* Dialog for polygon properties */}
      {showDialog && (
        <div className="map-dialog-overlay">
          <div className="map-dialog">
            <h3>{tool === 'draw-continent' ? '🌍 新建大陆' : '🏔️ 新建区域'}</h3>
            <div className="form-group">
              <label className="form-label">名称 *</label>
              <input
                className="form-input"
                value={dialogData.name}
                onChange={(e) => setDialogData({ ...dialogData, name: e.target.value })}
                placeholder="输入名称..."
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">描述</label>
              <textarea
                className="form-input form-textarea"
                value={dialogData.description}
                onChange={(e) => setDialogData({ ...dialogData, description: e.target.value })}
                placeholder="输入描述..."
              />
            </div>
            {tool === 'draw-region' && (
              <div className="form-group">
                <label className="form-label">地形</label>
                <select
                  className="form-input"
                  value={dialogData.terrain}
                  onChange={(e) => setDialogData({ ...dialogData, terrain: e.target.value as TerrainType })}
                >
                  <option value="plains">平原</option>
                  <option value="mountains">山脉</option>
                  <option value="forest">森林</option>
                  <option value="desert">沙漠</option>
                  <option value="ocean">海洋</option>
                  <option value="swamp">沼泽</option>
                  <option value="tundra">冻原</option>
                  <option value="hills">丘陵</option>
                  <option value="jungle">丛林</option>
                  <option value="wasteland">荒地</option>
                </select>
              </div>
            )}
            <div className="map-dialog-actions">
              <button className="btn btn-secondary" onClick={handleDialogCancel}>
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDialogSubmit}
                disabled={!dialogData.name.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Helper functions
// ============================================

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, viewport: { x: number; y: number; zoom: number }) {
  const gridSize = 50;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;

  const startX = Math.floor(-viewport.x / viewport.zoom / gridSize) * gridSize;
  const startY = Math.floor(-viewport.y / viewport.zoom / gridSize) * gridSize;
  const endX = startX + (width / viewport.zoom) + gridSize * 2;
  const endY = startY + (height / viewport.zoom) + gridSize * 2;

  ctx.beginPath();
  for (let x = startX; x <= endX; x += gridSize) {
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
  }
  for (let y = startY; y <= endY; y += gridSize) {
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
  }
  ctx.stroke();
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  fillColor: string,
  strokeColor: string,
  lineWidth: number,
  label: string,
  fontSize: number,
  labelColor: string
) {
  if (points.length < 3) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  // Label
  const center = getCenter(points);
  ctx.fillStyle = labelColor;
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, center.x, center.y);
}

function getCenter(points: { x: number; y: number }[]): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

function isPointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function getTerrainColor(terrain: string): string {
  const colors: Record<string, string> = {
    plains: 'rgba(34, 197, 94, 0.15)',
    mountains: 'rgba(120, 113, 108, 0.2)',
    forest: 'rgba(22, 163, 74, 0.2)',
    desert: 'rgba(234, 179, 8, 0.15)',
    ocean: 'rgba(59, 130, 246, 0.2)',
    swamp: 'rgba(101, 163, 13, 0.15)',
    tundra: 'rgba(147, 197, 253, 0.15)',
    hills: 'rgba(161, 98, 7, 0.15)',
    jungle: 'rgba(22, 101, 52, 0.2)',
    wasteland: 'rgba(120, 113, 108, 0.1)',
  };
  return colors[terrain] || 'rgba(100, 116, 139, 0.1)';
}

function getCursor(tool: ToolMode): string {
  switch (tool) {
    case 'pan': return 'grab';
    case 'draw-continent':
    case 'draw-region':
    case 'add-location':
    case 'split': return 'crosshair';
    case 'edit-polygon': return 'move';
    default: return 'default';
  }
}

// ============================================
// 多边形切分算法
// ============================================

// 计算两条线段的交点
function lineIntersection(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number }
): { x: number; y: number; t: number } | null {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(denom) < 1e-10) return null; // 平行

  const t = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const u = -((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y),
      t,
    };
  }
  return null;
}

// 切分多边形：返回两个多边形（如果无法切分则返回 null）
function splitPolygon(
  polygon: { x: number; y: number }[],
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): [{ x: number; y: number }[], { x: number; y: number }[]] | null {
  if (polygon.length < 3) return null;

  // 找到所有交点
  const intersections: { point: { x: number; y: number }; edgeIndex: number; t: number }[] = [];

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const intersection = lineIntersection(polygon[i], polygon[j], lineStart, lineEnd);
    if (intersection) {
      intersections.push({
        point: { x: intersection.x, y: intersection.y },
        edgeIndex: i,
        t: intersection.t,
      });
    }
  }

  // 需要恰好 2 个交点才能切分
  if (intersections.length < 2) return null;

  // 按边的顺序排序
  intersections.sort((a, b) => a.edgeIndex - b.edgeIndex || a.t - b.t);

  // 取前两个交点
  const int1 = intersections[0];
  const int2 = intersections[1];

  // 构建两个新多边形
  const poly1: { x: number; y: number }[] = [];
  const poly2: { x: number; y: number }[] = [];

  // 添加第一个交点
  poly1.push(int1.point);
  poly2.push(int1.point);

  // 从 int1 的边到 int2 的边，沿多边形边界走
  let i = (int1.edgeIndex + 1) % polygon.length;
  const endEdge = (int2.edgeIndex + 1) % polygon.length;

  // poly1: 沿多边形从 int1 到 int2
  while (i !== endEdge) {
    poly1.push(polygon[i]);
    i = (i + 1) % polygon.length;
  }
  poly1.push(int2.point);

  // poly2: 沿多边形从 int2 到 int1（另一侧）
  i = (int2.edgeIndex + 1) % polygon.length;
  const endEdge2 = (int1.edgeIndex + 1) % polygon.length;
  while (i !== endEdge2) {
    poly2.push(polygon[i]);
    i = (i + 1) % polygon.length;
  }
  poly2.push(poly2[0]); // 闭合

  // 确保两个多边形都有效（至少 3 个点且不共线）
  if (poly1.length < 3 || poly2.length < 3) return null;

  return [poly1, poly2];
}

// 计算多边形面积（用于验证切分结果）
function polygonArea(polygon: { x: number; y: number }[]): number {
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }
  return Math.abs(area) / 2;
}
