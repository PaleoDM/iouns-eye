import React from 'react';
import type { MonthData } from './CalendarRing';
import { getDayOfWeekName, getMoonPhaseLabel, getTideInfo, MONTH_NAMES } from './calendar-utils';

interface TooltipProps {
  monthNumber: number;
  day: number;
  months: MonthData[];
  x: number;
  y: number;
}

export function CalendarTooltip({ monthNumber, day, months, x, y }: TooltipProps) {
  const month = months.find((m) => m.number === monthNumber);
  if (!month) return null;

  const dayOfWeek = getDayOfWeekName(day);
  const moonPhase = getMoonPhaseLabel(day);
  const tide = getTideInfo(day);
  const isHolyDay = month.holy_day.day === day;

  return (
    <div
      className="pointer-events-none fixed z-50 rounded-lg border border-border bg-surface px-3 py-2 shadow-lg"
      style={{
        left: x + 16,
        top: y - 8,
        maxWidth: 260,
      }}
    >
      <p className="font-serif text-sm font-semibold text-text-primary">
        {day} {month.name}
      </p>
      <p className="text-xs text-text-secondary">{dayOfWeek}</p>

      <div className="mt-1 space-y-0.5 text-xs text-text-secondary">
        <p>{moonPhase}</p>
        {tide.type && (
          <p className={tide.type === 'king' ? 'text-summer' : 'text-winter'}>
            {tide.description}
          </p>
        )}
        {isHolyDay && (
          <p className="text-accent font-semibold">
            {month.holy_day.name}
          </p>
        )}
      </div>
    </div>
  );
}
