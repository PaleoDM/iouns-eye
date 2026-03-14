import React from 'react';
import { SEASON_MONTHS, SEASON_COLORS } from './calendar-utils';

export function CalendarLegend() {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 text-sm">
      <h3 className="mb-3 font-serif text-base text-text-primary">Legend</h3>

      {/* Seasons */}
      <div className="mb-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">Seasons</p>
        <div className="flex flex-wrap gap-3">
          {SEASON_MONTHS.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: SEASON_COLORS[s.name] }}
              />
              <span className="text-text-primary">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tides */}
      <div className="mb-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">Tides</p>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-summer opacity-40" />
            <span className="text-text-primary">King Tides</span>
            <span className="text-text-secondary">(days 19–23, full moons)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-winter opacity-40" />
            <span className="text-text-primary">Fool Tides</span>
            <span className="text-text-secondary">(days 5–9, new moons)</span>
          </div>
        </div>
      </div>

      {/* Moon Phases */}
      <div className="mb-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">Moon Phases</p>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="5" fill="none" stroke="#8888aa" strokeWidth="1" />
            </svg>
            <span className="text-text-primary">New</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="5" fill="none" stroke="#8888aa" strokeWidth="0.5" />
              <path d="M 6 1 A 5 5 0 0 1 6 11 L 6 1 Z" fill="#c0c0b0" />
            </svg>
            <span className="text-text-primary">First Qtr</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="5" fill="#e0e0d0" stroke="#8888aa" strokeWidth="0.5" />
            </svg>
            <span className="text-text-primary">Full</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="5" fill="none" stroke="#8888aa" strokeWidth="0.5" />
              <path d="M 6 1 A 5 5 0 0 0 6 11 L 6 1 Z" fill="#c0c0b0" />
            </svg>
            <span className="text-text-primary">Last Qtr</span>
          </div>
        </div>
      </div>

      {/* Holy Days */}
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">Markers</p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: '#f0d060' }}>◆</span>
          <span className="text-text-primary">Holy Day</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-accent opacity-50" />
          <span className="text-text-primary">Selected Day</span>
        </div>
      </div>
    </div>
  );
}
