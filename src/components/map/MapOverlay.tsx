import React from 'react';
import type { MapRegion } from './map-types';

interface MapOverlayProps {
  regions: MapRegion[];
  hoveredId: string | null;
  selectedId: string | null;
  onRegionEnter: (id: string) => void;
  onRegionLeave: () => void;
  onRegionClick: (id: string) => void;
}

export function MapOverlay({
  regions,
  hoveredId,
  selectedId,
  onRegionEnter,
  onRegionLeave,
  onRegionClick,
}: MapOverlayProps) {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ pointerEvents: 'none' }}
    >
      {regions.map((region) => {
        const isHovered = hoveredId === region.id;
        const isSelected = selectedId === region.id;
        const points = region.polygon.map(([x, y]) => `${x},${y}`).join(' ');

        return (
          <polygon
            key={region.id}
            points={points}
            fill={
              isSelected
                ? 'rgba(217, 175, 103, 0.35)'
                : isHovered
                  ? 'rgba(217, 175, 103, 0.2)'
                  : 'rgba(217, 175, 103, 0.05)'
            }
            stroke={
              isSelected
                ? 'rgba(217, 175, 103, 0.8)'
                : isHovered
                  ? 'rgba(217, 175, 103, 0.5)'
                  : 'rgba(217, 175, 103, 0.15)'
            }
            strokeWidth={isSelected ? 0.4 : 0.2}
            style={{ pointerEvents: 'all', cursor: 'pointer' }}
            onMouseEnter={() => onRegionEnter(region.id)}
            onMouseLeave={onRegionLeave}
            onClick={() => onRegionClick(region.id)}
          />
        );
      })}
    </svg>
  );
}
