// Calendar geometry utilities — pure math, no React dependency

// Layout constants
export const VIEWBOX = 1000;
export const CX = 500;
export const CY = 500;

// Ring radii (from center outward)
export const RINGS = {
  centerInner: 0,
  centerOuter: 95,
  moonInner: 100,
  moonOuter: 138,
  dayInner: 145,
  dayOuter: 335,
  monthInner: 340,
  monthOuter: 385,
  seasonInner: 390,
  seasonOuter: 440,
} as const;

export const MONTHS_COUNT = 14;
export const DAYS_PER_MONTH = 28;
export const DAYS_PER_WEEK = 7;
export const WEEKS_PER_MONTH = 4;
export const DEG_PER_MONTH = 360 / MONTHS_COUNT; // ~25.714

// Season colors (match global.css theme tokens)
export const SEASON_COLORS: Record<string, string> = {
  Spring: '#4a9e68',
  Summer: '#c4a035',
  Autumn: '#c46a35',
  Winter: '#3568a8',
};

export const SEASON_MONTHS: { name: string; months: number[] }[] = [
  { name: 'Spring', months: [1, 2, 3] },
  { name: 'Summer', months: [4, 5, 6, 7] },
  { name: 'Autumn', months: [8, 9, 10] },
  { name: 'Winter', months: [11, 12, 13, 14] },
];

// King Tides: days 19-23, peak 21 (full moons, all aligned)
// Fool Tides: days 5-9, peak 7 (new moons, weakest tides)
export const KING_TIDE_DAYS = [19, 20, 21, 22, 23];
export const FOOL_TIDE_DAYS = [5, 6, 7, 8, 9];
export const KING_TIDE_PEAK = 21;
export const FOOL_TIDE_PEAK = 7;

// Moon phase days within each month
export const MOON_PHASES = [
  { day: 7, phase: 'new', label: 'New Moon' },
  { day: 14, phase: 'first-quarter', label: 'First Quarter' },
  { day: 21, phase: 'full', label: 'Full Moon' },
  { day: 28, phase: 'last-quarter', label: 'Last Quarter' },
] as const;

// --- Geometry helpers ---

