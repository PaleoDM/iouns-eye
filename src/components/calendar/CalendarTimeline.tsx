import React from 'react';

const W = 1000;
const H = 220;
const LINE_Y = 110;
const MIN_YEAR = 878;
const MAX_YEAR = 1142;
const MARGIN_X = 40;
const USABLE_W = W - MARGIN_X * 2;

function yearToX(year: number): number {
  return MARGIN_X + ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * USABLE_W;
}

// Curated campaign milestones.
// stem: length of the vertical line from the baseline dot.
// above: true = label above baseline, false = below.
// Staggered so close milestones (1077–1094 cluster) don't overlap.
const MILESTONES = [
  { id: 'fall-of-kalari',   label: 'Fall of Kalari',         year: 896,  above: true,  stem: 40 },
  { id: 'founding-ishetar', label: 'Founding of Ishetar',    year: 1077, above: false, stem: 70 },
  { id: 'ishetar-1',        label: 'Ishetar Campaign I',     year: 1082, above: true,  stem: 70 },
  { id: 'kalari',           label: 'Kalari Campaign',        year: 1088, above: false, stem: 30 },
  { id: 'one-last-job',     label: 'One Last Job',           year: 1094, above: true,  stem: 30 },
  { id: 'rifthaven',        label: 'Rifthaven Campaign',     year: 1127, above: false, stem: 55 },
  { id: 'ishetar-2',        label: 'Ishetar Campaign II',    year: 1136, above: true,  stem: 55 },
];

export function CalendarTimeline() {
  return (
    <div>
      <h2 className="text-2xl font-serif text-accent mb-2">World History</h2>
      <p className="text-text-secondary mb-4 max-w-3xl text-sm leading-relaxed">
        The Third Age, known among Arcanists as the Age of Reason and the clergy as the Age of Harmony,
        officially marks the end of the Discordant Delta. It represents a revival of civic and industrious
        magics, and a renewed globalization of world cultures.
      </p>
    <div className="rounded-lg border border-border bg-surface p-4">

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ display: 'block' }}>

        {/* Baseline */}
        <line
          x1={MARGIN_X} y1={LINE_Y}
          x2={W - MARGIN_X} y2={LINE_Y}
          stroke="#3a3a5a" strokeWidth={1}
        />

        {/* Milestones */}
        {MILESTONES.map(({ id, label, year, above, stem }) => {
          const x = yearToX(year);
          const stemEndY = above ? LINE_Y - stem : LINE_Y + stem;
          const yearY    = above ? stemEndY - 4  : stemEndY + 14;
          const nameY    = above ? stemEndY - 17 : stemEndY + 27;

          return (
            <g key={id}>
              {/* Stem */}
              <line
                x1={x} y1={LINE_Y}
                x2={x} y2={stemEndY}
                stroke="#5a5a7a" strokeWidth={1}
              />
              {/* Dot */}
              <circle
                cx={x} cy={LINE_Y}
                r={5}
                fill="#c4a035"
                stroke="#e0b840"
                strokeWidth={1}
              />
              {/* Year */}
              <text
                x={x} y={yearY}
                textAnchor="middle"
                fill="#6a6a9a"
                fontSize={10}
              >
                {year} TA
              </text>
              {/* Campaign name */}
              <text
                x={x} y={nameY}
                textAnchor="middle"
                fill="#c0c0d8"
                fontSize={13}
                fontFamily="serif"
              >
                {label}
              </text>
            </g>
          );
        })}

      </svg>
    </div>
    </div>
  );
}
