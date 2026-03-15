import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  VIEWBOX, CX, CY, RINGS,
  hitTestDay, hitTestMonth, getTideInfo, getMoonPhaseLabel, getDayOfWeekName,
} from './calendar-utils';
import { SeasonRing, MonthLabelRing, DayGridRing, MoonPhaseRing, CenterDisplay } from './CalendarRing';
import type { CalendarData } from './CalendarRing';
import { CalendarTooltip } from './CalendarTooltip';
import { CalendarLegend } from './CalendarLegend';
import { CalendarTimeline } from './CalendarTimeline';

export interface CalendarEvent {
  slug: string;
  name: string;
  day?: number;
  monthNumber?: number;
  year: number;
  significance: string;
  url: string;
}

interface AstorianCalendarProps {
  calendarData: CalendarData;
  events: CalendarEvent[];
  defaultYear: number;
  baseUrl: string;
}

export default function AstorianCalendar({
  calendarData,
  events,
  defaultYear,
}: AstorianCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<{ monthNumber: number; day: number } | null>(null);
  const [selectedDay, setSelectedDay] = useState<{ monthNumber: number; day: number } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const months = calendarData.months;

  // Filter events for the canonical year
  const yearEvents = useMemo(
    () => events.filter((e) => e.year === defaultYear),
    [events, defaultYear],
  );

  // Events for the selected day
  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return yearEvents.filter(
      (e) => e.monthNumber === selectedDay.monthNumber && e.day === selectedDay.day,
    );
  }, [yearEvents, selectedDay]);

  // Events for the selected month (no specific day)
  const selectedMonthEvents = useMemo(() => {
    if (!selectedDay) return [];
    return yearEvents.filter(
      (e) => e.monthNumber === selectedDay.monthNumber && !e.day,
    );
  }, [yearEvents, selectedDay]);

  // Convert mouse event to SVG coordinates
  const toSvgCoords = useCallback((e: React.MouseEvent): { x: number; y: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const scaleX = VIEWBOX / rect.width;
    const scaleY = VIEWBOX / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const svgPt = toSvgCoords(e);
    if (!svgPt) return;
    const hit = hitTestDay(svgPt.x, svgPt.y);
    setHoveredDay(hit);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, [toSvgCoords]);

  const handleMouseLeave = useCallback(() => {
    setHoveredDay(null);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const svgPt = toSvgCoords(e);
    if (!svgPt) return;

    const dayHit = hitTestDay(svgPt.x, svgPt.y);
    if (dayHit) {
      setSelectedDay((prev) =>
        prev?.monthNumber === dayHit.monthNumber && prev?.day === dayHit.day ? null : dayHit,
      );
      return;
    }

    // Click on month label → select first day of that month
    const monthHit = hitTestMonth(svgPt.x, svgPt.y);
    if (monthHit) {
      setSelectedDay((prev) =>
        prev?.monthNumber === monthHit && prev?.day === 1 ? null : { monthNumber: monthHit, day: 1 },
      );
    }
  }, [toSvgCoords]);

  const selectedMonth = selectedDay
    ? months.find((m) => m.number === selectedDay.monthNumber)
    : null;

  return (
    <div className="flex flex-col gap-6">
      {/* World history timeline — above the calendar */}
      <CalendarTimeline />

      {/* Calendar header */}
      <div>
        <h2 className="text-2xl font-serif text-accent mb-2">The Astorian Calendar</h2>
        <p className="text-text-secondary mb-4 max-w-3xl text-sm leading-relaxed">
          Astoria measures time in 14 months of 28 days each — 392 days per year. Each month is named
          for a deity of the Prime pantheon. Three moons — Warp, Weft, and Cross — form the Celestial
          Braid, driving the King Tides and Fool Tides that shape coastal life.
        </p>
      </div>

      {/* SVG Calendar — full width */}
      <div className="mx-auto w-full" style={{ maxWidth: 1000 }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          className="w-full h-auto"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          style={{ cursor: hoveredDay ? 'pointer' : 'default' }}
        >
          {/* Background */}
          <circle cx={CX} cy={CY} r={RINGS.seasonOuter + 2} fill="#0f0f1a" />

          {/* Rings from outside in */}
          <SeasonRing />
          <MonthLabelRing months={months} />
          <DayGridRing months={months} selectedDay={selectedDay} hoveredDay={hoveredDay} />
          <MoonPhaseRing />
          <CenterDisplay year={defaultYear} />
        </svg>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <CalendarTooltip
          monthNumber={hoveredDay.monthNumber}
          day={hoveredDay.day}
          months={months}
          x={tooltipPos.x}
          y={tooltipPos.y}
        />
      )}

      {/* Selected day details */}
      {selectedDay && selectedMonth && (
        <div className="rounded-lg border border-border bg-surface p-4 max-w-2xl">
          <h3 className="font-serif text-lg text-text-primary">
            {selectedDay.day} {selectedMonth.name}, {defaultYear} TA
          </h3>
          <p className="text-sm text-text-secondary">{getDayOfWeekName(selectedDay.day)}</p>

          <div className="mt-2 space-y-1 text-sm text-text-secondary">
            <p>{getMoonPhaseLabel(selectedDay.day)}</p>
            {getTideInfo(selectedDay.day).type && (
              <p className={getTideInfo(selectedDay.day).type === 'king' ? 'text-summer' : 'text-winter'}>
                {getTideInfo(selectedDay.day).description}
              </p>
            )}
          </div>

          {/* Holy day info */}
          {selectedMonth.holy_day.day === selectedDay.day && (
            <div className="mt-3 rounded border border-border bg-surface-hover p-3">
              <p className="font-serif text-sm font-semibold text-accent">
                {selectedMonth.holy_day.name}
              </p>
              <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                {selectedMonth.holy_day.description}
              </p>
            </div>
          )}

          {/* Events on this day */}
          {selectedDayEvents.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                Events on this day
              </p>
              {selectedDayEvents.map((ev) => (
                <a
                  key={ev.slug}
                  href={ev.url}
                  className="block rounded border border-border bg-surface-hover p-2 mb-1 text-sm text-accent hover:text-accent-hover hover:border-accent/50 transition-colors"
                >
                  {ev.name}
                </a>
              ))}
            </div>
          )}

          {/* Events this month (no specific day) */}
          {selectedMonthEvents.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                Also in {selectedMonth.name}
              </p>
              {selectedMonthEvents.map((ev) => (
                <a
                  key={ev.slug}
                  href={ev.url}
                  className="block rounded border border-border bg-surface-hover p-2 mb-1 text-sm text-accent hover:text-accent-hover hover:border-accent/50 transition-colors"
                >
                  {ev.name}
                </a>
              ))}
            </div>
          )}

          {/* No events */}
          {selectedDayEvents.length === 0 && selectedMonthEvents.length === 0 && (
            <p className="mt-3 text-xs text-text-secondary italic">No events recorded for this date.</p>
          )}
        </div>
      )}

      {/* Legend — horizontal */}
      <CalendarLegend />

    </div>
  );
}
