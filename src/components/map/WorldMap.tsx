import React, { useState, useCallback, useRef } from 'react';
import { MAPS, childMaps, getMap } from './map-types';

interface WorldMapProps {
  baseUrl: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.3;

// Top-level nav: world + the three continents
const TOP_NAV = MAPS.filter((m) => !m.parentId || m.parentId === 'world');

export default function WorldMap({ baseUrl }: WorldMapProps) {
  const [activeMapId, setActiveMapId] = useState('world');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchDist = useRef<number | null>(null);

  const activeMap = getMap(activeMapId)!;

  // Which top-level entry is selected (world or a continent)
  const activeTopId = activeMap.parentId === 'world'
    ? activeMapId          // continent selected
    : activeMap.parentId   // regional map — its parent is the continent
    ?? activeMapId;        // world selected

  // Regional maps for the currently selected continent
  const subMaps = childMaps(activeTopId === 'world' ? '' : activeTopId)
    .filter((m) => m.parentId !== 'world');

  const clampPan = useCallback(
    (px: number, py: number, z: number) => {
      if (z <= 1) return { x: 0, y: 0 };
      const maxPan = ((z - 1) / (2 * z)) * 100;
      return {
        x: Math.max(-maxPan, Math.min(maxPan, px)),
        y: Math.max(-maxPan, Math.min(maxPan, py)),
      };
    },
    [],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)));
      if (newZoom !== zoom) {
        setZoom(newZoom);
        setPan((p) => clampPan(p.x, p.y, newZoom));
      }
    },
    [zoom, clampPan],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY };
    panOffset.current = { ...pan };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - panStart.current.x) / rect.width) * 100;
    const dy = ((e.clientY - panStart.current.y) / rect.height) * 100;
    setPan(clampPan(panOffset.current.x + dx, panOffset.current.y + dy, zoom));
  }, [isPanning, zoom, clampPan]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panOffset.current = { ...pan };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, [pan]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && isPanning && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((e.touches[0].clientX - panStart.current.x) / rect.width) * 100;
      const dy = ((e.touches[0].clientY - panStart.current.y) / rect.height) * 100;
      setPan(clampPan(panOffset.current.x + dx, panOffset.current.y + dy, zoom));
    } else if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * (dist / lastTouchDist.current)));
      setZoom(newZoom);
      setPan((p) => clampPan(p.x, p.y, newZoom));
      lastTouchDist.current = dist;
    }
  }, [isPanning, zoom, clampPan]);

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    lastTouchDist.current = null;
  }, []);

  const switchMap = useCallback((mapId: string) => {
    setActiveMapId(mapId);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  return (
    <div>
      {/* Tier 1: World + Continents */}
      <div className="mb-1 flex flex-wrap gap-2">
        {TOP_NAV.map((m) => {
          const isActive = activeTopId === m.id || (m.id === 'world' && activeTopId === 'world');
          return (
            <button
              key={m.id}
              onClick={() => switchMap(m.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent text-bg'
                  : 'border border-border bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Tier 2: Regional sub-maps (only shown when a continent with children is selected) */}
      {subMaps.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 border-l-2 border-border pl-4">
          <span className="text-xs text-text-muted uppercase tracking-wider">Regions</span>
          {/* Also offer the full continent view */}
          <button
            onClick={() => switchMap(activeTopId)}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              activeMapId === activeTopId
                ? 'bg-accent/20 text-accent border border-accent/40'
                : 'border border-border bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            Full
          </button>
          {subMaps.map((m) => (
            <button
              key={m.id}
              onClick={() => switchMap(m.id)}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                activeMapId === m.id
                  ? 'bg-accent/20 text-accent border border-accent/40'
                  : 'border border-border bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Zoom controls + breadcrumb */}
      <div className="mb-3 flex items-center gap-3 text-sm text-text-secondary">
        <span className="text-xs text-text-muted">
          {activeMap.parentId === 'world'
            ? activeMap.label
            : activeMap.parentId
              ? `${getMap(activeMap.parentId)?.label} › ${activeMap.label}`
              : activeMap.label}
        </span>
        <span className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { const z = Math.max(MIN_ZOOM, zoom - ZOOM_STEP); setZoom(z); setPan((p) => clampPan(p.x, p.y, z)); }}
            className="rounded border border-border bg-surface px-2 py-1 hover:bg-surface-hover"
          >−</button>
          <span className="w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => { const z = Math.min(MAX_ZOOM, zoom + ZOOM_STEP); setZoom(z); setPan((p) => clampPan(p.x, p.y, z)); }}
            className="rounded border border-border bg-surface px-2 py-1 hover:bg-surface-hover"
          >+</button>
          {zoom > 1 && (
            <button onClick={resetView} className="rounded border border-border bg-surface px-2 py-1 text-xs hover:bg-surface-hover">
              Reset
            </button>
          )}
          <span className="ml-1 text-xs text-text-muted">Scroll to zoom · drag to pan</span>
        </span>
      </div>

      {/* Map viewer */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg border border-border bg-black"
        style={{ height: '80vh', cursor: isPanning ? 'grabbing' : zoom > 1 ? 'grab' : 'default' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}%, ${pan.y / zoom}%)`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <img
            src={`${baseUrl}maps/${activeMap.imageFile}`}
            alt={`Map of ${activeMap.label}`}
            className="block max-h-[80vh] max-w-full select-none object-contain"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
