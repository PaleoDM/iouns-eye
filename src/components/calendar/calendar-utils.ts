// Astorian calendar — geometry + helpers.
// Ported from the standalone renderer (World Building/Calendar/scripts/render_calendar.py),
// which is the canonical, DM-approved design. Keep the two in sync.

export const VIEWBOX = 760;
export const CX = 380;
export const CY = 380;

// Ring radii (outer -> inner). Big day_in / center: a day cell's circumferential
// width = radius x per-day angle, so pushing the grid outward widens the tight
// inner rows (days 1-7, single digits) — we trade ample radial height for width.
export const R = {
  seasonOut: 350,
  seasonIn: 315,
  monthOut: 315,
  monthIn: 280,
  dayOut: 280,
  dayIn: 165,
  center: 157,
};

export const PALETTE = {
  ink: '#0f0f1a',
  panel: '#1a1a2e',
  grid: '#2a2a4a',
  text: '#e6e6ee',
  textDim: '#9a9ab8',
  holy: '#ff7ab8', // rose — a 5th hue clear of all four season colors
};

export const OPPOSITE: Record<string, string> = {
  Spring: 'Autumn',
  Autumn: 'Spring',
  Summer: 'Winter',
  Winter: 'Summer',
};

export const AGE_EPITHETS: Record<string, [string, string]> = {
  'First Age': ['The Age of Divinity', 'The Age of Creation'],
  'Second Age': ['The Age of Arcana', 'The Age of Innovation'],
  'Third Age': ['The Age of Harmony', 'The Age of Reason'],
};

// Hemisphere by continent. Paendrithir is austral (southern); everything else
// is northern (the default the calendar's season labels were written for).
export const CONTINENT_HEMISPHERE: Record<string, 'north' | 'south'> = {
  Paendrithir: 'south',
};
export function hemisphereFor(continent?: string): 'north' | 'south' {
  return (continent && CONTINENT_HEMISPHERE[continent]) || 'north';
}

export type Season = { name: string; months: number[]; color: string };
export type HolyDay = { name: string; day: number; description?: string };
export type Month = {
  number: number;
  name: string;
  deity_slug: string;
  deity_title?: string;
  season: string;
  holy_day: HolyDay;
  lore?: string;
};
export type CalendarData = {
  days_per_month: number;
  days_per_week: number;
  seasons: Season[];
  months: Month[];
  tides: {
    king_tides: { days: number[]; peak: number; description?: string };
    fool_tides: { days: number[]; peak: number; description?: string };
  };
};

// Angle measured CLOCKWISE from 12 o'clock (north).
export function polar(r: number, angDeg: number): [number, number] {
  const t = (angDeg * Math.PI) / 180;
  return [CX + r * Math.sin(t), CY - r * Math.cos(t)];
}

const nf = (x: number) => Number(x.toFixed(2));

// Annular sector path between two radii and two angles.
export function wedge(rIn: number, rOut: number, a0: number, a1: number): string {
  const large = a1 - a0 > 180 ? 1 : 0;
  const [x0o, y0o] = polar(rOut, a0);
  const [x1o, y1o] = polar(rOut, a1);
  const [x1i, y1i] = polar(rIn, a1);
  const [x0i, y0i] = polar(rIn, a0);
  return (
    `M ${nf(x0o)} ${nf(y0o)} ` +
    `A ${rOut} ${rOut} 0 ${large} 1 ${nf(x1o)} ${nf(y1o)} ` +
    `L ${nf(x1i)} ${nf(y1i)} ` +
    `A ${rIn} ${rIn} 0 ${large} 0 ${nf(x0i)} ${nf(y0i)} Z`
  );
}

// Tangential label rotation that never reads upside-down.
export function uprightRot(mid: number): number {
  return mid <= 90 || mid >= 270 ? mid : mid + 180;
}

export function monthAngles(m: number, degMonth: number): [number, number] {
  return [(m - 1) * degMonth, m * degMonth];
}

// Contiguous season arcs, hemisphere-aware (+ opposite relabel/recolor in south).
export function seasonBlocks(seasons: Season[], hemisphere: string) {
  return seasons.map((s) => {
    const name = hemisphere === 'north' ? s.name : OPPOSITE[s.name];
    const color = (seasons.find((x) => x.name === name) || s).color;
    return { name, color, months: s.months };
  });
}

export function seasonOf(monthSeason: string, hemisphere: string): string {
  return hemisphere === 'north' ? monthSeason : OPPOSITE[monthSeason];
}

export function seasonColor(seasons: Season[], name: string): string {
  return (seasons.find((s) => s.name === name) || seasons[0]).color;
}
