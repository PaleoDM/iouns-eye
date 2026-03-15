export interface MapRegion {
  id: string;
  mapId: string;
  locationSlug: string;
  label: string;
  labelPos: [number, number];
  polygon: number[][];
}

export interface MapDef {
  id: string;
  label: string;
  imageFile: string;
  width: number;
  height: number;
  parentId?: string; // undefined = top-level
}

export interface LocationInfo {
  slug: string;
  name: string;
  locationType: string;
  continent?: string;
  region?: string;
  href: string;
}

// Top-level: world. Continents have parentId 'world'. Regional maps have parentId = continent id.
export const MAPS: MapDef[] = [
  { id: 'world',          label: 'World',           imageFile: 'world.jpg',          width: 0, height: 0 },
  { id: 'wanun',          label: 'Wanun',           imageFile: 'wanun.jpg',          width: 5612, height: 3297, parentId: 'world' },
  { id: 'khanae',         label: 'Khanae',          imageFile: 'khanae.jpg',         width: 2432, height: 2943, parentId: 'world' },
  { id: 'glennox',        label: 'Glennox',         imageFile: 'glennox.jpg',        width: 0, height: 0,    parentId: 'world' },
  { id: 'ekkorai',        label: 'Ekkorai',         imageFile: 'ekkorai.jpg',        width: 3367, height: 3147, parentId: 'wanun' },
  { id: 'glennox-kalari', label: 'Kalari',          imageFile: 'glennox-kalari.jpg', width: 0, height: 0,    parentId: 'glennox' },
  { id: 'glennox-cradle',        label: "The Cradle",                imageFile: 'glennox-cradle.jpg',        width: 0, height: 0, parentId: 'glennox' },
  { id: 'glennox-cradle-arlowe', label: "The Cradle (Arlowe)",       imageFile: 'glennox-cradle-arlowe.jpg', width: 0, height: 0, parentId: 'glennox' },
];

export function topLevelMaps(): MapDef[] {
  return MAPS.filter((m) => !m.parentId);
}

export function continentMaps(): MapDef[] {
  return MAPS.filter((m) => m.parentId === 'world');
}

export function childMaps(parentId: string): MapDef[] {
  return MAPS.filter((m) => m.parentId === parentId);
}

export function getMap(id: string): MapDef | undefined {
  return MAPS.find((m) => m.id === id);
}
