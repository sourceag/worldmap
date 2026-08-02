// ============================================
// MapView 地图视图 - 多边形绘制工具
// ============================================

import { useRef, useEffect, useState, useCallback } from 'react';
import { useWorldStore } from '../store/worldStore';
import type { Continent, Region, Location, TerrainType } from '../types';
import { polygonArea } from '../core/PolygonClip';
import '../App.css';

type ToolMode = 'select' | 'pan' | 'draw-continent' | 'draw-region' | 'add-location' | 'edit-polygon';

interface DrawingState {
  points: { x: number; y: number }[];
  targetContinentId?: string; // For region drawing - 指定所属大陆
  snapToEdge?: 'continent' | 'region'; // 边缘贴合模式
  snappedEdgeId?: string;    // 贴合的边缘所属实体 ID
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
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [regionPickerOptions, setRegionPickerOptions] = useState<{ x: number; y: number }[][]>([]);
  const [zoomSpeed, setZoomSpeed] = useState<number>(0.005); // 缩放速度：0.001(慢) ~ 0.02(快)
  const [canvasBgColor, setCanvasBgColor] = useState('#16213e'); // 画布背景色

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
    // 绘制缓冲区匹配当前显示尺寸（CSS 控制显示大小，无需设置 style）
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

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
      const isContinentSelected = selectedEntityType === 'continent' && selectedEntityId === continent.id;
      const isTargetForRegion = tool === 'draw-region' && drawing?.targetContinentId === continent.id;
      drawPolygon(
        ctx,
        continent.bounds.points,
        'rgba(30, 41, 59, 0.6)',
        isContinentSelected || isTargetForRegion ? '#3b82f6' : '#475569',
        isContinentSelected || isTargetForRegion ? 3 : 2,
        continent.name,
        14,
        '#e4e4e7'
      );
      // 绘制大陆半透明遮罩（绘制区域模式下，非目标大陆变暗）
      if (tool === 'draw-region' && drawing && drawing.targetContinentId && drawing.targetContinentId !== continent.id) {
        ctx.beginPath();
        ctx.moveTo(continent.bounds.points[0].x, continent.bounds.points[0].y);
        for (let i = 1; i < continent.bounds.points.length; i++) {
          ctx.lineTo(continent.bounds.points[i].x, continent.bounds.points[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fill();
      }
    }

    // Draw regions
    for (const region of regions) {
      const isSelected = selectedEntityType === 'region' && selectedEntityId === region.id;
      const isEditing = polygonEdit?.entityType === 'region' && polygonEdit?.entityId === region.id;
      const belongsToTargetContinent = tool === 'draw-region' && drawing?.targetContinentId === region.continentId;
      drawPolygon(
        ctx,
        region.bounds.points,
        getTerrainColor(region.terrain),
        isSelected || isEditing ? '#e94560' : belongsToTargetContinent ? '#60a5fa' : '#334155',
        isSelected || isEditing ? 2 : belongsToTargetContinent ? 2 : 1,
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

    ctx.restore();
  }, [continents, regions, locations, selectedEntityType, selectedEntityId, viewport, drawing, mousePos, polygonEdit, tool]);

  useEffect(() => {
    draw();
  }, [draw]);

  // 使用 ResizeObserver 监听容器大小变化（包括侧边栏拖拽调整）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const parent = canvas.parentElement;
    if (!parent) return;

    const resizeObserver = new ResizeObserver(() => {
      // 使用 requestAnimationFrame 节流，避免频繁重绘
      requestAnimationFrame(() => draw());
    });

    resizeObserver.observe(parent);
    return () => resizeObserver.disconnect();
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
        // 首次点击：如果是绘制区域，检测所属大陆和边缘贴合
        let targetContinentId: string | undefined;
        let snapToEdge: 'continent' | 'region' | undefined;
        let snappedEdgeId: string | undefined;

        if (tool === 'draw-region') {
          // 查找点击的大陆
          for (const continent of continents) {
            if (isPointInPolygon(worldPos, continent.bounds.points)) {
              targetContinentId = continent.id;
              break;
            }
          }
          if (!targetContinentId) {
            alert('请先点击选择一个大陆，在大陆内部绘制区域');
            return;
          }

          // 检测是否点击在大陆边缘
          const continent = continents.find(c => c.id === targetContinentId)!;
          if (isPointOnEdge(worldPos, continent.bounds.points, 15 / viewport.zoom)) {
            snapToEdge = 'continent';
            snappedEdgeId = targetContinentId;
          } else {
            // 检测是否点击在其他区域边缘
            for (const region of regions) {
              if (region.continentId === targetContinentId && isPointOnEdge(worldPos, region.bounds.points, 15 / viewport.zoom)) {
                snapToEdge = 'region';
                snappedEdgeId = region.id;
                break;
              }
            }
          }
        }
        setDrawing({ points: [worldPos], targetContinentId, snapToEdge, snappedEdgeId });
      } else {
        // 检查是否可以边缘贴合闭合
        if (drawing.snapToEdge && drawing.snappedEdgeId && drawing.points.length >= 2) {
          const snapTarget = drawing.snapToEdge === 'continent'
            ? continents.find(c => c.id === drawing.snappedEdgeId)
            : regions.find(r => r.id === drawing.snappedEdgeId);
          
          if (snapTarget) {
            const proj = projectPointToEdge(worldPos, snapTarget.bounds.points);
            if (proj && proj.dist < 20 / viewport.zoom) {
              // 检查是否回到起点附近（边缘贴合闭合）
              const startProj = projectPointToEdge(drawing.points[0], snapTarget.bounds.points);
              if (startProj && (startProj.edgeIndex !== proj.edgeIndex || Math.abs(startProj.t - proj.t) > 0.05)) {
                // 使用边缘贴合闭合：折线 + 边界线段
                handleEdgeClosePolygon(drawing, snapTarget.bounds.points, proj);
                return;
              }
            }
          }
        }

        // 常规闭合：点击靠近第一个点
        if (drawing.points.length >= 3) {
          const firstPoint = drawing.points[0];
          const dx = worldPos.x - firstPoint.x;
          const dy = worldPos.y - firstPoint.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 15 / viewport.zoom) {
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

  // 边缘贴合闭合：使用折线 + 边界线段形成闭合多边形
  const handleEdgeClosePolygon = (
    drawingState: DrawingState,
    boundaryPoints: { x: number; y: number }[],
    endProjection: { edgeIndex: number; t: number }
  ) => {
    if (drawingState.points.length < 2) return;

    // 获取起点在边界上的投影
    const startProjection = projectPointToEdge(drawingState.points[0], boundaryPoints);
    if (!startProjection) {
      handleClosePolygon();
      return;
    }

    // 计算两个可能的边界线段（正向和反向）
    const forwardSegment = getBoundarySegment(
      boundaryPoints,
      { edgeIndex: startProjection.edgeIndex, t: startProjection.t },
      { edgeIndex: endProjection.edgeIndex, t: endProjection.t }
    );
    const reverseSegment = getBoundarySegment(
      boundaryPoints,
      { edgeIndex: endProjection.edgeIndex, t: endProjection.t },
      { edgeIndex: startProjection.edgeIndex, t: startProjection.t }
    );

    // 组合两个可能的多边形
    const polygonA = [
      ...drawingState.points,
      ...forwardSegment.slice(1, -1),
    ];
    const polygonB = [
      ...drawingState.points,
      ...reverseSegment.slice(1, -1),
    ];

    // 验证两个多边形是否都有效
    const validA = polygonA.length >= 3;
    const validB = polygonB.length >= 3;

    if (validA && validB) {
      // 两个都有效，弹出选择框让用户选择
      setRegionPickerOptions([polygonA, polygonB]);
      setShowRegionPicker(true);
    } else if (validA) {
      setDrawing({ ...drawingState, points: polygonA });
      setShowDialog(true);
    } else if (validB) {
      setDrawing({ ...drawingState, points: polygonB });
      setShowDialog(true);
    } else {
      handleClosePolygon();
    }
  };

  // 区域选择器确认
  const handleRegionPickerSelect = (index: number) => {
    if (index >= 0 && index < regionPickerOptions.length) {
      setDrawing(prev => prev ? { ...prev, points: regionPickerOptions[index] } : null);
      setShowDialog(true);
    }
    setShowRegionPicker(false);
    setRegionPickerOptions([]);
  };

  // 区域选择器取消
  const handleRegionPickerCancel = () => {
    setShowRegionPicker(false);
    setRegionPickerOptions([]);
    setDrawing(null);
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
          {tool === 'draw-region' && drawing.targetContinentId && (
            <span style={{ marginRight: '8px', color: '#60a5fa' }}>
              📍 {continents.find(c => c.id === drawing.targetContinentId)?.name || '未知大陆'}
            </span>
          )}
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

      {/* Region Picker - 当折线分割大陆时让用户选择区域 */}
      {showRegionPicker && regionPickerOptions.length >= 2 && (
        <div className="map-dialog-overlay">
          <div className="map-dialog">
            <h3>🎯 选择区域</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              折线将边界分为两部分，请选择要创建的区域：
            </p>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              {regionPickerOptions.map((polygon, index) => {
                const center = getCenter(polygon);
                const area = Math.round(polygonArea(polygon));
                return (
                  <button
                    key={index}
                    className="region-picker-option"
                    onClick={() => handleRegionPickerSelect(index)}
                    style={{
                      flex: 1,
                      padding: '16px',
                      backgroundColor: 'var(--color-bg-primary)',
                      border: '2px solid var(--color-border)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-accent)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                      {index === 0 ? '◀' : '▶'}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                      区域 {index === 0 ? 'A' : 'B'}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.6 }}>
                      {area} 平方像素
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="map-dialog-actions">
              <button className="btn btn-secondary" onClick={handleRegionPickerCancel}>
                取消
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
//绘制网格
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
//绘制多边形
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
    plains: 'rgba(101, 163, 13, 0.25)',       // 平原 - 草绿
    mountains: 'rgba(120, 113, 108, 0.35)',   // 山脉 - 深灰
    forest: 'rgba(22, 101, 52, 0.35)',        // 森林 - 深绿
    desert: 'rgba(234, 179, 8, 0.3)',         // 沙漠 - 金黄
    ocean: 'rgba(59, 130, 246, 0.35)',        // 海洋 - 蓝色
    swamp: 'rgba(101, 163, 13, 0.3)',         // 沼泽 - 暗绿
    tundra: 'rgba(147, 197, 253, 0.3)',       // 冻原 - 浅蓝
    hills: 'rgba(161, 98, 7, 0.3)',           // 丘陵 - 棕色
    jungle: 'rgba(22, 163, 74, 0.35)',        // 丛林 - 翠绿
    wasteland: 'rgba(120, 113, 108, 0.2)',    // 荒地 - 灰褐
    basin: 'rgba(245, 158, 11, 0.25)',        // 盆地 - 橙黄
    plateau: 'rgba(180, 83, 9, 0.3)',         // 高原 - 赭石
    valley: 'rgba(34, 197, 94, 0.3)',         // 山谷 - 青绿
    canyon: 'rgba(185, 28, 28, 0.25)',        // 峡谷 - 红褐
    coast: 'rgba(20, 184, 166, 0.3)',         // 海岸 - 青色
    volcano: 'rgba(239, 68, 68, 0.35)',       // 火山 - 红色
    glacier: 'rgba(186, 230, 253, 0.4)',      // 冰川 - 冰蓝
    oasis: 'rgba(34, 211, 238, 0.4)',         // 绿洲 - 亮蓝
  };
  return colors[terrain] || 'rgba(100, 116, 139, 0.15)';
}

function getTerrainLabel(terrain: string): string {
  const labels: Record<string, string> = {
    plains: '🌾 平原',
    mountains: '⛰️ 山脉',
    forest: '🌲 森林',
    desert: '🏜️ 沙漠',
    ocean: '🌊 海洋',
    swamp: '🌿 沼泽',
    tundra: '❄️ 冻原',
    hills: '⛰️ 丘陵',
    jungle: '🌴 丛林',
    wasteland: '🪨 荒地',
    basin: '🥣 盆地',
    plateau: '🏔️ 高原',
    valley: '🏞️ 山谷',
    canyon: '🪨 峡谷',
    coast: '🏖️ 海岸',
    volcano: '🌋 火山',
    glacier: '🧊 冰川',
    oasis: '💧 绿洲',
  };
  return labels[terrain] || terrain;
}

function getCursor(tool: ToolMode): string {
  switch (tool) {
    case 'pan': return 'grab';
    case 'draw-continent':
    case 'draw-region':
    case 'add-location': return 'crosshair';
    case 'edit-polygon': return 'move';
    default: return 'default';
  }
}

// ============================================
// 边缘贴合辅助函数
// ============================================

// 点到线段的距离
function pointToSegmentDistance(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.sqrt((p.x - projX) ** 2 + (p.y - projY) ** 2);
}

// 检测点是否在多边形边缘上（距离小于阈值）
function isPointOnEdge(
  point: { x: number; y: number },
  polygon: { x: number; y: number }[],
  threshold: number = 10
): boolean {
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    if (pointToSegmentDistance(point, polygon[i], polygon[j]) < threshold) {
      return true;
    }
  }
  return false;
}

// 计算点在边缘上的投影位置（边索引 + 参数 t）
function projectPointToEdge(
  point: { x: number; y: number },
  polygon: { x: number; y: number }[]
): { edgeIndex: number; t: number; dist: number; point: { x: number; y: number } } | null {
  let best: { edgeIndex: number; t: number; dist: number; point: { x: number; y: number } } | null = null;

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const a = polygon[i];
    const b = polygon[j];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) continue;

    let t = ((point.x - a.x) * dx + (point.y - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = a.x + t * dx;
    const projY = a.y + t * dy;
    const dist = Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);

    if (!best || dist < best.dist) {
      best = { edgeIndex: i, t, dist, point: { x: projX, y: projY } };
    }
  }

  return best;
}

// 获取多边形边界上两点之间的线段（沿边界正向）
function getBoundarySegment(
  polygon: { x: number; y: number }[],
  start: { edgeIndex: number; t: number },
  end: { edgeIndex: number; t: number }
): { x: number; y: number }[] {
  const segment: { x: number; y: number }[] = [];
  const n = polygon.length;

  // 添加起点投影
  const startEdge = polygon[start.edgeIndex];
  const startNext = polygon[(start.edgeIndex + 1) % n];
  segment.push({
    x: startEdge.x + start.t * (startNext.x - startEdge.x),
    y: startEdge.y + start.t * (startNext.y - startEdge.y),
  });

  // 沿边界正向走到终点
  let i = (start.edgeIndex + 1) % n;
  const endIdx = end.edgeIndex;
  while (i !== (endIdx + 1) % n) {
    segment.push(polygon[i]);
    i = (i + 1) % n;
  }

  // 添加终点投影
  const endEdge = polygon[end.edgeIndex];
  const endNext = polygon[(end.edgeIndex + 1) % n];
  segment.push({
    x: endEdge.x + end.t * (endNext.x - endEdge.x),
    y: endEdge.y + end.t * (endNext.y - endEdge.y),
  });

  return segment;
}

// 检测绘制中的多边形是否与大陆边缘相交
function detectEdgeSnap(
  drawingPoints: { x: number; y: number }[],
  targetContinentId: string,
  continents: Continent[]
): { type: 'continent'; id: string; start: { edgeIndex: number; t: number }; end: { edgeIndex: number; t: number } } | null {
  if (drawingPoints.length < 2) return null;

  const continent = continents.find(c => c.id === targetContinentId);
  if (!continent || continent.bounds.points.length < 3) return null;

  // 检查起点是否在大陆边缘
  const startProj = projectPointToEdge(drawingPoints[0], continent.bounds.points);
  if (!startProj || startProj.dist > 15) return null;

  // 检查终点（最后一个点）是否在大陆边缘
  const lastPoint = drawingPoints[drawingPoints.length - 1];
  const endProj = projectPointToEdge(lastPoint, continent.bounds.points);
  if (!endProj || endProj.dist > 15) return null;

  // 确保起点和终点不是同一点
  if (startProj.edgeIndex === endProj.edgeIndex && Math.abs(startProj.t - endProj.t) < 0.05) return null;

  return {
    type: 'continent',
    id: targetContinentId,
    start: { edgeIndex: startProj.edgeIndex, t: startProj.t },
    end: { edgeIndex: endProj.edgeIndex, t: endProj.t },
  };
}

// 检测绘制中的多边形是否与其他区域边缘相交
function detectRegionEdgeSnap(
  drawingPoints: { x: number; y: number }[],
  targetContinentId: string,
  regions: Region[]
): { type: 'region'; id: string; start: { edgeIndex: number; t: number }; end: { edgeIndex: number; t: number } } | null {
  if (drawingPoints.length < 2) return null;

  // 查找同大陆的其他区域
  const siblingRegions = regions.filter(
    r => r.continentId === targetContinentId
  );

  for (const region of siblingRegions) {
    if (region.bounds.points.length < 3) continue;

    const startProj = projectPointToEdge(drawingPoints[0], region.bounds.points);
    if (!startProj || startProj.dist > 15) continue;

    const lastPoint = drawingPoints[drawingPoints.length - 1];
    const endProj = projectPointToEdge(lastPoint, region.bounds.points);
    if (!endProj || endProj.dist > 15) continue;

    if (startProj.edgeIndex === endProj.edgeIndex && Math.abs(startProj.t - endProj.t) < 0.05) continue;

    return {
      type: 'region',
      id: region.id,
      start: { edgeIndex: startProj.edgeIndex, t: startProj.t },
      end: { edgeIndex: endProj.edgeIndex, t: endProj.t },
    };
  }

  return null;
}
