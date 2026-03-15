import React from 'react';
import {
  CX, CY, RINGS, MONTHS_COUNT, DAYS_PER_MONTH, DAYS_PER_WEEK, WEEKS_PER_MONTH,
  DEG_PER_MONTH, SEASON_MONTHS, SEASON_COLORS, MOON_PHASES,
  KING_TIDE_DAYS, FOOL_TIDE_DAYS,
  polarToXY, describeWedge, describeArc, dayPosition, moonPosition,
  monthStartAngle, monthEndAngle, monthMidAngle, getSeasonColor,
  MONTH_NAMES,
} from './calendar-utils';

// --- Types for calendar data ---
export interface MonthData {
  number: number;
  name: string;
  deity_slug: string;
  season: string;
  holy_day: { name: string; day: number; description: string };
}

export interface CalendarData {
  months: MonthData[];
  seasons: { name: string; months: number[]; color: string }[];
  tides: {
    king_tides: { days: number[]; peak: number; description: string };
    fool_tides: { days: number[]; peak: number; description: string };
  };
}

// --- Season Ring (outermost) ---
export function SeasonRing() {
  return (
    <g className="season-ring">
      {SEASON_MONTHS.map((season) => {
        const startMonth = season.months[0];
        const endMonth = season.months[season.months.length - 1];
        const startAngle = monthStartAngle(startMonth);
        const endAngle = monthEndAngle(endMonth);
        const color = SEASON_COLORS[season.name];
        const midAngle = (startAngle + endAngle) / 2;
        const labelR = (RINGS.seasonInner + RINGS.seasonOuter) / 2;
        const labelPos = polarToXY(CX, CY, labelR, midAngle);

        return (
          <g key={season.name}>
            <path
              d={describeWedge(CX, CY, RINGS.seasonInner, RINGS.seasonOuter, startAngle, endAngle)}
              fill={color}
              opacity={0.85}
              stroke="#0f0f1a"
              strokeWidth={1}
            />
            <text
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#e0e0e0"
              fontSize={15}
              fontWeight={600}
              letterSpacing={1}
              transform={`rotate(${midAngle}, ${labelPos.x}, ${labelPos.y})`}
            >
              {season.name.toUpperCase()}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// --- Month Label Ring ---
export function MonthLabelRing({ months }: { months: MonthData[] }) {
  return (
    <g className="month-label-ring">
      {months.map((month) => {
        const startAngle = monthStartAngle(month.number);
        const endAngle = monthEndAngle(month.number);
        const midAngle = monthMidAngle(month.number);
        const color = getSeasonColor(month.number);
        const labelR = (RINGS.monthInner + RINGS.monthOuter) / 2;
        const labelPos = polarToXY(CX, CY, labelR, midAngle);

        // Flip text on the bottom half so it reads correctly
        const textRotation = midAngle > 90 && midAngle < 270
          ? midAngle + 180
          : midAngle;

        return (
          <g key={month.number}>
            {/* Background wedge */}
            <path
              d={describeWedge(CX, CY, RINGS.monthInner, RINGS.monthOuter, startAngle, endAngle)}
              fill={color}
              opacity={0.3}
              stroke="#2a2a4a"
              strokeWidth={0.5}
            />
            {/* Month name */}
            <text
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#e0e0e0"
              fontSize={13}
              fontWeight={600}
              fontFamily="serif"
              transform={`rotate(${textRotation}, ${labelPos.x}, ${labelPos.y})`}
            >
              {month.name}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// --- Day Grid Ring ---
interface DayGridProps {
  months: MonthData[];
  selectedDay: { monthNumber: number; day: number } | null;
  hoveredDay: { monthNumber: number; day: number } | null;
}

export function DayGridRing({ months, selectedDay, hoveredDay }: DayGridProps) {
  const rowHeight = (RINGS.dayOuter - RINGS.dayInner) / WEEKS_PER_MONTH;
  const colWidth = DEG_PER_MONTH / DAYS_PER_WEEK;

  return (
    <g className="day-grid-ring">
      {/* Month separator lines */}
      {Array.from({ length: MONTHS_COUNT }, (_, i) => {
        const angle = monthStartAngle(i + 1);
        const innerPt = polarToXY(CX, CY, RINGS.dayInner, angle);
        const outerPt = polarToXY(CX, CY, RINGS.monthOuter, angle);
        return (
          <line
            key={`sep-${i}`}
            x1={innerPt.x} y1={innerPt.y}
            x2={outerPt.x} y2={outerPt.y}
            stroke="#2a2a4a"
            strokeWidth={1}
          />
        );
      })}

      {/* Week row dividers */}
      {[1, 2, 3].map((row) => {
        const r = RINGS.dayInner + row * rowHeight;
        return (
          <circle
            key={`week-${row}`}
            cx={CX} cy={CY} r={r}
            fill="none"
            stroke="#2a2a4a"
            strokeWidth={0.3}
          />
        );
      })}

      {/* Day grid border circles */}
      <circle cx={CX} cy={CY} r={RINGS.dayInner} fill="none" stroke="#2a2a4a" strokeWidth={0.5} />
      <circle cx={CX} cy={CY} r={RINGS.dayOuter} fill="none" stroke="#2a2a4a" strokeWidth={0.5} />

      {/* Tide indicators + day numbers per month */}
      {months.map((month) => (
        <g key={`days-${month.number}`}>
          {Array.from({ length: DAYS_PER_MONTH }, (_, i) => {
            const day = i + 1;
            const pos = dayPosition(month.number, day);
            const isKingTide = KING_TIDE_DAYS.includes(day);
            const isFoolTide = FOOL_TIDE_DAYS.includes(day);
            const isHolyDay = month.holy_day.day === day;
            const isSelected = selectedDay?.monthNumber === month.number && selectedDay?.day === day;
            const isHovered = hoveredDay?.monthNumber === month.number && hoveredDay?.day === day;

            // Compute the wedge for this day cell (for background fill)
            const weekIndex = Math.floor((day - 1) / DAYS_PER_WEEK);
            const dayOfWeek = (day - 1) % DAYS_PER_WEEK;
            const cellStartAngle = monthStartAngle(month.number) + dayOfWeek * colWidth;
            const cellEndAngle = cellStartAngle + colWidth;
            const cellInnerR = RINGS.dayInner + weekIndex * rowHeight;
            const cellOuterR = cellInnerR + rowHeight;

            return (
              <g key={`${month.number}-${day}`}>
                {/* Tide background */}
                {(isKingTide || isFoolTide) && (
                  <path
                    d={describeWedge(CX, CY, cellInnerR, cellOuterR, cellStartAngle, cellEndAngle)}
                    fill={isKingTide ? '#c4a035' : '#3568a8'}
                    opacity={0.15}
                  />
                )}

                {/* Holy day background */}
                {isHolyDay && (
                  <path
                    d={describeWedge(CX, CY, cellInnerR, cellOuterR, cellStartAngle, cellEndAngle)}
                    fill={getSeasonColor(month.number)}
                    opacity={0.35}
                  />
                )}

                {/* Hover highlight */}
                {isHovered && !isSelected && (
                  <path
                    d={describeWedge(CX, CY, cellInnerR, cellOuterR, cellStartAngle, cellEndAngle)}
                    fill="#4a9eff"
                    opacity={0.2}
                  />
                )}

                {/* Selection highlight */}
                {isSelected && (
                  <path
                    d={describeWedge(CX, CY, cellInnerR, cellOuterR, cellStartAngle, cellEndAngle)}
                    fill="#4a9eff"
                    opacity={0.35}
                    stroke="#4a9eff"
                    strokeWidth={1.5}
                  />
                )}

                {/* Day number */}
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isHolyDay ? '#f0d060' : isSelected ? '#ffffff' : '#c0c0d0'}
                  fontSize={isHolyDay ? 12 : 11}
                  fontWeight={isHolyDay ? 700 : 400}
                >
                  {day}
                </text>

                {/* Holy day marker (small diamond below number) */}
                {isHolyDay && (
                  <text
                    x={pos.x}
                    y={pos.y + 10}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#f0d060"
                    fontSize={7}
                  >
                    ◆
                  </text>
                )}
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );
}

// --- Moon Phase Ring ---
export function MoonPhaseRing() {
  const moonR = 5;

  return (
    <g className="moon-phase-ring">
      {/* Ring border */}
      <circle cx={CX} cy={CY} r={RINGS.moonInner} fill="none" stroke="#2a2a4a" strokeWidth={0.5} />
      <circle cx={CX} cy={CY} r={RINGS.moonOuter} fill="none" stroke="#2a2a4a" strokeWidth={0.5} />

      {/* Background */}
      <circle cx={CX} cy={CY} r={(RINGS.moonInner + RINGS.moonOuter) / 2}
        fill="none" stroke="#1a1a2e" strokeWidth={RINGS.moonOuter - RINGS.moonInner} opacity={0.5} />

      {Array.from({ length: MONTHS_COUNT }, (_, mi) => {
        const monthNum = mi + 1;
        return MOON_PHASES.map(({ day, phase }) => {
          const pos = moonPosition(monthNum, day);
          return (
            <g key={`moon-${monthNum}-${day}`}>
              {phase === 'new' && (
                <circle cx={pos.x} cy={pos.y} r={moonR} fill="none" stroke="#8888aa" strokeWidth={1} />
              )}
              {phase === 'full' && (
                <circle cx={pos.x} cy={pos.y} r={moonR} fill="#e0e0d0" stroke="#8888aa" strokeWidth={0.5} />
              )}
              {phase === 'first-quarter' && (
                <>
                  <circle cx={pos.x} cy={pos.y} r={moonR} fill="none" stroke="#8888aa" strokeWidth={0.5} />
                  <path
                    d={`M ${pos.x} ${pos.y - moonR} A ${moonR} ${moonR} 0 0 1 ${pos.x} ${pos.y + moonR} L ${pos.x} ${pos.y - moonR} Z`}
                    fill="#c0c0b0"
                  />
                </>
              )}
              {phase === 'last-quarter' && (
                <>
                  <circle cx={pos.x} cy={pos.y} r={moonR} fill="none" stroke="#8888aa" strokeWidth={0.5} />
                  <path
                    d={`M ${pos.x} ${pos.y - moonR} A ${moonR} ${moonR} 0 0 0 ${pos.x} ${pos.y + moonR} L ${pos.x} ${pos.y - moonR} Z`}
                    fill="#c0c0b0"
                  />
                </>
              )}
            </g>
          );
        });
      })}
    </g>
  );
}

// --- Center Display ---
export function CenterDisplay({ year }: { year: number }) {
  // Arc radius for era label text — close to center circle edge (r=95)
  const arcR = 78;
  const topArcPath = `M ${CX - arcR} ${CY} A ${arcR} ${arcR} 0 0 1 ${CX + arcR} ${CY}`;
  const botArcPath = `M ${CX - arcR} ${CY} A ${arcR} ${arcR} 0 0 0 ${CX + arcR} ${CY}`;

  return (
    <g className="center-display">
      <defs>
        <path id="era-top-arc" d={topArcPath} />
        <path id="era-bot-arc" d={botArcPath} />
      </defs>

      <circle cx={CX} cy={CY} r={RINGS.centerOuter} fill="#1a1a2e" stroke="#2a2a4a" strokeWidth={1} />

      {/* Era labels — curved along the top and bottom of the center circle */}
      <text fill="#6a6a9a" fontSize={14} fontFamily="serif" fontStyle="italic">
        <textPath href="#era-top-arc" startOffset="50%" textAnchor="middle" dy="18">
          The Age of Harmony
        </textPath>
      </text>
      <text fill="#6a6a9a" fontSize={14} fontFamily="serif" fontStyle="italic">
        <textPath href="#era-bot-arc" startOffset="50%" textAnchor="middle">
          The Age of Reason
        </textPath>
      </text>

      {/* Year */}
      <text
        x={CX} y={CY - 10}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#e0e0e0"
        fontSize={28}
        fontWeight={700}
        fontFamily="serif"
      >
        {year}
      </text>
      <text
        x={CX} y={CY + 18}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#8888aa"
        fontSize={12}
        letterSpacing={2}
      >
        THIRD AGE
      </text>
    </g>
  );
}
