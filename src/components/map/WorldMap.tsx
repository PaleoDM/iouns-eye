import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// Vite ?raw query imports the file as a string at build time. The world SVG
// is the canonical render produced by ../../../../Map Revamps/render_world.py
// and lives in src/data/world-map.svg.
import worldSvgRaw from '../../data/world-map.svg?raw';

interface WorldMapProps {
  // Kept for backwards-compatibility with the page that mounts this island.
  baseUrl: string;
}

// LOD thresholds (fraction of original viewBox width):
//   far    > 0.6   — world view; show only oceans, capitals, region labels
//   medium 0.15–0.6 — continent view; add towns, terrain, grid, feature labels
//   near   < 0.15  — settlement / hex detail; show everything
type ZoomTier = 'far' | 'medium' | 'near';
function tierFor(ratio: number): ZoomTier {
  if (ratio > 0.6) return 'far';
  if (ratio > 0.15) return 'medium';
  return 'near';
}

const MIN_ZOOM_OUT = 5;   // how far you can zoom OUT (vb_w multiplier of orig)
const MAX_ZOOM_IN_VBW = 30; // smallest vb width (~3 hexes wide)

export default function WorldMap(_props: WorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Parse the world SVG's original viewBox once.
  const originalViewBox = useMemo(() => {
    const m = worldSvgRaw.match(/viewBox="([^"]+)"/);
    if (!m) return [0, 0, 2479, 1573];
    return m[1].split(/\s+/).map(Number);
  }, []);

  // Inject our LOD class once and memoize. Without this, every React
  // re-render produces a new string reference, which causes
  // dangerouslySetInnerHTML to REPLACE the SVG element — leaving our
  // svgRef pointing at a detached node and breaking all subsequent
  // viewBox updates.
  const inlineSvg = useMemo(
    () => worldSvgRaw.replace(/<svg\b([^>]*)>/, '<svg$1 class="iouns-world-svg">'),
    [],
  );

  // Current viewBox state. We mutate the SVG element directly for performance
  // (no React re-render on every pan/zoom frame) and only update display state
  // (zoom %, LOD tier) via React.
  const vbRef = useRef<number[]>(originalViewBox.slice());
  const [zoomTier, setZoomTier] = useState<ZoomTier>(tierFor(1));
  const [zoomLabel, setZoomLabel] = useState('100%');

  const applyViewBox = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.setAttribute('viewBox', vbRef.current.join(' '));
    const ratio = vbRef.current[2] / originalViewBox[2];
    const tier = tierFor(ratio);
    setZoomTier((prev) => (prev === tier ? prev : tier));
    setZoomLabel(`${Math.round((1 / ratio) * 100)}%`);
    svg.dataset.zoom = tier;
  }, [originalViewBox]);

  // After mount, grab a reference to the inlined <svg> and initialize.
  useEffect(() => {
    const wrapper = svgWrapperRef.current;
    if (!wrapper) return;
    const svg = wrapper.querySelector('svg');
    if (!(svg instanceof SVGSVGElement)) return;
    svgRef.current = svg;
    vbRef.current = originalViewBox.slice();
    applyViewBox();
  }, [applyViewBox, originalViewBox]);

  // ---- Coord helper: screen point → SVG world coord ----
  const screenToSvg = useCallback((sx: number, sy: number): [number, number] => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return [0, 0];
    const rect = container.getBoundingClientRect();
    const [vbX, vbY, vbW, vbH] = vbRef.current;
    // SVG defaults to xMidYMid meet: content scaled uniformly + centered.
    const scaleX = rect.width / vbW;
    const scaleY = rect.height / vbH;
    const scale = Math.min(scaleX, scaleY);
    const drawnW = vbW * scale;
    const drawnH = vbH * scale;
    const offX = (rect.width - drawnW) / 2;
    const offY = (rect.height - drawnH) / 2;
    return [vbX + (sx - rect.left - offX) / scale, vbY + (sy - rect.top - offY) / scale];
  }, []);

  // ---- Wheel zoom ----
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = Math.pow(1.0015, -e.deltaY);
      const [mx, my] = screenToSvg(e.clientX, e.clientY);
      const vb = vbRef.current;
      const newW = vb[2] / zoomFactor;
      const newH = vb[3] / zoomFactor;
      const maxW = originalViewBox[2] * MIN_ZOOM_OUT;
      if (newW > maxW || newW < MAX_ZOOM_IN_VBW) return;
      vb[0] = mx - (mx - vb[0]) * (newW / vb[2]);
      vb[1] = my - (my - vb[1]) * (newH / vb[3]);
      vb[2] = newW;
      vb[3] = newH;
      applyViewBox();
    };
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [applyViewBox, originalViewBox, screenToSvg]);

  // ---- Mouse drag pan ----
  const draggingRef = useRef(false);
  const dragStartRef = useRef<[number, number] | null>(null);
  const [cursorClass, setCursorClass] = useState('cursor-grab');

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    draggingRef.current = true;
    dragStartRef.current = screenToSvg(e.clientX, e.clientY);
    setCursorClass('cursor-grabbing');
    e.preventDefault();
  }, [screenToSvg]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current || !dragStartRef.current) return;
      const [mx, my] = screenToSvg(e.clientX, e.clientY);
      const vb = vbRef.current;
      vb[0] -= mx - dragStartRef.current[0];
      vb[1] -= my - dragStartRef.current[1];
      applyViewBox();
    };
    const onUp = () => {
      draggingRef.current = false;
      dragStartRef.current = null;
      setCursorClass('cursor-grab');
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [applyViewBox, screenToSvg]);

  // ---- Touch (single-finger pan, pinch zoom) ----
  const touchStateRef = useRef<
    | { type: 'pan'; svg: [number, number] }
    | { type: 'pinch'; dist: number; cx: number; cy: number; vb: number[] }
    | null
  >(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStateRef.current = {
        type: 'pan',
        svg: screenToSvg(e.touches[0].clientX, e.touches[0].clientY),
      };
    } else if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      touchStateRef.current = {
        type: 'pinch',
        dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        cx: (a.clientX + b.clientX) / 2,
        cy: (a.clientY + b.clientY) / 2,
        vb: vbRef.current.slice(),
      };
    }
  }, [screenToSvg]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const state = touchStateRef.current;
    if (!state) return;
    e.preventDefault();
    if (state.type === 'pan' && e.touches.length === 1) {
      const [mx, my] = screenToSvg(e.touches[0].clientX, e.touches[0].clientY);
      const vb = vbRef.current;
      vb[0] -= mx - state.svg[0];
      vb[1] -= my - state.svg[1];
      applyViewBox();
    } else if (state.type === 'pinch' && e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const factor = state.dist / dist;
      const vb = vbRef.current;
      vb[2] = state.vb[2] * factor;
      vb[3] = state.vb[3] * factor;
      const [mx, my] = screenToSvg(state.cx, state.cy);
      vb[0] = mx - (mx - state.vb[0]) * factor;
      vb[1] = my - (my - state.vb[1]) * factor;
      applyViewBox();
    }
  }, [applyViewBox, screenToSvg]);

  const onTouchEnd = useCallback(() => {
    touchStateRef.current = null;
  }, []);

  // ---- Zoom buttons & reset ----
  const zoomBy = useCallback((factor: number) => {
    const vb = vbRef.current;
    const newW = vb[2] / factor;
    const newH = vb[3] / factor;
    const maxW = originalViewBox[2] * MIN_ZOOM_OUT;
    if (newW > maxW || newW < MAX_ZOOM_IN_VBW) return;
    const cx = vb[0] + vb[2] / 2;
    const cy = vb[1] + vb[3] / 2;
    vb[0] = cx - newW / 2;
    vb[1] = cy - newH / 2;
    vb[2] = newW;
    vb[3] = newH;
    applyViewBox();
  }, [applyViewBox, originalViewBox]);

  const reset = useCallback(() => {
    vbRef.current = originalViewBox.slice();
    applyViewBox();
  }, [applyViewBox, originalViewBox]);

  // Keyboard: '0' to reset.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '0') reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reset]);

  return (
    <div>
      {/* Controls + status */}
      <div className="mb-3 flex items-center gap-3 text-sm text-text-secondary">
        <span className="text-xs text-text-muted uppercase tracking-wider">
          Astoria · {zoomTier} zoom
        </span>
        <span className="ml-auto flex items-center gap-2">
          <button
            onClick={() => zoomBy(1 / 1.5)}
            className="rounded border border-border bg-surface px-2 py-1 hover:bg-surface-hover"
            aria-label="Zoom out"
          >−</button>
          <span className="w-14 text-center">{zoomLabel}</span>
          <button
            onClick={() => zoomBy(1.5)}
            className="rounded border border-border bg-surface px-2 py-1 hover:bg-surface-hover"
            aria-label="Zoom in"
          >+</button>
          <button
            onClick={reset}
            className="rounded border border-border bg-surface px-2 py-1 text-xs hover:bg-surface-hover"
          >Reset</button>
          <span className="ml-1 text-xs text-text-muted">Scroll to zoom · drag to pan</span>
        </span>
      </div>

      {/* Scoped LOD CSS: hide content not relevant at each zoom tier. */}
      <style>{`
        .iouns-world-svg[data-zoom="far"] .tier-town,
        .iouns-world-svg[data-zoom="far"] .tier-city,
        .iouns-world-svg[data-zoom="far"] .tier-village,
        .iouns-world-svg[data-zoom="far"] .labels-tier-town,
        .iouns-world-svg[data-zoom="far"] .labels-tier-city,
        .iouns-world-svg[data-zoom="far"] .labels-tier-village,
        .iouns-world-svg[data-zoom="far"] .labels-feature,
        .iouns-world-svg[data-zoom="far"] #terrain {
          display: none;
        }
        .iouns-world-svg[data-zoom="medium"] .tier-village,
        .iouns-world-svg[data-zoom="medium"] .labels-tier-village {
          display: none;
        }
      `}</style>

      {/* Map viewer */}
      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-lg border border-border bg-[#4a7fc1] ${cursorClass} select-none`}
        style={{ height: '80vh' }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          ref={svgWrapperRef}
          className="iouns-world-svg-wrapper h-full w-full [&_svg]:block [&_svg]:h-full [&_svg]:w-full [&_svg.iouns-world-svg]:cursor-inherit"
          dangerouslySetInnerHTML={{ __html: inlineSvg }}
        />
      </div>
    </div>
  );
}