export function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Convert polar coordinates to cartesian. 0 degrees = 12 o'clock, clockwise positive. */
export function polarToXY(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  // Rotate -90 so 0deg = top
  const rad = toRadians(angleDeg - 90);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/** SVG arc path from startAngle to endAngle at radius r. */
export function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToXY(cx, cy, r, endAngle);
  const end = polarToXY(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

/** SVG path for a filled wedge (annular sector) between two radii and two angles. */
export function describeWedge(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startAngle: number,
  endAngle: number,
): string {
  const outerStart = polarToXY(cx, cy, rOuter, startAngle);
  const outerEnd = polarToXY(cx, cy, rOuter, endAngle);
  const innerEnd = polarToXY(cx, cy, rInner, endAngle);
  const innerStart = polarToXY(cx, cy, rInner, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

/** Start angle (degrees) for a month (1-indexed). */
export function monthStartAngle(monthNumber: number): number {
  return (monthNumber - 1) * DEG_PER_MONTH;
}

/** End angle (degrees) for a month (1-indexed). */
export function monthEndAngle(monthNumber: number): number {
  return monthNumber * DEG_PER_MONTH;
}

/** Mid angle (degrees) for a month (1-indexed). */
export function monthMidAngle(monthNumber: number): number {
  return (monthNumber - 0.5) * DEG_PER_MONTH;
}

/**
 * Position of a day number within the day grid ring.
 * Days 1-28 laid out as 4 rows (weeks) x 7 columns (weekdays).
 * Row 0 = innermost (week 1), Row 3 = outermost (week 4).
 * Column 0 = first weekday slice of the month wedge.
 */
export function dayPosition(
  monthNumber: number,
  day: number,
): { x: number; y: number; angle: number; radius: number } {
  const weekIndex = Math.floor((day - 1) / DAYS_PER_WEEK); // 0-3
  const dayOfWeek = (day - 1) % DAYS_PER_WEEK; // 0-6

  const mStart = monthStartAngle(monthNumber);
  const colWidth = DEG_PER_MONTH / DAYS_PER_WEEK;
  // Center of the day's angular column
  const angle = mStart + (dayOfWeek + 0.5) * colWidth;

  const rowHeight = (RINGS.dayOuter - RINGS.dayInner) / WEEKS_PER_MONTH;
  // Row 0 (week 1) is innermost
  const radius = RINGS.dayInner + (weekIndex + 0.5) * rowHeight;

  const { x, y } = polarToXY(CX, CY, radius, angle);
  return { x, y, angle, radius };
}

/**
 * Position for a moon phase indicator in the moon ring.
 * Placed at the angular position corresponding to that day within the month.
 */
export function moonPosition(
  monthNumber: number,
  day: number,
): { x: number; y: number } {
  const mStart = monthStartAngle(monthNumber);
  const colWidth = DEG_PER_MONTH / DAYS_PER_MONTH;
  const angle = mStart + (day - 0.5) * colWidth;
  const radius = (RINGS.moonInner + RINGS.moonOuter) / 2;
  return polarToXY(CX, CY, radius, angle);
}

// --- Hit testing ---

/** Determine which day (if any) is under a mouse position. */
export function hitTestDay(
  mouseX: number,
  mouseY: number,
): { monthNumber: number; day: number } | null {
  const dx = mouseX - CX;
  const dy = mouseY - CY;
  const r = Math.sqrt(dx * dx + dy * dy);

  // Check if within day grid ring
  if (r < RINGS.dayInner || r > RINGS.dayOuter) return null;

  // Compute angle (0 = top, clockwise positive)
  let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
  if (angle < 0) angle += 360;

  // Which month?
  const monthIndex = Math.floor(angle / DEG_PER_MONTH);
  const monthNumber = monthIndex + 1;
  if (monthNumber < 1 || monthNumber > MONTHS_COUNT) return null;

  // Angle within the month
  const angleInMonth = angle - monthIndex * DEG_PER_MONTH;
  const colWidth = DEG_PER_MONTH / DAYS_PER_WEEK;
  const dayOfWeek = Math.floor(angleInMonth / colWidth); // 0-6

  // Radial position → week row
  const rowHeight = (RINGS.dayOuter - RINGS.dayInner) / WEEKS_PER_MONTH;
  const weekIndex = Math.floor((r - RINGS.dayInner) / rowHeight); // 0-3

  const day = weekIndex * DAYS_PER_WEEK + dayOfWeek + 1;
  if (day < 1 || day > DAYS_PER_MONTH) return null;

  return { monthNumber, day };
}

/** Determine which month label is under a mouse position. */
export function hitTestMonth(
  mouseX: number,
  mouseY: number,
): number | null {
  const dx = mouseX - CX;
  const dy = mouseY - CY;
  const r = Math.sqrt(dx * dx + dy * dy);

  if (r < RINGS.monthInner || r > RINGS.seasonOuter) return null;

  let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
  if (angle < 0) angle += 360;

  const monthNumber = Math.floor(angle / DEG_PER_MONTH) + 1;
  if (monthNumber < 1 || monthNumber > MONTHS_COUNT) return null;
  return monthNumber;
}

// --- Date parsing ---

export interface ParsedDate {
  day: number;
  monthName: string;
  monthNumber: number;
  year: number;
}

const MONTH_NAMES = [
  'Avandra', 'Melora', 'Yondalla', 'Corellon', 'Ioun', 'Pelor', 'Glittergold',
  'Moradin', 'Erathis', 'Obitris', 'Sehanine', 'Kord', 'Bahamut', 'Raei',
];

const MONTH_NAME_TO_NUMBER = new Map(MONTH_NAMES.map((n, i) => [n.toLowerCase(), i + 1]));

/** Parse an Astorian date string like "25 Bahamut 1136" */
export function parseAstoranDate(dateStr: string): ParsedDate | null {
  const match = dateStr.trim().match(/^(\d+)\s+(\w+)\s+(\d+)$/);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const monthName = match[2];
  const year = parseInt(match[3], 10);

  const monthNumber = MONTH_NAME_TO_NUMBER.get(monthName.toLowerCase());
  if (!monthNumber || day < 1 || day > DAYS_PER_MONTH) return null;

  return { day, monthName, monthNumber, year };
}

// --- Moon / Tide helpers ---

export type MoonPhase = 'new' | 'waxing-crescent' | 'first-quarter' | 'waxing-gibbous' | 'full' | 'waning-gibbous' | 'last-quarter' | 'waning-crescent';

export function getMoonPhase(day: number): MoonPhase {
  if (day <= 3) return 'waning-crescent'; // end of previous cycle / start
  if (day <= 6) return 'waning-crescent';
  if (day === 7) return 'new';
  if (day <= 10) return 'waxing-crescent';
  if (day <= 13) return 'waxing-crescent';
  if (day === 14) return 'first-quarter';
  if (day <= 17) return 'waxing-gibbous';
  if (day <= 20) return 'waxing-gibbous';
  if (day === 21) return 'full';
  if (day <= 24) return 'waning-gibbous';
  if (day <= 27) return 'waning-gibbous';
  if (day === 28) return 'last-quarter';
  return 'waning-crescent';
}

export function getMoonPhaseLabel(day: number): string {
  const phase = getMoonPhase(day);
  const labels: Record<MoonPhase, string> = {
    'new': 'New Moon',
    'waxing-crescent': 'Waxing Crescent',
    'first-quarter': 'First Quarter',
    'waxing-gibbous': 'Waxing Gibbous',
    'full': 'Full Moon',
    'waning-gibbous': 'Waning Gibbous',
    'last-quarter': 'Last Quarter',
    'waning-crescent': 'Waning Crescent',
  };
  return labels[phase];
}

export function getTideInfo(day: number): { type: 'king' | 'fool' | null; isPeak: boolean; description: string } {
  if (KING_TIDE_DAYS.includes(day)) {
    return {
      type: 'king',
      isPeak: day === KING_TIDE_PEAK,
      description: day === KING_TIDE_PEAK ? 'King Tide (Peak)' : 'King Tide',
    };
  }
  if (FOOL_TIDE_DAYS.includes(day)) {
    return {
      type: 'fool',
      isPeak: day === FOOL_TIDE_PEAK,
      description: day === FOOL_TIDE_PEAK ? "Fool Tide (Peak)" : 'Fool Tide',
    };
  }
  return { type: null, isPeak: false, description: '' };
}

export function getDayOfWeekName(day: number): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[(day - 1) % DAYS_PER_WEEK];
}

/** Get the season for a month number (1-indexed). */
export function getSeasonForMonth(monthNumber: number): string {
  for (const s of SEASON_MONTHS) {
    if (s.months.includes(monthNumber)) return s.name;
  }
  return 'Unknown';
}

/** Get season color for a month number. */
export function getSeasonColor(monthNumber: number): string {
  return SEASON_COLORS[getSeasonForMonth(monthNumber)] ?? '#888';
}

export { MONTH_NAMES };
