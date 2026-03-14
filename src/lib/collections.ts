import { getCollection } from 'astro:content';

export type CollectionName =
  | 'npcs'
  | 'locations'
  | 'factions'
  | 'events'
  | 'items'
  | 'deities'
  | 'lore'
  | 'campaigns'
  | 'chronicles'
  | 'pcs';

export interface CollectionMeta {
  label: string;
  singular: string;
  icon: string;
}

export const COLLECTIONS: Record<CollectionName, CollectionMeta> = {
  npcs: { label: 'NPCs', singular: 'NPC', icon: '👤' },
  locations: { label: 'Locations', singular: 'Location', icon: '📍' },
  factions: { label: 'Factions', singular: 'Faction', icon: '⚔️' },
  events: { label: 'Events', singular: 'Event', icon: '📜' },
  items: { label: 'Items', singular: 'Item', icon: '🗡️' },
  deities: { label: 'Deities', singular: 'Deity', icon: '✨' },
  lore: { label: 'Lore', singular: 'Lore', icon: '📖' },
  campaigns: { label: 'Campaigns', singular: 'Campaign', icon: '🎲' },
  chronicles: { label: 'Chronicles', singular: 'Chronicle', icon: '📝' },
  pcs: { label: 'Player Characters', singular: 'PC', icon: '🛡️' },
};

export const COLLECTION_NAMES = Object.keys(COLLECTIONS) as CollectionName[];

export function entryUrl(collection: string, id: string): string {
  return `${import.meta.env.BASE_URL}${collection}/${id}/`;
}

export function collectionUrl(collection: string): string {
  return `${import.meta.env.BASE_URL}${collection}/`;
}

export interface ResolvedSlug {
  collection: CollectionName;
  id: string;
  data: Record<string, any>;
  href: string;
  name: string;
}

let _slugMap: Map<string, ResolvedSlug> | null = null;

export async function buildSlugMap(): Promise<Map<string, ResolvedSlug>> {
  if (_slugMap) return _slugMap;

  _slugMap = new Map();

  for (const collectionName of COLLECTION_NAMES) {
    const entries = await getCollection(collectionName);
    for (const entry of entries) {
      _slugMap.set(entry.id, {
        collection: collectionName,
        id: entry.id,
        data: entry.data as Record<string, any>,
        href: entryUrl(collectionName, entry.id),
        name: (entry.data as any).name ?? entry.id,
      });
    }
  }

  return _slugMap;
}

export async function resolveSlug(slug: string): Promise<ResolvedSlug | null> {
  const map = await buildSlugMap();
  return map.get(slug) ?? null;
}

export async function resolveSlugs(slugs: string[]): Promise<(ResolvedSlug | null)[]> {
  const map = await buildSlugMap();
  return slugs.map((s) => map.get(s) ?? null);
}

export const CAMPAIGN_LABELS: Record<string, string> = {
  'ishetar-og': 'Ishetar OG',
  'head-hunters': 'Head Hunters',
  'kalari': 'Kalari',
  'skt': 'Storm King\'s Thunder',
  'rifthaven-irl': 'Rifthaven IRL',
  'ishetar-2': 'Ishetar 2.0',
  'rifthaven-online': 'Rifthaven Online',
};
