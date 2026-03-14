import React from 'react';

interface MapTooltipProps {
  label: string;
  x: number;
  y: number;
}

export function MapTooltip({ label, x, y }: MapTooltipProps) {
  return (
    <div
      className="pointer-events-none fixed z-50 rounded-lg border border-border bg-surface px-3 py-2 shadow-lg"
      style={{
        left: x + 16,
        top: y - 8,
      }}
    >
      <p className="font-serif text-sm font-semibold text-text-primary">{label}</p>
    </div>
  );
}
