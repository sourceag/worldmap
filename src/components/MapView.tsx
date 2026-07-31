// ============================================
// MapView 地图视图
// ============================================

import { useRef, useEffect, useState, useCallback } from 'react';
import { useWorldStore } from '../store/worldStore';
import type { Continent, Region, Location } from '../types';
import '../App.css';

export function MapView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { continents, regions, locations, selectedEntityId, selectEntity } = useWorldStore();
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<'select' | 'pan' | 'add'>('select');

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    // Draw continents
    for (const continent of continents) {
      if (continent.bounds.points.length > 2) {
        ctx.beginPath();
        ctx.moveTo(continent.bounds.points[0].x, continent.bounds.points[0].y);
        for (let i = 1; i < continent.bounds.points.length; i++) {
          ctx.lineTo(continent.bounds.points[i].x, continent.bounds.points[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
        ctx.fill();
        ctx.strokeStyle = selectedEntityId === continent.id ? '#e94560' : '#475569';
        ctx.lineWidth = selectedEntityId === continent.id ? 3 : 1;
        ctx.stroke();

        // Label
        const center = getCenter(continent.bounds.points);
        ctx.fillStyle = '#e4e4e7';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(continent.name, center.x, center.y);
      }
    }

    // Draw regions
    for (const region of regions) {
      if (region.bounds.points.length > 2) {
        ctx.beginPath();
        ctx.moveTo(region.bounds.points[0].x, region.bounds.points[0].y);
        for (let i = 1; i < region.bounds.points.length; i++) {
          ctx.lineTo(region.bounds.points[i].x, region.bounds.points[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = getTerrainColor(region.terrain);
        ctx.fill();
        ctx.strokeStyle = selectedEntityId === region.id ? '#e94560' : '#334155';
        ctx.lineWidth = selectedEntityId === region.id ? 2 : 1;
        ctx.stroke();

        const center = getCenter(region.bounds.points);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(region.name, center.x, center.y);
      }
    }

    // Draw locations
    for (const location of locations) {
      const { x, y } = location.position;
      const isSelected = selectedEntityId === location.id;
      
      // Location marker
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 8 : 5, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#e94560' : '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#e4e4e7';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(location.name, x, y - 12);
    }

    ctx.restore();
  }, [continents, regions, locations, selectedEntityId, viewport]);

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
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewport((v) => ({ ...v, zoom: Math.max(0.1, Math.min(5, v.zoom * delta)) }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool === 'pan') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
    } else if (tool === 'select') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - viewport.x) / viewport.zoom;
      const y = (e.clientY - rect.top - viewport.y) / viewport.zoom;
      
      // Check if clicked on a location
      for (const location of locations) {
        const dx = location.position.x - x;
        const dy = location.position.y - y;
        if (Math.sqrt(dx * dx + dy * dy) < 10) {
          selectEntity('location', location.id);
          return;
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && tool === 'pan') {
      setViewport((v) => ({
        ...v,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="map-view">
      <canvas
        ref={canvasRef}
        className="map-canvas"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="map-toolbar">
        <button
          className={tool === 'select' ? 'active' : ''}
          onClick={() => setTool('select')}
        >
          👆 选择
        </button>
        <button
          className={tool === 'pan' ? 'active' : ''}
          onClick={() => setTool('pan')}
        >
          ✋ 平移
        </button>
        <button onClick={() => setViewport({ x: 0, y: 0, zoom: 1 })}>
          🔄 重置视图
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '12px', opacity: 0.6 }}>
          缩放: {Math.round(viewport.zoom * 100)}%
        </span>
      </div>
    </div>
  );
}

function getCenter(points: { x: number; y: number }[]): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
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
