import React, { useId, useMemo, useState } from 'react';
import {
  VIEWBOX, CX, CY, R, PALETTE, AGE_EPITHETS,
  polar, wedge, uprightRot, monthAngles, seasonBlocks, seasonOf, seasonColor,
  type CalendarData, type Month,
} from './calendar-utils';

interface Props {
  calendarData: CalendarData;
  /** 'north' (default) or 'south' (austral — flips seasons). */
  hemisphere?: 'north' | 'south';
  /** Year shown in the center. */
  year: number;
  /** Age label, e.g. "Third Age" — drives the curved epithets. */
  ageLabel?: string;
  /** Wheel height as a % of viewport height (square; width follows). */
  vh?: number;
}

const MOON_LIT = '#e8e8d8';
const MOON_EDGE = '#8a8aa8';

export default function AstorianCalendar({
  calendarData,
  hemisphere = 'north',
  year,
  ageLabel = 'Third Age',
  vh = 80,
}: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<Month | null>(null);
  const uid = useId().replace(/:/g, '');

  const { months, seasons, tides } = calendarData;
  const daysPerMonth = calendarData.days_per_month;
  const wk = calendarData.days_per_week;
  const rows = daysPerMonth / wk;
  const degMonth = 360 / months.length;
  const degDay = degMonth / wk;
  const rowH = (R.dayOut - R.dayIn) / rows;

  const blocks = useMemo(() => seasonBlocks(seasons, hemisphere), [seasons, hemisphere]);
  const epithets = AGE_EPITHETS[ageLabel];

  // --- wheel pieces ---------------------------------------------------------
  const seasonRing = blocks.map((b) => {
    const a0 = (b.months[0] - 1) * degMonth;
    const a1 = b.months[b.months.length - 1] * degMonth;
    const mid = (a0 + a1) / 2;
    const [lx, ly] = polar((R.seasonIn + R.seasonOut) / 2, mid);
    return (
      <g key={`s-${b.name}`}>
        <path d={wedge(R.seasonIn, R.seasonOut, a0, a1)} fill={b.color} opacity={0.9} stroke={PALETTE.ink} strokeWidth={1} />
        <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fill="#10101a" fontSize={15} fontWeight={700} letterSpacing={2} fontFamily="Georgia, serif" transform={`rotate(${uprightRot(mid)} ${lx} ${ly})`}>
          {b.name.toUpperCase()}
        </text>
      </g>
    );
  });

  const monthRing = months.map((m) => {
    const [a0, a1] = monthAngles(m.number, degMonth);
    const mid = (a0 + a1) / 2;
    const color = seasonColor(seasons, seasonOf(m.season, hemisphere));
    const [lx, ly] = polar((R.monthIn + R.monthOut) / 2, mid);
    return (
      <g key={`m-${m.number}`}>
        <path d={wedge(R.monthIn, R.monthOut, a0, a1)} fill={color} opacity={0.18} stroke={PALETTE.grid} strokeWidth={0.5} />
        <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fill={PALETTE.text} fontSize={14} fontWeight={600} fontFamily="Georgia, serif" transform={`rotate(${uprightRot(mid)} ${lx} ${ly})`}>
          {m.name}
        </text>
      </g>
    );
  });

  const dayTints = months.map((m) => {
    const [a0, a1] = monthAngles(m.number, degMonth);
    const color = seasonColor(seasons, seasonOf(m.season, hemisphere));
    return <path key={`t-${m.number}`} d={wedge(R.dayIn, R.dayOut, a0, a1)} fill={color} opacity={0.1} />;
  });

  const weekRings = Array.from({ length: rows + 1 }, (_, k) => (
    <circle key={`w-${k}`} cx={CX} cy={CY} r={R.dayIn + k * rowH} fill="none" stroke={PALETTE.grid} strokeWidth={0.4} />
  ));

  const separators = Array.from({ length: months.length }, (_, i) => {
    const a = i * degMonth;
    const [xi, yi] = polar(R.dayIn, a);
    const [xo, yo] = polar(R.dayOut, a);
    return <line key={`sep-${i}`} x1={xi} y1={yi} x2={xo} y2={yo} stroke={PALETTE.grid} strokeWidth={0.8} />;
  });

  const dayNumbers = months.flatMap((m) => {
    const a0 = (m.number - 1) * degMonth;
    const holy = m.holy_day.day;
    return Array.from({ length: daysPerMonth }, (_, i) => {
      const d = i + 1;
      const row = Math.floor((d - 1) / wk); // 0 = innermost
      const col = (d - 1) % wk;
      const rMid = R.dayIn + (row + 0.5) * rowH;
      const aMid = a0 + (col + 0.5) * degDay;
      const [x, y] = polar(rMid, aMid);
      const isHoly = d === holy;
      return (
        <text key={`d-${m.number}-${d}`} x={x} y={y} textAnchor="middle" dominantBaseline="central"
          fill={isHoly ? PALETTE.holy : PALETTE.textDim}
          fontSize={isHoly ? 10 : 9.5} fontWeight={isHoly ? 700 : 400}>
          {d}
        </text>
      );
    });
  });

  // hover highlight + transparent click targets
  const monthHits = months.map((m) => {
    const [a0, a1] = monthAngles(m.number, degMonth);
    return (
      <path key={`hit-${m.number}`} d={wedge(R.center, R.seasonOut, a0, a1)}
        fill={hovered === m.number ? 'rgba(255,255,255,0.06)' : 'transparent'}
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => setHovered(m.number)}
        onMouseLeave={() => setHovered((h) => (h === m.number ? null : h))}
        onClick={() => setSelected(m)} />
    );
  });

  const ar = R.center - 27;
  const topPath = `M ${CX - ar} ${CY} A ${ar} ${ar} 0 0 1 ${CX + ar} ${CY}`;
  const botPath = `M ${CX - ar} ${CY} A ${ar} ${ar} 0 0 0 ${CX + ar} ${CY}`;

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
        <div className="lg:flex-1 lg:min-w-0">
          <div className="mx-auto" style={{ width: `min(${vh}vh, 100%)`, aspectRatio: '1 / 1' }}>
          <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} style={{ width: '100%', height: '100%', display: 'block' }} fontFamily="system-ui, sans-serif">
            <rect x={0} y={0} width={VIEWBOX} height={VIEWBOX} fill={PALETTE.ink} rx={12} />
            {seasonRing}
            {monthRing}
            {dayTints}
            {weekRings}
            <circle cx={CX} cy={CY} r={R.dayIn} fill="none" stroke={PALETTE.grid} strokeWidth={0.4} />
            <circle cx={CX} cy={CY} r={R.dayOut} fill="none" stroke={PALETTE.grid} strokeWidth={0.4} />
            {separators}
            {dayNumbers}

            {/* center */}
            <circle cx={CX} cy={CY} r={R.center} fill={PALETTE.panel} stroke={PALETTE.grid} strokeWidth={1} />
            {epithets && (
              <>
                <defs>
                  <path id={`${uid}-top`} d={topPath} />
                  <path id={`${uid}-bot`} d={botPath} />
                </defs>
                <text fill={PALETTE.textDim} fontSize={13} fontStyle="italic" fontFamily="Georgia, serif">
                  <textPath href={`#${uid}-top`} startOffset="50%" textAnchor="middle" dy={17}>{epithets[0]}</textPath>
                </text>
                <text fill={PALETTE.textDim} fontSize={13} fontStyle="italic" fontFamily="Georgia, serif">
                  <textPath href={`#${uid}-bot`} startOffset="50%" textAnchor="middle" dy={-8}>{epithets[1]}</textPath>
                </text>
              </>
            )}
            <text x={CX} y={CY - 7} textAnchor="middle" dominantBaseline="central" fill={PALETTE.text} fontSize={34} fontWeight={700} fontFamily="Georgia, serif">{year}</text>
            <text x={CX} y={CY + 20} textAnchor="middle" dominantBaseline="central" fill={PALETTE.textDim} fontSize={11} letterSpacing={2}>{ageLabel.toUpperCase()}</text>

            {monthHits}
          </svg>
          </div>
        </div>

        {/* Key */}
        <aside className="w-full lg:w-72 shrink-0 rounded-xl border border-border bg-surface p-5 text-sm">
          <KeySection title="Seasons">
            {blocks.map((b) => (
              <Row key={b.name}>
                <span className="inline-block h-4 w-4 rounded-sm" style={{ background: b.color }} />
                {b.name}
              </Row>
            ))}
          </KeySection>
          <KeySection title="Holy Days">
            <Row>
              <span className="inline-flex h-4 w-4 items-center justify-center font-bold" style={{ color: PALETTE.holy, fontSize: 13 }}>14</span>
              Deity holy day
            </Row>
          </KeySection>
          <KeySection title="Moons">
            <Row><Moon kind="full" /> Full Moon (21st)</Row>
            <Row><Moon kind="new" /> New Moon (7th)</Row>
          </KeySection>
          <KeySection title="Tides">
            <div className="mb-2">
              <div className="font-semibold text-text-primary">King Tides (19th–23rd)</div>
              <p className="text-text-secondary text-xs leading-relaxed mt-0.5">Strongest tides that peak with the full moon.</p>
            </div>
            <div>
              <div className="font-semibold text-text-primary">Fool Tides (5th–9th)</div>
              <p className="text-text-secondary text-xs leading-relaxed mt-0.5">Weakest tides that lull during the new moon.</p>
            </div>
          </KeySection>
          <p className="text-xs italic text-text-secondary mt-1">
            Hemisphere: {hemisphere === 'north' ? 'Northern (temperate)' : 'Austral (southern)'}
          </p>
        </aside>
      </div>

      {/* Month detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button className="absolute right-3 top-2 text-xl text-text-secondary hover:text-text-primary" onClick={() => setSelected(null)} aria-label="Close">×</button>
            <h2 className="font-serif text-2xl text-text-primary">{selected.name}</h2>
            {selected.deity_title && (
              <div className="mb-4 text-sm italic text-text-secondary">
                {selected.deity_title.charAt(0).toUpperCase() + selected.deity_title.slice(1)}
              </div>
            )}
            <div className="mb-3 text-sm font-semibold" style={{ color: PALETTE.holy }}>
              {selected.holy_day.name} · Day {selected.holy_day.day}
            </div>
            <p className="text-sm leading-relaxed text-text-secondary">{selected.lore ?? selected.holy_day.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function KeySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 last:mb-2">
      <h3 className="mb-2 font-serif text-xs font-bold uppercase tracking-widest text-text-primary">{title}</h3>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="my-1.5 flex items-center gap-3 text-text-secondary">{children}</div>;
}

function Moon({ kind }: { kind: 'full' | 'new' }) {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" className="shrink-0">
      <circle cx={8} cy={8} r={6.5} fill={kind === 'full' ? MOON_LIT : 'none'} stroke={MOON_EDGE} strokeWidth={kind === 'full' ? 0.5 : 1.3} />
    </svg>
  );
}
