/**
 * Per-continent starting viewBoxes for the interactive world map.
 *
 * Coords are in world-render coords — the same system used by the master
 * SVG at `src/data/world-map.svg` (viewBox `0 0 2479 1573`). Derived
 * from each continent's bounding box plus a small ocean margin.
 *
 * Used by:
 *  - `src/pages/map.astro` — quick-jump preset buttons
 *  - `src/pages/campaigns/[id].astro` — pre-zoomed Regional Map per campaign
 */

export type ViewBox = [number, number, number, number];

export const FULL_WORLD_VIEWBOX: ViewBox = [0, 0, 2479, 1573];

export const CONTINENT_VIEWBOXES: Record<string, ViewBox> = {
  Glennox:     [1230, 0, 1300, 760],
  Wanun:       [-20, 0, 1280, 760],
  Khanae:      [1050, 620, 400, 340],
  Paendrithir: [1600, 700, 900, 880],
};

/**
 * Ordered list of presets the map page exposes as quick-jump buttons.
 * Order is geographic-ish: World, then continents NW → NE → center → SE.
 */
export const WORLD_PRESETS: Array<{ label: string; viewBox: ViewBox }> = [
  { label: 'World',       viewBox: FULL_WORLD_VIEWBOX },
  { label: 'Wanun',       viewBox: CONTINENT_VIEWBOXES.Wanun },
  { label: 'Glennox',     viewBox: CONTINENT_VIEWBOXES.Glennox },
  { label: 'Khanae',      viewBox: CONTINENT_VIEWBOXES.Khanae },
  { label: 'Paendrithir', viewBox: CONTINENT_VIEWBOXES.Paendrithir },
];
