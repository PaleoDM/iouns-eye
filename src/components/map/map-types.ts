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
  placeholder?: boolean;
}

export interface LocationInfo {
  slug: string;
  name: string;
  locationType: string;
  continent?: string;
  region?: string;
  href: string;
}

export const MAPS: MapDef[] = [
  { id: 'wanun', label: 'Wanun', imageFile: 'wanun.jpg', width: 5612, height: 3297 },
  { id: 'ekkorai', label: 'Ekkorai (Detail)', imageFile: 'ekkorai.jpg', width: 3367, height: 3147 },
  { id: 'khanae', label: 'Khanae', imageFile: 'khanae.jpg', width: 2432, height: 2943 },
  { id: 'glennox', label: 'Glennox', imageFile: '', width: 0, height: 0, placeholder: true },
];
