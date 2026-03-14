import React, { useState, useCallback, useRef } from 'react';
import type { MapRegion, LocationInfo } from './map-types';
import { MAPS } from './map-types';
import { MapOverlay } from './MapOverlay';
import { MapTooltip } from './MapTooltip';

interface WorldMapProps {
  regions: MapRegion[];
  locations: Record<string, LocationInfo>;
  baseUrl: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.3;

export default function WorldMap({ regions, locations, baseUrl }: WorldMapProps) {
  const [activeMapId, setActiveMapId] = useState('wanun');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchDist = useRef<number | null>(null);

  const activeMap = MAPS.find((m) => m.id === activeMapId)!;
  const activeRegions = regions.filter((r) => r.mapId === activeMapId);

  const selectedRegion = selectedRegionId
    ? regions.find((r) => r.id === selectedRegionId) ?? null
    : null;
  const selectedLocation = selectedRegion
    ? locations[selectedRegion.locationSlug] ?? null
    : null;

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
      const newZoom = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, zoom + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)),
      );
      if (newZoom !== zoom) {
        setZoom(newZoom);
        setPan((p) => clampPan(p.x, p.y, newZoom));
      }
    },
    [zoom, clampPan],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      panOffset.current = { ...pan };
    },
    [pan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      setTooltipPos({ x: e.clientX, y: e.clientY });
      if (!isPanning || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((e.clientX - panStart.current.x) / rect.width) * 100;
      const dy = ((e.clientY - panStart.current.y) / rect.height) * 100;
      setPan(clampPan(panOffset.current.x + dx, panOffset.current.y + dy, zoom));
    },
    [isPanning, zoom, clampPan],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        setIsPanning(true);
        panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        panOffset.current = { ...pan };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
      }
    },
    [pan],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
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
        const scale = dist / lastTouchDist.current;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * scale));
        setZoom(newZoom);
        setPan((p) => clampPan(p.x, p.y, newZoom));
        lastTouchDist.current = dist;
      }
    },
    [isPanning, zoom, clampPan],
  );

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    lastTouchDist.current = null;
  }, []);

  // Reset zoom/pan when switching maps
  const switchMap = useCallback((mapId: string) => {
    setActiveMapId(mapId);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedRegionId(null);
    setHoveredRegionId(null);
  }, []);

  const handleRegionEnter = useCallback((id: string) => {
    setHoveredRegionId(id);
  }, []);

  const handleRegionLeave = useCallback(() => {
    setHoveredRegionId(null);
  }, []);

  const handleRegionClick = useCallback((id: string) => {
    setSelectedRegionId((prev) => (prev === id ? null : id));
  }, []);

  const navigateToLocation = useCallback(() => {
    if (selectedLocation) {
      window.location.href = selectedLocation.href;
    }
  }, [selectedLocation]);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const hoveredRegion = hoveredRegionId
    ? regions.find((r) => r.id === hoveredRegionId) ?? null
    : null;

  return (
    <div className="relative">
      {/* Controls Bar */}
      <div className="mb-3 flex flex-wrap items-center gap-4">
        {/* Map Selector Tabs */}
        <div className="flex flex-wrap gap-2">
          {MAPS.map((m) => (
            <button
              key={m.id}
              onClick={() => !m.placeholder && switchMap(m.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                m.placeholder
                  ? 'cursor-not-allowed border border-border bg-surface/50 text-text-muted'
                  : activeMapId === m.id
                    ? 'bg-accent text-bg'
                    : 'border border-border bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
              disabled={m.placeholder}
              title={m.placeholder ? 'Map coming soon' : undefined}
            >
              {m.label}
              {m.placeholder && (
                <span className="ml-1 text-xs opacity-60">(Coming Soon)</span>
              )}
            </button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <button
            onClick={() => {
              const z = Math.max(MIN_ZOOM, zoom - ZOOM_STEP);
              setZoom(z);
              setPan((p) => clampPan(p.x, p.y, z));
            }}
            className="rounded border border-border bg-surface px-2 py-1 hover:bg-surface-hover"
          >
            -
          </button>
          <span className="w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => {
              const z = Math.min(MAX_ZOOM, zoom + ZOOM_STEP);
              setZoom(z);
              setPan((p) => clampPan(p.x, p.y, z));
            }}
            className="rounded border border-border bg-surface px-2 py-1 hover:bg-surface-hover"
          >
            +
          </button>
          {zoom > 1 && (
            <button
              onClick={resetView}
              className="rounded border border-border bg-surface px-2 py-1 text-xs hover:bg-surface-hover"
            >
              Reset
            </button>
          )}
          <span className="ml-2 text-xs text-text-muted">
            Scroll to zoom, drag to pan
          </span>
        </div>
      </div>

      {/* Map Container — fills most of the viewport */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg border border-border bg-black"
        style={{
          height: '80vh',
          cursor: isPanning ? 'grabbing' : zoom > 1 ? 'grab' : 'default',
        }}
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
          className="relative flex h-full w-full items-center justify-center"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}%, ${pan.y / zoom}%)`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          {/* Image wrapper — maintains aspect ratio for overlay alignment */}
          <div
            className="relative"
            style={{
              width: '100%',
              maxHeight: '80vh',
              aspectRatio: `${activeMap.width} / ${activeMap.height}`,
            }}
          >
            <img
              src={`${baseUrl}maps/${activeMap.imageFile}`}
              alt={`Map of ${activeMap.label}`}
              className="block h-full w-full select-none object-contain"
              draggable={false}
            />
            <MapOverlay
              regions={activeRegions}
              hoveredId={hoveredRegionId}
              selectedId={selectedRegionId}
              onRegionEnter={handleRegionEnter}
              onRegionLeave={handleRegionLeave}
              onRegionClick={handleRegionClick}
            />
          </div>
        </div>
      </div>

      {/* Floating Detail Panel */}
      {selectedRegion && (
        <div className="absolute right-4 top-16 z-10 w-64 rounded-lg border border-border bg-surface/95 p-4 shadow-lg backdrop-blur-sm">
          <button
            onClick={() => setSelectedRegionId(null)}
            className="absolute right-2 top-2 text-text-muted hover:text-text-primary"
            aria-label="Close"
          >
            &times;
          </button>
          {selectedLocation ? (
            <div>
              <h3 className="font-serif text-base font-semibold text-text-primary">
                {selectedRegion.label}
              </h3>
              <p className="mt-1 text-sm capitalize text-text-secondary">
                {selectedLocation.locationType.replace('-', ' ')}
                {selectedLocation.continent && ` \u2014 ${selectedLocation.continent}`}
              </p>
              <button
                onClick={navigateToLocation}
                className="mt-3 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent/80"
              >
                View Codex Entry
              </button>
            </div>
          ) : (
            <div>
              <h3 className="font-serif text-base font-semibold text-text-primary">
                {selectedRegion.label}
              </h3>
              <p className="mt-1 text-sm text-text-muted italic">
                No codex entry yet
              </p>
            </div>
          )}
        </div>
      )}

      {/* Region List (collapsed below map) */}
      <div className="mt-3">
        <details className="rounded-lg border border-border bg-surface">
          <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary">
            {activeMap.label} Regions ({activeRegions.length})
          </summary>
          <div className="flex flex-wrap gap-2 px-4 pb-3 pt-1">
            {activeRegions.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRegionId(r.id === selectedRegionId ? null : r.id)}
                className={`rounded px-3 py-1 text-sm transition-colors ${
                  r.id === selectedRegionId
                    ? 'bg-accent text-bg'
                    : 'border border-border text-text-secondary hover:text-accent'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </details>
      </div>

      {/* Tooltip */}
      {hoveredRegion && !isPanning && (
        <MapTooltip
          label={hoveredRegion.label}
          x={tooltipPos.x}
          y={tooltipPos.y}
        />
      )}
    </div>
  );
}
