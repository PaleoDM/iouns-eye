import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const npcs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/npcs' }),
  schema: z.object({
    name: z.string(),
    status: z.enum(['alive', 'dead', 'unknown', 'missing', 'transformed', 'imprisoned']),
    title: z.string().optional(),
    race: z.string().optional(),
    class: z.string().optional(),
    faction: z.string().optional(),
    location: z.string().optional(),
    campaigns: z.array(z.string()).default([]),
    first_appearance: z.string().optional(),
    tags: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
  }),
});

const locations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/locations' }),
  schema: z.object({
    name: z.string(),
    location_type: z.enum(['continent', 'region', 'city', 'district', 'building', 'dungeon', 'wilderness', 'planar']),
    region: z.string().optional(),
    continent: z.string().optional(),
    parent_location: z.string().optional(),
    campaigns: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
    map_region: z.string().optional(),
  }),
});

const factions = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/factions' }),
  schema: z.object({
    name: z.string(),
    faction_type: z.enum(['political', 'religious', 'criminal', 'military', 'commercial', 'secret', 'planar']),
    leader: z.string().optional(),
    headquarters: z.string().optional(),
    campaigns: z.array(z.string()).default([]),
    status: z.enum(['active', 'disbanded', 'hidden', 'historical']).default('active'),
    tags: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
  }),
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    name: z.string(),
    date: z.string().optional(),
    year: z.number().optional(),
    campaign: z.string().optional(),
    session: z.number().optional(),
    location: z.string().optional(),
    participants: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
    significance: z.enum(['major', 'minor', 'background']).default('minor'),
  }),
});

const items = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/items' }),
  schema: z.object({
    name: z.string(),
    item_type: z.enum(['weapon', 'armor', 'wondrous', 'potion', 'scroll', 'artifact', 'tool', 'other']),
    rarity: z.enum(['common', 'uncommon', 'rare', 'very-rare', 'legendary', 'artifact']).optional(),
    attunement: z.boolean().default(false),
    current_holder: z.string().optional(),
    campaign: z.string().optional(),
    tags: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
  }),
});

const deities = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/deities' }),
  schema: z.object({
    name: z.string(),
    title: z.string(),
    category: z.enum(['prime', 'corrupted', 'devil_lord', 'demon_prince', 'yugoloth']),
    domains: z.array(z.string()).default([]),
    month: z.number().optional(),
    holy_day: z.string().optional(),
    holy_day_date: z.string().optional(),
    holy_day_description: z.string().optional(),
    symbol_file: z.string().optional(),
    progenitor_of: z.string().optional(),
    alignment: z.string().optional(),
    hell_layer: z.number().optional(),
    hell_name: z.string().optional(),
    related: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
  }),
});

const lore = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lore' }),
  schema: z.object({
    name: z.string(),
    lore_type: z.enum(['cosmology', 'history', 'magic', 'culture', 'geography', 'religion']),
    campaigns: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
  }),
});

const campaigns = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/campaigns' }),
  schema: z.object({
    name: z.string(),
    status: z.enum(['active', 'completed', 'defunct', 'hiatus']),
    start_year: z.number().optional(),
    end_year: z.number().optional(),
    start_date_real: z.string().optional(),
    current_date: z.string().optional(),
    continent: z.string().optional(),
    primary_location: z.string().optional(),
    session_count: z.number().optional(),
    thumbnail: z.string().optional(),
    party: z.array(z.object({
      name: z.string(),
      player: z.string().optional(),
      race: z.string(),
      class: z.string(),
      slug: z.string().optional(),
    })).default([]),
    tags: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
  }),
});

// recaps collection — will be enabled in Phase 9 when recap content is populated
// const recaps = defineCollection({
//   loader: glob({ pattern: '**/*.md', base: './src/content/recaps' }),
//   schema: z.object({
//     title: z.string(),
//     campaign: z.string(),
//     session_number: z.number(),
//     in_game_date: z.string().optional(),
//     real_date: z.string().optional(),
//     tags: z.array(z.string()).default([]),
//     related: z.array(z.string()).default([]),
//   }),
// });

const chronicles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/chronicles' }),
  schema: z.object({
    name: z.string(),
    author_player: z.string(),
    campaign: z.string(),
    chronicle_type: z.enum(['narrative', 'recap', 'journal', 'letter', 'other']),
    author_character: z.string().optional(),
    perspective: z.enum(['in-character', 'out-of-character']).default('in-character'),
    sessions_covered: z.array(z.number()).default([]),
    pdf_file: z.string().optional(),
    tags: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
  }),
});

const pcs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pcs' }),
  schema: z.object({
    name: z.string(),
    race: z.string(),
    class: z.string(),
    campaign: z.string(),
    player: z.string().optional(),
    level: z.number().optional(),
    subclass: z.string().optional(),
    background: z.string().optional(),
    location: z.string().optional(),
    faction: z.string().optional(),
    tags: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
  }),
});

export const collections = {
  npcs,
  locations,
  factions,
  events,
  items,
  deities,
  lore,
  campaigns,
  chronicles,
  pcs,
};
