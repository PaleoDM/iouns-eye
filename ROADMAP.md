# Ioun's Eye — Development Roadmap

## Vision & Goals

Ioun's Eye is the living encyclopedia of Astoria — a D&D homebrew world spanning multiple campaigns across 50+ years of in-world history (1082–1136 TA). It solves the fundamental problem every long-running DM faces: world knowledge accumulates across hundreds of session preps, recaps, and notes, but becomes impossible to find, reference, or browse.

**Goals:**
- Give the DM a browsable, searchable wiki of everything in the world
- Give Claude Code a structured data layer to reference during session prep, recap writing, and ad-hoc world-building
- Grow the grimoire organically as a byproduct of play (via automated extraction from recaps), not as a separate documentation chore
- Replace the Adobe Illustrator calendar with an interactive, data-driven component
- Make the world maps clickable and linked to grimoire entries

**Constraints:**
- Static site only — no server, no database, no ongoing hosting costs
- Must deploy to GitHub Pages under the existing PaleoDM account (peredocm.com/iouns-eye)
- Grimoire entry files must be plain markdown readable/writable by Claude Code
- No spoiler/auth system in v1 — all content is player-visible
- Must not break existing TTRPG repo paths (root path and VTT Product path are immutable)

**Non-Goals (v1):**
- Player accounts or login
- DM-only content visibility
- Editing entries through the website UI (Claude Code and direct file editing are the input methods)
- Integration with the VTT Product (future consideration)
- Automated deployment from the TTRPG repo (Ioun's Eye is its own repo)

## User Workflows

### DM Browsing the Wiki
1. Open peredocm.com/iouns-eye in browser
2. Use search bar to find an NPC, location, or event
3. Click through cross-links between entries (NPC → their faction → that faction's headquarters)
4. Browse by category (all NPCs, all locations in Rifthaven, all events in 1136 TA)
5. Click on the interactive calendar to see events on specific dates or holy days
6. Click on map regions to jump to location entries

### DM Adding/Updating Entries via Claude Code
1. Open VS Code in TTRPG repo (or Ioun's Eye repo)
2. Tell Claude: "Add an NPC named Dalla Voss, a cursed curio merchant in Emberspost"
3. Claude creates `src/content/npcs/dalla-voss.md` with proper frontmatter
4. Claude updates INDEX.md
5. On push, GitHub Actions rebuilds and deploys the site

### Automated Extraction from Recaps
1. DM runs `/write-recap Ishetar` after a session
2. Recap skill writes the recap as usual
3. Extraction step scans the recap for new/updated NPCs, locations, events, items
4. Creates or updates grimoire entry files in the Ioun's Eye repo
5. Updates INDEX.md

### Session Prep with Grimoire Context
1. DM runs `/prep-session Ishetar 31`
2. Prep skill reads INDEX.md from Ioun's Eye repo
3. Identifies relevant entries (recent NPCs, active locations, open plot threads)
4. Reads those full entries for deep context
5. Generates the prep with richer, more consistent world references

---

## Architecture

### System Diagram
```
┌─────────────────────────────────────────────────────────────┐
│  TTRPG Repo (Dropbox)                                       │
│  ├── Campaigns/ (session preps, recaps, assets)              │
│  ├── World Building/ (maps, calendar images, deity art)      │
│  ├── VTT Product/ (Next.js app, separate git repo)           │
│  └── iouns-eye/ (THIS PROJECT, separate git repo)            │
│       ├── src/content/ ← GRIMOIRE ENTRIES (source of truth)   │
│       ├── src/data/ ← STRUCTURED JSON (calendar, deities)    │
│       ├── src/components/ ← React islands (calendar, map)    │
│       ├── src/pages/ ← Astro routes                          │
│       ├── public/ ← Static assets (maps, symbols)            │
│       └── INDEX.md ← Claude's quick-lookup file              │
└─────────────────────────────────────────────────────────────┘
         │                                    │
         │ Claude reads entries               │ git push
         ▼                                    ▼
┌──────────────────┐              ┌────────────────────┐
│  Claude Code     │              │  GitHub Actions     │
│  Skills          │              │  Build & Deploy     │
│  /prep-session   │              └────────┬───────────┘
│  /write-recap    │                       │
│  /grimoire       │                       ▼
└──────────────────┘              ┌────────────────────┐
                                  │  GitHub Pages       │
                                  │  peredocm.com       │
                                  │  /iouns-eye/        │
                                  └────────────────────┘
```

### Key Architectural Decisions

1. **Astro with Content Collections** — entries are markdown files validated against Zod schemas at build time. This gives us type-safe frontmatter, automatic slug generation, and query APIs for filtering/sorting.

2. **React Islands** — the calendar and map are the only interactive components. Everything else is static HTML. This keeps the site fast and lightweight.

3. **Pagefind for Search** — runs at build time, indexes all rendered HTML, provides client-side search with zero server cost. Perfect for static sites.

4. **INDEX.md as Claude's Entry Point** — a flat, auto-generated file listing every grimoire entry with its slug, type, name, and one-line description. Claude reads this single file to know what exists, then reads specific entries as needed. Regenerated by a build script.

5. **JSON for Structured Reference Data** — the calendar system and deity data are highly structured and used programmatically by components. These live as JSON in `src/data/`, not as markdown content collections.

6. **Separate Git Repo** — Ioun's Eye has its own repo (`PaleoDM/iouns-eye`) even though it lives physically inside the TTRPG Dropbox folder. This keeps deployment clean and doesn't entangle with the VTT repo.

---

## Data Modeling

### Content Entry: NPC
```typescript
interface NPCEntry {
  // Required
  name: string;                    // Display name: "Brenna Tolvane"
  status: NPCStatus;              // alive | dead | unknown | missing | transformed | imprisoned

  // Optional
  title?: string;                  // "Warden of the Restful Lily"
  race?: string;                   // "Human"
  class?: string;                  // "Fighter" (if known)
  faction?: string;                // Slug reference: "house-of-autumn"
  location?: string;               // Slug reference: "emberspost"
  campaigns: string[];             // ["ishetar-2", "ishetar-og"]
  first_appearance?: string;       // "Session 12, Ishetar 2.0"
  tags?: string[];                 // ["antagonist", "political", "noble"]
  related?: string[];              // Slugs: ["house-of-autumn", "restful-lily"]

  // Body (markdown below frontmatter)
  // ## Description
  // ## Key Facts
  // ## Relationships
  // ## Open Threads
  // ## Timeline (dated events involving this NPC)
}

type NPCStatus = "alive" | "dead" | "unknown" | "missing" | "transformed" | "imprisoned";
```

### Content Entry: Location
```typescript
interface LocationEntry {
  // Required
  name: string;                    // "Emberspost"
  location_type: LocationType;     // city | district | building | dungeon | wilderness | planar

  // Optional
  region?: string;                 // "Ekkorai"
  continent?: string;              // "Wanun" (refers to Ekkorai side) or "Khanae"
  parent_location?: string;        // Slug: "ekkorai" (for hierarchical nesting)
  campaigns?: string[];            // ["ishetar-2", "ishetar-og"]
  tags?: string[];                 // ["port-city", "trade-hub"]
  related?: string[];              // Slugs
  map_region?: string;             // Identifier for clickable map overlay

  // Body
  // ## Description
  // ## Notable Features
  // ## Key NPCs (here)
  // ## History
  // ## Current State
}

type LocationType = "continent" | "region" | "city" | "district" | "building" | "dungeon" | "wilderness" | "planar";
```

### Content Entry: Faction
```typescript
interface FactionEntry {
  // Required
  name: string;                    // "House of Autumn"
  faction_type: FactionType;       // political | religious | criminal | military | commercial | secret | planar

  // Optional
  leader?: string;                 // NPC slug: "brenna-tolvane"
  headquarters?: string;           // Location slug: "restful-lily"
  campaigns?: string[];
  status?: string;                 // "active" | "disbanded" | "hidden" | "historical"
  tags?: string[];
  related?: string[];

  // Body
  // ## Purpose & Goals
  // ## Structure
  // ## Key Members
  // ## Relationships with Other Factions
  // ## History
}

type FactionType = "political" | "religious" | "criminal" | "military" | "commercial" | "secret" | "planar";
```

### Content Entry: Event
```typescript
interface EventEntry {
  // Required
  name: string;                    // "The Rift Opening"
  date?: string;                   // Astorian date: "15 Sehanine 1127" (optional for undated historical events)

  // Optional
  year?: number;                   // 1127 (for sorting/filtering when exact date unknown)
  campaign?: string;               // Campaign slug where this occurred
  session?: number;                // Session number
  location?: string;               // Location slug
  participants?: string[];         // NPC and PC slugs involved
  tags?: string[];                 // ["combat", "political", "ritual", "catastrophe"]
  related?: string[];
  significance?: string;           // "major" | "minor" | "background"

  // Body
  // ## What Happened
  // ## Consequences
  // ## Connected Events
}
```

### Content Entry: Item
```typescript
interface ItemEntry {
  // Required
  name: string;                    // "Verity's Edge"
  item_type: string;               // "weapon" | "armor" | "wondrous" | "potion" | "scroll" | "artifact"

  // Optional
  rarity?: string;                 // "common" | "uncommon" | "rare" | "very-rare" | "legendary" | "artifact"
  attunement?: boolean;
  current_holder?: string;         // PC or NPC slug
  campaign?: string;
  tags?: string[];
  related?: string[];

  // Body
  // ## Description
  // ## Properties
  // ## History
  // ## Current Status
}
```

### Content Entry: Deity
```typescript
interface DeityEntry {
  // Required
  name: string;                    // "Ioun"
  title: string;                   // "The Knowing Mistress"
  category: DeityCategory;         // prime | corrupted | devil_lord | demon_prince | yugoloth

  // Optional
  domains?: string[];              // ["Knowledge", "Learning"]
  month?: number;                  // Calendar month number (1-14), if applicable (prime deities)
  holy_day?: string;               // Name of the holy day
  holy_day_date?: string;          // Day within the month (e.g., "21st" or "5th")
  holy_day_description?: string;   // Brief description of celebrations
  symbol_file?: string;            // "knowing-mistress.png"
  progenitor_of?: string;          // "Elves" (if applicable)
  alignment?: string;
  hell_layer?: number;             // For devil lords (1-9)
  hell_name?: string;              // For devil lords ("Nessus")
  related?: string[];
  tags?: string[];

  // Body
  // ## Description
  // ## Worship & Followers
  // ## Holy Day Traditions
  // ## Relationships
  // ## Role in Campaigns
}

type DeityCategory = "prime" | "corrupted" | "devil_lord" | "demon_prince" | "yugoloth";
```

### Content Entry: Lore
```typescript
interface LoreEntry {
  // Required
  name: string;                    // "The Celestial Braid"
  lore_type: string;               // "cosmology" | "history" | "magic" | "culture" | "geography" | "religion"

  // Optional
  campaigns?: string[];
  tags?: string[];
  related?: string[];

  // Body (freeform markdown — this is the catch-all for world knowledge
  // that doesn't fit neatly into other categories)
}
```

### Content Entry: Campaign
```typescript
interface CampaignEntry {
  // Required
  name: string;                    // "Ishetar 2.0"
  slug: string;                    // "ishetar-2"
  status: string;                  // "active" | "completed" | "defunct" | "hiatus"

  // Optional
  start_year?: number;             // In-world year: 1136
  end_year?: number;               // In-world year (for completed campaigns)
  start_date_real?: string;        // Real-world start date
  continent?: string;              // "Wanun" or "Khanae"
  primary_location?: string;       // Location slug: "ishetar"
  session_count?: number;          // Current session count

  // Optional — player characters
  party?: Array<{
    name: string;                  // "Azrael"
    player?: string;               // Player's real name (if shared)
    race: string;                  // "Aasimar"
    class: string;                 // "Soul Knife Rogue"
    slug?: string;                 // PC entry slug for cross-reference
  }>;

  // Optional
  tags?: string[];
  related?: string[];

  // Body
  // ## Overview
  // ## Major Arcs
  // ## Themes
}
```

### Content Entry: PC (Player Character)
```typescript
interface PCEntry {
  // Required
  name: string;                    // "Azrael"
  race: string;                    // "Aasimar"
  class: string;                   // "Soul Knife Rogue"
  campaign: string;                // Campaign slug: "ishetar-2"

  // Optional
  player?: string;                 // Player name
  level?: number;
  subclass?: string;
  background?: string;
  location?: string;               // Current location slug
  faction?: string;                // Faction slug
  tags?: string[];
  related?: string[];

  // Body
  // ## Background
  // ## Key Moments
  // ## Relationships
  // ## Character Arc
}
```

### Content Entry: Chronicle (Player-Created Content)
```typescript
interface ChronicleEntry {
  // Required
  name: string;                    // "Hearth to Home"
  author_player: string;           // Real player name: "Sam"
  campaign: string;                // Campaign slug: "kalari"
  chronicle_type: string;          // "narrative" | "recap" | "journal" | "letter" | "other"

  // Optional
  author_character?: string;       // PC slug if written in-character: "kip-vogels"
  perspective: string;             // "in-character" | "out-of-character"
  sessions_covered?: number[];     // [1, 2, 3] — session numbers this covers
  pdf_file?: string;               // "hearth-to-home.pdf" — original document hosted in public/chronicles/
  tags?: string[];
  related?: string[];

  // Body
  // ## Summary (DM-written summary of the content for grimoire context)
  // ## Notable Details (lore, NPCs, events referenced that may not appear in DM notes)
  // Full text can be included in body or linked via pdf_file
}
```

### Structured Data: Calendar (JSON)
```typescript
interface CalendarData {
  year_length: 392;                // 14 × 28
  months_per_year: 14;
  days_per_month: 28;
  days_per_week: 7;
  day_names: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  day_abbreviations: ["S", "M", "T", "W", "R", "F", "S"];

  seasons: Array<{
    name: string;                  // "Spring"
    months: number[];              // [1, 2, 3]
    color: string;                 // Hex color for calendar rendering
  }>;

  months: Array<{
    number: number;                // 1-14
    name: string;                  // "Avandra"
    deity_slug: string;            // "avandra"
    season: string;                // "Spring"
    holy_day: {
      name: string;                // "New Year's Day"
      day: number;                 // Day of month
      description: string;
    };
  }>;

  moons: {
    warp: { description: string; behavior: string; };
    weft: { description: string; behavior: string; };
    cross: { description: string; behavior: string; };
  };

  tides: {
    king_tides: { days: [19, 20, 21, 22, 23]; peak: 21; description: string; };
    fool_tides: { days: [5, 6, 7, 8, 9]; peak: 7; description: string; };
  };

  // Moon phases for rendering (simplified: derives from day of month)
  // Day 7: New Moon (all three)
  // Day 14: First Quarter
  // Day 21: Full Moon (all three aligned)
  // Day 28: Last Quarter
}
```

### Structured Data: Deities (JSON)
```typescript
interface DeityData {
  prime: DeityRecord[];
  corrupted: DeityRecord[];
  devil_lords: DeityRecord[];
  demon_princes: DeityRecord[];
  yugoloths: DeityRecord[];
}

interface DeityRecord {
  name: string;
  title: string;
  slug: string;
  domains: string[];
  symbol_file?: string;
  token_file?: string;
  month_number?: number;          // 1-14, prime deities only
  progenitor_of?: string;
  alignment?: string;
  hell_layer?: number;            // Devil lords only
  hell_name?: string;             // Devil lords only
}
```

### INDEX.md Format
```markdown
# Ioun's Eye — Grimoire Index
<!-- Auto-generated. Do not edit manually. Run `npm run index` to regenerate. -->
<!-- Last updated: 2026-03-13 -->

## NPCs (count)
- `brenna-tolvane` — Brenna Tolvane: Warden of the Restful Lily [ishetar-2] [alive]
- `meris-caldrow` — Meris Caldrow: Farmer seeking help for her family [ishetar-2] [alive]
...

## Locations (count)
- `emberspost` — Emberspost: Port city in Ekkorai [ishetar-2, ishetar-og] [city]
- `rifthaven` — Rifthaven: Major city on Khanae [rifthaven-online, rifthaven-irl] [city]
...

## Factions (count)
...

## Events (count)
...

## Items (count)
...

## Deities (count)
...

## Lore (count)
...

## Campaigns (count)
...

## PCs (count)
...
```

---

## Implementation Phases

### Phase 0: Project Scaffolding & Configuration

**Objective**: Set up the Astro project, configure all tooling, define content schemas, and establish the git repo.

**Prerequisites**: None

**Steps**:
1. Initialize Astro 5 project with React and Tailwind integrations
2. Configure `astro.config.mjs` with base path `/iouns-eye/`, React integration, and static output
3. Create `src/content.config.ts` with Zod schemas for all 9 content collection types (npc, location, faction, event, item, deity, lore, campaign, pc)
4. Create empty content directories: `src/content/{npcs,locations,factions,events,items,lore,deities,campaigns,pcs}/`
5. Create `src/data/` directory with skeleton `calendar.json` and `deities.json`
6. Create placeholder `src/pages/index.astro` (landing page)
7. Create `src/layouts/BaseLayout.astro` with dark theme, nav structure, and Tailwind
8. Set up `.gitignore` (node_modules, dist, .astro, .DS_Store)
9. Copy static assets from World Building to `public/` (maps, deity symbols, deity tokens)
10. Create the `npm run index` script (`scripts/generate-index.ts`) that reads all content collections and writes INDEX.md
11. Configure GitHub Actions workflow for build and deploy to Pages
12. Initialize git repo, create initial commit
13. Create GitHub repo `iouns-eye` under PaleoDM, push

**Files Created/Modified**:
- `astro.config.mjs` — Astro configuration with React, Tailwind, base path
- `tsconfig.json` — TypeScript config extending Astro's
- `tailwind.config.ts` — Tailwind config with dark theme defaults
- `package.json` — Dependencies and scripts
- `src/content.config.ts` — All content collection Zod schemas
- `src/pages/index.astro` — Placeholder landing page
- `src/layouts/BaseLayout.astro` — Base layout with nav and dark theme
- `src/data/calendar.json` — Skeleton calendar data
- `src/data/deities.json` — Skeleton deity data
- `scripts/generate-index.ts` — INDEX.md generator
- `.github/workflows/deploy.yml` — GitHub Actions deploy workflow
- `.gitignore`
- `INDEX.md` — Initial empty index
- `public/maps/` — Map images
- `public/deity-symbols/` — Deity symbol PNGs
- `public/deity-tokens/` — Deity token PNGs

**Success Criteria**:
- [ ] `npm run dev` starts Astro dev server without errors
- [ ] `npm run build` produces static output in `dist/`
- [ ] Content schemas validate: creating a test NPC entry with valid frontmatter builds successfully
- [ ] Content schemas reject: creating an entry with invalid frontmatter fails build with clear error
- [ ] `npm run index` generates INDEX.md from content
- [ ] Git repo initialized with clean first commit
- [ ] GitHub repo created and pushed
- [ ] GitHub Actions workflow file exists (deployment tested in Phase 4)

**Known Risks**:
- Astro 5 Content Layer API has different syntax than v4 — use `glob` loader, not file-based collections
- Base path `/iouns-eye/` must be configured in astro.config.mjs AND the GitHub Actions workflow

---

### Phase 1: Foundational Lore Extraction

**Objective**: Extract all campaign-agnostic world knowledge from the World Building folder into grimoire entries and structured JSON data files.

**Prerequisites**: Phase 0

**Steps**:
1. Read all source files in `World Building/`:
   - `Deity List.docx` (will need pandoc conversion or manual reading)
   - `Moons of Astoria.qmd`
   - `Astoria Campaigns Timeline.txt`
   - Calendar images (for reference, data already documented)
   - Map images (already copied to public/ in Phase 0)
2. Populate `src/data/deities.json` with complete deity data:
   - All 14 Prime Deities with names, titles, domains, symbols, month assignments
   - All 12 Corrupted Deities
   - All 9 Devil Lords with hell layers
   - All 8 Demon Princes
   - All 3 Yugoloth Lords
3. Populate `src/data/calendar.json` with complete calendar data:
   - 14 months with deity associations and holy day details
   - Moon system (Warp, Weft, Cross) behavior and phases
   - Tidal patterns (King Tides, Fool Tides)
   - Season definitions with color coding
4. Create deity grimoire entries in `src/content/deities/` — one `.md` file per deity with richer prose descriptions, worship traditions, and role in the world
5. Create lore grimoire entries for foundational topics:
   - `celestial-braid.md` — The three-moon system
   - `king-tides-and-fool-tides.md` — Tidal patterns and their impact
   - `the-third-age.md` — Current age and what came before
   - `magic-system.md` — How magic works in Astoria (if documented)
   - Geography entries for continents (Wanun/Ekkorai, Khanae)
6. Create location entries for major geographic features visible on maps:
   - Continents, regions, major cities
7. Run `npm run index` to update INDEX.md
8. Verify build succeeds with all new content

**Files Created/Modified**:
- `src/data/deities.json` — Complete deity data
- `src/data/calendar.json` — Complete calendar data
- `src/content/deities/*.md` — ~46 deity entries
- `src/content/lore/*.md` — 5-10 foundational lore entries
- `src/content/locations/*.md` — Major geographic locations from maps
- `INDEX.md` — Updated

**Success Criteria**:
- [ ] `deities.json` contains all deities from all categories with correct data
- [ ] `calendar.json` contains all 14 months with holy days, moon phases, and tidal data
- [ ] Every prime deity has both a JSON record and a grimoire entry
- [ ] All lore entries build successfully with valid frontmatter
- [ ] INDEX.md reflects all new entries
- [ ] `npm run build` succeeds

**Known Risks**:
- The Deity List is a .docx file — may need pandoc conversion or Claude may be able to read it
- Some deity details may be sparse (especially corrupted deities, demon princes) — create entries with what's available, mark gaps
- The 14 month names need confirmation against calendar images (month 5 may be Ioun, not in the originally listed order)

---

### Phase 2: Completed Campaign Extraction

**Objective**: Extract all NPCs, locations, factions, events, items, and plot details from the five completed campaigns into grimoire entries.

**Prerequisites**: Phase 1

**Steps**:
1. **Pre-requisite**: Convert all .docx files to markdown using pandoc:
   ```bash
   # For each completed campaign's .docx files
   pandoc "Campaign Recaps.docx" -o "Campaign Recaps.md" --wrap=none
   ```
2. **FULL CAMPAIGNS** (three campaigns with deep extractable content):

   **Ishetar OG** (1082 TA) — Read and extract from:
   - Arc 1 Story & NPCs
   - Running NPC List
   - Journal Lore for Players
   - Wanun History and Notes
   - Character backstories
   - Magic items (13 individual item docs)
   - Create campaign entry: `src/content/campaigns/ishetar-og.md`

   **Ruins of Kalari** (1088-1089 TA) — Read and extract from:
   - Campaign Recaps
   - Session Zero documents (2 versions)
   - Running NPC List
   - List of Wintar Sacrifices
   - Memories Recovered from Old Perile Falls Arch
   - **Player Content**: *Hearth to Home* by Kip Vogels (player narrative — see Chronicle extraction below)
   - Ice Boat Jousting Rules
   - Create campaign entry: `src/content/campaigns/kalari.md`

   **SKT One Last Job** (1094 TA) — Read and extract from:
   - Campaign Recaps
   - Session Zero Topics
   - Factions of the North
   - **Player Content**: *One Last Job* by Maeve Willowspell (player narrative — see Chronicle extraction below)
   - Create campaign entry: `src/content/campaigns/skt.md`

3. **DEFUNCT CAMPAIGNS** (failed to launch — minimal content, but worth preserving as timeline entries):

   **Head Hunters Return to Wanun** — Read Session Zero and any recap material. Create a lightweight campaign entry noting what was established before it ended. Extract any NPCs/locations/events that were introduced, even briefly.
   - Create campaign entry: `src/content/campaigns/head-hunters.md` (status: "defunct")

   **Rifthaven IRL** (1127-1128 TA) — Read Session Zero and any recap material. Create a lightweight campaign entry. This is the predecessor to Rifthaven Online, so any established world details carry forward.
   - Create campaign entry: `src/content/campaigns/rifthaven-irl.md` (status: "defunct")

4. For each **full** campaign, create entries for:
   - Major NPCs (name, role, status, relationships)
   - Locations introduced or significantly featured
   - Factions that appeared
   - Major events (plot-critical moments)
   - Notable items
   - PCs (player characters)
5. **Player-Created Content (Chronicles)**: Player-written documents require a different extraction approach:
   - Create a `chronicle` entry for each player-written document (narrative, recap, journal, etc.)
   - Extract entities from the player content just like DM content — NPCs, locations, events they reference
   - **But**: player narratives are a primary source, not just metadata. Preserve the original document:
     - Copy/convert the original to PDF if not already, place in `public/chronicles/`
     - The chronicle entry links to the PDF and contains a DM-written summary + notable details
   - Player content may contain details not in the DM's notes — these are canon and should become grimoire entries
   - Known player documents:
     - *Hearth to Home* by Kip Vogels (Kalari campaign — in-character narrative)
     - *One Last Job* by Maeve Willowspell (SKT campaign — in-character narrative)
     - Any additional player recaps or journals found during extraction
6. For **defunct** campaigns: create entries only for elements that were established and carry into the world canon
7. Ensure cross-references between entries from different campaigns (e.g., a location from Ishetar OG that reappears in Ishetar 2.0)
8. Run `npm run index` and verify build

**Files Created/Modified**:
- `src/content/campaigns/*.md` — 5 campaign entries
- `src/content/npcs/*.md` — Estimated 30-80 NPC entries across all completed campaigns
- `src/content/locations/*.md` — Estimated 15-30 location entries
- `src/content/factions/*.md` — Estimated 10-20 faction entries
- `src/content/events/*.md` — Estimated 20-40 event entries
- `src/content/items/*.md` — Estimated 15-25 item entries
- `src/content/pcs/*.md` — Estimated 15-25 PC entries
- `src/content/chronicles/*.md` — Chronicle entries for player-written content (at least 2: Hearth to Home, One Last Job)
- `public/chronicles/*.pdf` — Original player documents preserved as PDFs
- `INDEX.md` — Updated

**Success Criteria**:
- [ ] All 5 completed campaign entries exist with accurate metadata
- [ ] Every named NPC from completed campaign source material has a grimoire entry
- [ ] Every significant location has an entry with correct parent/region hierarchy
- [ ] Cross-campaign entities (locations, NPCs that appear in multiple campaigns) have unified entries with campaign_appearances noted
- [ ] Player-written documents have chronicle entries with summaries and PDF links
- [ ] Entities referenced in player content (but not in DM notes) have grimoire entries
- [ ] All entries have valid frontmatter and build successfully
- [ ] INDEX.md is current
- [ ] `npm run build` succeeds

**Known Risks**:
- .docx files may not convert cleanly with pandoc (formatting loss, table corruption)
- Some completed campaigns have sparse documentation — entries will vary in depth
- Cross-campaign entity identification requires careful deduplication (same place, different name?)
- This phase involves the most raw reading — it may need to be split across multiple sessions

---

### Phase 3: Active Campaign Extraction

**Objective**: Extract all entities from Ishetar 2.0 (~30 sessions) and Rifthaven Online (~43 sessions) into grimoire entries.

**Prerequisites**: Phase 2 (so cross-campaign references can be linked)

**Steps**:
1. **Ishetar 2.0** — Read and extract from:
   - `Campaign Recaps.qmd` (all ~30 sessions)
   - All session preps (Sessions 26-30 in markdown)
   - `Ishetar_Bastions.md` (party bastion facilities and hirelings)
   - `Rooker Research Topics.md` (research threads and lore entries)
   - `Special_Facilities.md` (bastion mechanics)
   - Emberspost Broadsheet content (player-facing publication)
   - The Price of Beauty arc notes
   - Create campaign entry: `src/content/campaigns/ishetar-2.md`
2. **Rifthaven Online** — Read and extract from:
   - `Campaign Recaps.qmd` (all ~43 sessions, 214 KB — largest single file)
   - All session preps (Sessions 40-43 in markdown)
   - `Rifthaven Bastions.qmd` (bastion data)
   - `Districts in Rifthaven.docx` (city structure)
   - `Boughshadow Room Encounters.docx` (location encounters)
   - Odaire Arc notes
   - EB08-10 arc folders (Parliament of Gears, Lord Bucket, Judgement of Iron)
   - Create campaign entry: `src/content/campaigns/rifthaven-online.md`
3. For each campaign, create/update entries for:
   - All named NPCs with current status, relationships, and narrative significance
   - All locations visited or referenced
   - All factions encountered
   - Major events and plot beats (session by session)
   - Notable items acquired or encountered
   - All PCs with their character arcs and key moments
4. Link to existing entries from completed campaigns where entities recur
5. Populate the `related` fields thoroughly — this is what makes the wiki navigable
6. Run `npm run index` and verify build

**Files Created/Modified**:
- `src/content/campaigns/*.md` — 2 campaign entries
- `src/content/npcs/*.md` — Estimated 60-120 new NPC entries
- `src/content/locations/*.md` — Estimated 30-50 new location entries
- `src/content/factions/*.md` — Estimated 15-30 new faction entries
- `src/content/events/*.md` — Estimated 50-100 new event entries
- `src/content/items/*.md` — Estimated 20-40 new item entries
- `src/content/pcs/*.md` — 10 PC entries (5 per campaign)
- `INDEX.md` — Updated

**Success Criteria**:
- [ ] Both active campaign entries exist with full party rosters and arc summaries
- [ ] Every named NPC from all session recaps has a grimoire entry
- [ ] Rifthaven district structure is reflected in location hierarchy
- [ ] Ishetar bastion facilities and hirelings are documented
- [ ] Event entries create a traceable timeline for each campaign
- [ ] Cross-campaign references link correctly (e.g., locations in Ekkorai shared between Ishetar OG and Ishetar 2.0)
- [ ] `related` fields create a navigable web of connections
- [ ] All entries build successfully
- [ ] INDEX.md reflects the full corpus

**Known Risks**:
- The Rifthaven recaps file is 214 KB — very large, may need to be processed in chunks
- 43 sessions of Rifthaven means high NPC/location density with complex relationships
- Some entities from early sessions may have evolved significantly — entries need to capture current state while noting history
- Deduplication across Rifthaven IRL → Rifthaven Online (same world, different party/time)

---

### Phase 4: Website Build

**Objective**: Build the full wiki website with category browsing, search, cross-links, and responsive layout. Deploy to GitHub Pages.

**Prerequisites**: Phase 3 (building against the full dataset ensures the UI works at scale)

**Steps**:
1. **Layout & Navigation**:
   - Create `BaseLayout.astro` with dark theme, responsive sidebar navigation
   - Category nav: NPCs, Locations, Factions, Events, Items, Deities, Lore, Campaigns, PCs
   - Top bar with search input and site title/logo
   - Breadcrumb navigation for entry pages
   - Mobile hamburger menu

2. **Landing Page** (`src/pages/index.astro`):
   - World title and brief description
   - Quick stats (entry counts by category)
   - Recently updated entries
   - Campaign cards linking to campaign pages
   - Featured content or random entry highlight

3. **Category Index Pages** (`src/pages/[category]/index.astro`):
   - Filterable, sortable table/grid of all entries in that category
   - Filter by campaign, status, tags
   - Sort by name, first appearance, last updated
   - Card or list view toggle

4. **Entry Detail Pages** (`src/pages/[category]/[slug].astro`):
   - Rendered markdown body
   - Sidebar with frontmatter metadata (type, status, campaign, tags)
   - Cross-link rendering: `related` entries shown as clickable cards
   - "Appears in" section showing which campaigns reference this entry
   - Back/forward navigation within category

5. **Search Integration**:
   - Install and configure Pagefind
   - Add Pagefind UI component to header/sidebar
   - Configure search indexing in build step
   - Ensure search results link correctly with base path

6. **Campaign Pages** (`src/pages/campaigns/[slug].astro`):
   - Campaign overview with party roster
   - Timeline of events for that campaign
   - NPCs, locations, factions filtered to that campaign
   - Link to session preps/recaps (external, in TTRPG repo? or just references)

7. **Cross-Link Rendering**:
   - Build a utility that converts slug references in markdown body to clickable links
   - Or use a remark plugin that auto-links `[slug-name]` patterns to entry pages

8. **Deploy**:
   - Test GitHub Actions workflow
   - Push to main, verify site builds and deploys to peredocm.com/iouns-eye
   - Test all pages, search, navigation, and responsiveness

**Files Created/Modified**:
- `src/layouts/BaseLayout.astro` — Full layout with nav, sidebar, search
- `src/layouts/EntryLayout.astro` — Layout for individual entries
- `src/pages/index.astro` — Landing page
- `src/pages/npcs/index.astro` — NPC index
- `src/pages/npcs/[slug].astro` — NPC detail
- (Repeat for all 9 categories)
- `src/components/ui/SearchBar.astro` — Pagefind search component
- `src/components/ui/EntryCard.astro` — Reusable entry card
- `src/components/ui/FilterBar.astro` — Category filtering
- `src/components/ui/Breadcrumbs.astro` — Breadcrumb nav
- `src/components/ui/RelatedEntries.astro` — Cross-link display
- `src/styles/global.css` — Global styles and dark theme
- `astro.config.mjs` — Updated with any new integrations
- `.github/workflows/deploy.yml` — Verified and tested

**Success Criteria**:
- [ ] Site is live at peredocm.com/iouns-eye
- [ ] All category index pages render with correct entry counts
- [ ] All individual entry pages render with formatted markdown and metadata
- [ ] Search returns relevant results across all categories
- [ ] Cross-links between entries are clickable and navigate correctly
- [ ] Campaign pages show filtered views of their entities
- [ ] Site is responsive and usable on mobile
- [ ] Dark theme applied consistently
- [ ] No broken links or 404s
- [ ] Build time is reasonable (<2 minutes for full corpus)

**Known Risks**:
- Pagefind requires a post-build indexing step — must be integrated into the GitHub Actions workflow
- With 200-400+ entries, category index pages need pagination or virtual scrolling
- Base path `/iouns-eye/` must be correctly applied to all internal links and assets
- Cross-link rendering in markdown body is non-trivial — may need a custom remark plugin

---

### Phase 5: Interactive Calendar Component

**Objective**: Build a data-driven, interactive circular calendar that faithfully reproduces the Illustrator design and links to grimoire events.

**Prerequisites**: Phase 4 (calendar page needs to exist on the site)

**Steps**:
1. **Study the reference**: Analyze the existing circular calendar images (1136, 1129, etc.) to document exact visual structure:
   - Number of concentric rings and what each represents
   - Color scheme per season
   - How deity symbols and holy days are marked
   - How moon phases are indicated
   - Typography and label placement
2. **Build the SVG renderer** (`src/components/calendar/AstorianCalendar.tsx`):
   - React component that takes `year` as prop and `calendar.json` data
   - Render concentric rings using SVG `<circle>`, `<arc>`, `<text>` elements:
     - Outer ring: month names with seasonal color fills
     - Middle ring(s): 28-day number grid
     - Inner ring(s): moon phase indicators
     - Center: year display
   - Color code by season (green/yellow/orange/blue matching original)
   - Mark holy days with deity symbol icons
   - Mark King Tide and Fool Tide periods
3. **Add interactivity**:
   - Hover on a day: show tooltip with date, moon phase, tidal state, holy day (if any)
   - Click on a day: show events from the grimoire that occurred on this date
   - Click on a month: highlight the month and show its deity info
   - Click on a holy day: show holy day description
   - Year selector: switch between calendar years that have campaign data
4. **Create calendar page** (`src/pages/calendar.astro`):
   - Full-page calendar component with sidebar showing selected date/event details
   - Legend explaining rings, colors, and symbols
   - Link from calendar events to their grimoire entry pages
5. **Load as React island** with `client:load` (calendar needs to be interactive immediately)
6. **Add calendar link to main navigation**
7. **Optional: Export to SVG** — add a "Download SVG" button for print use

**Files Created/Modified**:
- `src/components/calendar/AstorianCalendar.tsx` — Main calendar component
- `src/components/calendar/CalendarRing.tsx` — Individual ring renderer
- `src/components/calendar/CalendarTooltip.tsx` — Hover tooltip
- `src/components/calendar/CalendarLegend.tsx` — Legend component
- `src/components/calendar/calendar-utils.ts` — Geometry calculations, arc math
- `src/pages/calendar.astro` — Calendar page
- `src/data/calendar.json` — May need refinements based on rendering needs

**Success Criteria**:
- [ ] Calendar renders as a circular design matching the Illustrator reference in structure
- [ ] All 14 months visible with correct seasonal coloring
- [ ] All 28 days per month numbered and laid out correctly
- [ ] Holy days marked with deity symbols
- [ ] Moon phases displayed (new on 7th, full on 21st)
- [ ] King Tide and Fool Tide periods visually indicated
- [ ] Hover tooltips show date context
- [ ] Clicking a date shows events from the grimoire for that date
- [ ] Year selector works across available campaign years
- [ ] Calendar is responsive (scales gracefully on smaller screens)
- [ ] Component renders correctly as React island in Astro

**Known Risks**:
- SVG circular layout math is non-trivial (arc segments, text-on-path, radial positioning)
- Fitting 14 months × 28 days legibly in a circle requires careful sizing
- Deity symbol images need to be sized and positioned within SVG (may need SVG versions of PNGs)
- Performance: rendering 392 day segments as individual SVG elements — may need optimization
- Mobile: circular calendars don't compress well to narrow screens — may need a linear fallback

---

### Phase 6: Map Integration

**Objective**: Make the world maps interactive with clickable regions linking to grimoire location entries.

**Prerequisites**: Phase 4 (location entries and pages must exist)

**Steps**:
1. **Prepare map images**:
   - Export high-resolution JPGs/PNGs from the Illustrator source files (if not already done)
   - Wanun Map (full continent), Wanun—Ekkorai (eastern detail), Khanae Map (western)
2. **Define clickable regions**:
   - Create `src/data/map-regions.json` mapping region IDs to:
     - SVG polygon coordinates (clickable area)
     - Location slug (grimoire entry to link to)
     - Label text and position
   - Use an image map editor or manually define polygon coordinates
3. **Build map component** (`src/components/map/WorldMap.tsx`):
   - React component showing map image with SVG overlay
   - Render clickable polygon regions over the image
   - Hover: highlight region, show location name tooltip
   - Click: navigate to location grimoire entry
   - Zoom/pan support (CSS transform-based, not a full map library)
   - Toggle between maps (Wanun full, Ekkorai detail, Khanae)
4. **Create map page** (`src/pages/map.astro`):
   - Full-page map component
   - Sidebar showing selected location details
   - Map selector (continent toggle)
5. **Add map link to main navigation**

**Files Created/Modified**:
- `src/components/map/WorldMap.tsx` — Main map component
- `src/components/map/MapOverlay.tsx` — SVG clickable overlay
- `src/components/map/MapTooltip.tsx` — Hover tooltip
- `src/data/map-regions.json` — Region definitions with polygon coordinates
- `src/pages/map.astro` — Map page
- `public/maps/` — Verified map images at correct resolution

**Success Criteria**:
- [ ] All three maps render at full resolution
- [ ] Clickable regions correspond to grimoire location entries
- [ ] Hover shows location name
- [ ] Click navigates to location entry page
- [ ] Zoom and pan work smoothly
- [ ] Map toggle switches between continent views
- [ ] Map is usable on mobile (touch zoom/pan)

**Known Risks**:
- Defining polygon coordinates for map regions is tedious manual work
- Map images may be very large (multi-MB) — need to optimize for web
- Zoom/pan can get complex — keep implementation simple (CSS transforms, not Leaflet/MapLibre)
- Region boundaries on hand-drawn maps are imprecise — clickable areas will be approximate

---

### Phase 7: `/grimoire` Claude Code Skill

**Objective**: Build a Claude Code skill for creating, updating, querying, and browsing grimoire entries via natural language.

**Prerequisites**: Phase 4 (entries must exist and site must be live so we can verify)

**Steps**:
1. Create skill file at `../.claude/skills/grimoire/SKILL.md` (in the parent TTRPG repo's skills directory)
2. Define skill capabilities:
   - **Create**: "Add an NPC named X who is Y in campaign Z" → creates entry file with proper frontmatter
   - **Update**: "Update Brenna Tolvane — she betrayed the party" → reads existing entry, adds information
   - **Query**: "What do we know about Potter's Field?" → reads INDEX.md, finds entry, returns summary
   - **List**: "Show me all alive NPCs in Rifthaven" → filters INDEX.md by criteria
   - **Link**: "Connect Brenna Tolvane to House of Autumn" → updates `related` fields on both entries
3. Skill reads INDEX.md first for lookups, then reads full entry files as needed
4. Skill writes entry files with proper frontmatter and valid markdown
5. Skill runs `npm run index` (or equivalent) after modifications to keep INDEX.md current
6. Document the path configuration so the skill knows where the iouns-eye repo lives

**Files Created/Modified**:
- `../.claude/skills/grimoire/SKILL.md` — The skill definition

**Success Criteria**:
- [ ] `/grimoire Add NPC: Dalla Voss, cursed curio merchant in Emberspost` creates a valid entry
- [ ] `/grimoire Update brenna-tolvane: she betrayed the party in Session 28` modifies the existing entry
- [ ] `/grimoire What is Potter's Field?` returns the location entry content
- [ ] `/grimoire List alive NPCs in rifthaven-online` returns filtered results
- [ ] Created/modified entries pass Astro build validation
- [ ] INDEX.md stays current after modifications

**Known Risks**:
- Skill needs to know the absolute path to the iouns-eye directory — may need to be configurable
- INDEX.md regeneration requires Node.js — skill must be able to run npm scripts
- Fuzzy matching on queries (e.g., "Brenna" should find "brenna-tolvane") — needs thoughtful implementation

---

### Phase 8: UX Rework — Campaign-First Navigation & Homepage

**Objective**: Reimagine the Ioun's Eye frontend around campaign-first browsing, a new homepage hub, and filtered visibility that hides defunct campaign content.

**Prerequisites**: Phase 7 (grimoire skill working, all content populated)

**Steps**:

1. **Filter defunct campaigns from frontend**:
   - Add a `status` field to campaign content schema: `active` | `completed` | `defunct`
   - Mark `rifthaven-irl` and `head-hunters` as `defunct`
   - Mark `ishetar-2` and `rifthaven-online` as `active`
   - Mark `ishetar-og`, `kalari`, `skt` as `completed`
   - Exclude defunct campaigns from all navigation, listing pages, and search indexing
   - Entries tagged **only** to defunct campaigns are excluded from search and browsing
   - Entries that appear in both defunct and non-defunct campaigns remain visible (without defunct campaign context)

2. **New homepage — project hub**:
   - Replace current homepage with a 2×3 thumbnail grid:
     - **Row 1**: Rifthaven Online | Ishetar 2.0 | Completed Campaigns
     - **Row 2**: Game 1 | Game 2 | VTT Product
   - Active campaign tiles link to campaign hub pages (step 3)
   - "Completed Campaigns" tile links to an archive listing page showing Ishetar OG, Kalari, and SKT
   - Game and VTT tiles are external links (thumbnails + URLs to their GitHub Pages deployments)
   - Clean, visual design — each tile gets a thumbnail image, title, and short tagline

3. **Campaign hub pages**:
   - Each active/completed campaign gets a hub page as its primary entry point
   - Hub shows campaign-scoped content: NPCs, locations, factions, events, items filtered to that campaign
   - Organized by content type with counts (e.g., "NPCs (23)" / "Locations (12)")
   - Campaign timeline or summary at the top
   - Links out to individual entry pages (which remain global/shared across campaigns)

4. **Navigation restructure**:
   - Primary nav shifts from content-type-first to campaign-first
   - Sidebar or top nav: Home | Rifthaven | Ishetar | Archive | Library
   - "Library" section preserves the current global browsing (all NPCs, all locations, etc.)
   - Campaign context carries through — when browsing within a campaign, related entries and cross-links prioritize same-campaign content
   - Breadcrumbs reflect campaign context: Home → Rifthaven Online → NPCs → Brenna Tolvane

5. **Entry page updates**:
   - Entry pages remain globally accessible (not duplicated per campaign)
   - Add campaign badge/tag showing which campaigns an entry appears in
   - When navigated to from a campaign hub, highlight that campaign's context (appearance details, status in that campaign)
   - Related entries section: if in campaign context, show same-campaign relations first

6. **Calendar and map integration**:
   - Calendar: when accessed from a campaign hub, default to that campaign's time period
   - Map: when accessed from a campaign hub, highlight locations relevant to that campaign

7. **Search updates**:
   - Pagefind index excludes defunct campaign content
   - Search results show campaign badges so users know which campaign an entry belongs to
   - Optional: campaign-scoped search when browsing within a campaign context

**Files Created/Modified**:
- `src/content.config.ts` — Campaign status field added
- `src/content/campaigns/*.md` — Status field added to all campaign entries
- `src/pages/index.astro` — New homepage hub layout
- `src/pages/campaigns/[slug].astro` — Campaign hub pages (new or reworked)
- `src/pages/archive.astro` — Completed campaigns listing (new)
- `src/components/ui/CampaignGrid.astro` — Homepage thumbnail grid (new)
- `src/components/ui/CampaignHub.astro` — Campaign hub layout (new)
- `src/components/ui/Sidebar.astro` — Restructured navigation
- `src/layouts/BaseLayout.astro` — Updated nav structure
- Various entry listing pages — Updated to support campaign filtering

**Success Criteria**:
- [ ] Homepage displays 2×3 thumbnail grid with correct links
- [ ] Clicking an active campaign leads to a campaign hub showing scoped content
- [ ] "Completed Campaigns" tile leads to archive page listing Ishetar OG, Kalari, SKT
- [ ] Game and VTT tiles link to correct external URLs
- [ ] Defunct campaign content (`rifthaven-irl`, `head-hunters`) does not appear anywhere in the frontend
- [ ] Entries shared between defunct and non-defunct campaigns still appear (without defunct context)
- [ ] Global library browsing (all NPCs, all locations) still works via "Library" nav
- [ ] Pagefind search excludes defunct content
- [ ] Campaign badges appear on entry pages
- [ ] Breadcrumbs reflect campaign context when navigating from a campaign hub
- [ ] Calendar defaults to campaign time period when accessed from a campaign hub
- [ ] Map highlights campaign-relevant locations when accessed from a campaign hub
- [ ] Mobile-responsive — campaign grid and hub pages work on small screens
- [ ] `npm run build` succeeds with no errors

**Known Risks**:
- Campaign-scoped filtering requires reliable `campaign_appearances` data on all entries — may need a data audit pass
- Thumbnail images for homepage tiles need to be sourced/created (Carlos may need to provide these)
- The "campaign context" breadcrumb/navigation state adds complexity — keep implementation simple (URL-based, not client-side state)
- Entry pages serving dual purpose (global + campaign-scoped) needs careful UX — avoid confusing users about what's filtered vs. what's global
- External links for games/VTT need URLs from Carlos

---

### Phase 9: Recap System Overhaul

**Objective**: Build the `recaps` content type in the grimoire, migrate all existing sessions from QMD files into individual MD files, and upgrade `/write-recap` to automate finalization — saving to the grimoire, extracting entities, and pushing to the VTT.

**Prerequisites**: Phase 8 (UX rework complete)

**Steps**:
1. **Re-enable and complete the `recaps` collection schema** in `content.config.ts`:
   - The schema stub is already commented out — uncomment and finalize with all required/optional fields
   - Required: `name` (display name), `campaign` (campaign identifier), `session_number` (number), `session_date` (date), `author` (string), `recap_type` (`dm` | `player`)
   - Optional: `in_game_date` (string), `level_milestone` (number), `arc_name` (string), `vtt_campaign_id` (string — Supabase UUID for this campaign, hardcoded per campaign)
   - Body: full markdown recap text

2. **Look up and hardcode VTT campaign UUIDs**:
   - Query the Supabase `campaigns` table using credentials from `VTT Product/.env.local`
   - Get the UUID for Ishetar 2.0 and Rifthaven Online
   - Store in the skill file for use during finalization

3. **Migrate QMD sessions → individual recap MD files**:
   - Parse both QMD files:
     - `Campaigns/Ishetar 2.0/Campaign Recaps.qmd`
     - `Campaigns/Rifthaven (Online)/Campaign Recaps.qmd`
   - For each `# Session N—Date` heading:
     - Extract session number and real-world date
     - Check for `{#anchor}` ID on the heading — if present, look up arc name by matching the anchor against the `# Narrative Arcs` TOC section
     - Extract `## In-Game Date` subheading if present
     - Extract level from `### Begin Level X` marker if present
     - Strip all Quarto-specific syntax (anchor IDs, level markers, QMD TOC sections) from body text
     - Create `src/content/recaps/{campaign-slug}-session-{nn}.md` with frontmatter populated from extracted data
   - Verify session counts match QMD (no sessions dropped)
   - Leave QMD files in place as read-only archives — do not delete or modify

4. **Upgrade `/write-recap` skill** (`../.claude/skills/write-recap/SKILL.md`):
   - **Draft phase** (reads from recaps, not QMD):
     - Study voice by reading the most recent 3-4 sessions from `src/content/recaps/` for the relevant campaign
   - **Finalization phase** — triggered when the user explicitly says "mark as final" (or clear equivalent):
     - a. Write the recap to `src/content/recaps/{campaign-slug}-session-{nn}.md` with complete frontmatter
     - b. Extract named entities (NPCs, locations, factions, items, events) from the recap text
     - c. For each entity: check INDEX.md — update existing grimoire entry or create new one
     - d. Update `related` fields bidirectionally for entities that interacted
     - e. Regenerate INDEX.md (`npm run index`)
     - f. Convert recap markdown body to HTML (`pandoc -f markdown -t html`)
     - g. Push HTML to Supabase `campaign_recaps` table via REST API using service role key from `VTT Product/.env.local` — upsert on `session_number` + `campaign_id` conflict
     - h. `git add src/content/recaps/` → `git commit` → `git push origin main`
     - i. Report: "Session N saved to grimoire as `{slug}`. Created X new entries, updated Y. Pushed to VTT. Deploying."

**Files Created/Modified**:
- `iouns-eye/src/content.config.ts` — Re-enable `recaps` collection with full schema
- `iouns-eye/src/content/recaps/` — New directory, all migrated session MD files
- `../.claude/skills/write-recap/SKILL.md` — Major upgrade with finalization phase

**Success Criteria**:
- [ ] `recaps` collection validates in `npm run build` with no errors
- [ ] All sessions from both QMDs exist as individual MD files in `src/content/recaps/`
- [ ] Session counts match QMD source (no sessions dropped)
- [ ] Arc names correctly assigned where QMD had `{#anchor}` IDs
- [ ] Level milestones correctly assigned from `### Begin Level X` markers
- [ ] QMD files untouched and preserved as archives
- [ ] `/write-recap` draft phase reads from `src/content/recaps/` correctly
- [ ] Finalization saves recap MD with complete frontmatter
- [ ] Finalization extracts entities and creates/updates grimoire entries
- [ ] Finalization pushes HTML to Supabase `campaign_recaps`
- [ ] Finalization triggers iouns-eye deploy via `git push`
- [ ] End-to-end test: write a new recap, mark as final, verify grimoire entries, verify VTT

**Known Risks**:
- QMD arc anchor parsing is fragile — verify arc assignments manually after migration
- Supabase push uses service role key from `VTT Product/.env.local` — if path changes, skill breaks
- Entity extraction from prose is imprecise — limit to clearly named entities, skip generic descriptions
- Pandoc must be installed locally for MD → HTML conversion (already required for earlier phases)
- Git push requires iouns-eye working tree to be clean — skill should handle uncommitted state gracefully

---

### Phase 10: QMD Migration — Populate Recaps Collection

**Objective**: Parse both campaign QMDs, extract every session into individual recap MD files, populate the campaign pages with real content, and bulk-push all historical recaps to Supabase. After this phase, `src/content/recaps/` is the single source of truth for both campaigns and the QMDs are archived.

**Prerequisites**: Phase 9 complete (`recaps` content collection schema exists, `/write-recap` finalization working)

**Source Files**:
- `Campaigns/Ishetar 2.0/Campaign Recaps.qmd`
- `Campaigns/Rifthaven Online/Campaign Recaps.qmd`

**Steps**:

1. **Parse the QMDs**:
   - Read each QMD in full
   - Split on session headings (`# Session N—Date {#anchor}`)
   - For each session, extract:
     - `session_number` — from the heading number
     - `session_date` — real-world date from the heading
     - `in_game_date` — from the `## {date}` subheading immediately following
     - `arc_name` — from the `# Narrative Arcs` TOC at the top: find which anchor matches the session's `{#anchor}` ID and read the arc label (e.g. `Arc 1—Help the Caldrows`)
     - `level_milestone` — if `### Begin Level N {#levelupN}` appears inside this session block, record N
     - Recap body — all markdown content below the in-game date subheading, cleaned of QMD-specific formatting
   - Sessions with no arc anchor or no level marker → omit those fields entirely (do not use null or empty string)

2. **Write individual MD files**:
   - One file per session: `iouns-eye/src/content/recaps/{campaign-slug}-session-{NN:02d}.md`
   - Use the standard frontmatter template from `/write-recap` SKILL.md
   - `vtt_campaign_id` hardcoded per campaign (see write-recap skill for UUIDs)

3. **Update campaign pages to display real recaps**:
   - Replace the placeholder session list ("Showing 5 of 43 sessions — full recaps coming soon") on each campaign page with a real rendered list from the `recaps` collection
   - Each session should show: session number, title (arc name or session date fallback), in-game date, and expand/collapse for full recap body
   - Match the existing visual style of the session log cards already present on the page

4. **Bulk push all migrated recaps to Supabase**:
   - For each migrated recap MD file, convert body to HTML (pandoc) and upsert to `campaign_recaps` table
   - Same upsert pattern as write-recap finalization step f
   - Conflict key: `(session_number, campaign_id)`

5. **Archive QMD files**:
   - Move each QMD to `Campaigns/{Campaign}/Archive/Campaign Recaps.qmd`
   - Do not delete

6. **Regenerate INDEX.md and build**:
   - `npm run index`
   - `npm run build` — verify no errors
   - `git push origin main`

**Files Created/Modified**:
- `iouns-eye/src/content/recaps/ishetar-2-session-01.md` through `ishetar-2-session-NN.md`
- `iouns-eye/src/content/recaps/rifthaven-online-session-01.md` through `rifthaven-online-session-NN.md`
- `iouns-eye/src/pages/campaigns/[slug].astro` (or equivalent) — replace placeholder with real recap list
- `iouns-eye/INDEX.md` — regenerated
- QMDs moved to Archive folders

**Success Criteria**:
- [ ] Every session from both QMDs exists as an individual MD file in `src/content/recaps/`
- [ ] All sessions with arc markers have `arc_name` in frontmatter; sessions without do not
- [ ] All sessions with level-up markers have `level_milestone` in frontmatter; sessions without do not
- [ ] Campaign pages display real session list — no placeholder text remains
- [ ] All migrated recaps successfully upserted to Supabase `campaign_recaps`
- [ ] QMDs moved to Archive (not deleted)
- [ ] `npm run build` succeeds with no errors
- [ ] Site deploys and campaign pages render correctly

**Known Risks**:
- QMD arc anchor IDs may not match exactly — verify mapping carefully before writing frontmatter
- Some sessions may span multiple in-game dates — use the opening date, note in body if needed
- Pandoc bulk conversion: if a session body has unusual markdown, HTML output may need cleanup

---

### Phase 11: Prep Session Upgrade + Repo Cleanup

**Objective**: Enrich session prep with grimoire context, then clean up the parent repo.

**Prerequisites**: Phase 10 complete (recaps migrated, grimoire populated)

**Steps**:
1. **Upgrade `/prep-session`** with grimoire lookup step:
   - Before generating prep, read INDEX.md
   - Identify relevant entities: NPCs from recent sessions, current locations, active factions, open plot threads from events
   - Read full grimoire entries for identified entities — cap at 5-7 most relevant to avoid context overload
   - Pass context into prep generation
   - Add "Grimoire References" section to prep output listing consulted entry slugs
   - Update prep template in SKILL.md accordingly

2. **Remove compiled HTML output files**:
   - Delete any `.html` files generated by Quarto renders that are no longer needed

3. **Clean up parent repo**:
   - Remove `.DS_Store` files
   - Archive old blank prep sheets and grid files if no longer used
   - Identify any remaining duplicate information between source files and grimoire entries

4. **Final INDEX.md verification**:
   - Run `npm run index`
   - Verify all entries, cross-references, and campaign links are correct
   - Spot-check 10-20 entries for accuracy

**Files Created/Modified**:
- `../.claude/skills/prep-session/SKILL.md` — Updated with grimoire lookup step and "Grimoire References" output section
- Various files in parent TTRPG repo (cleanup)
- `INDEX.md` — Final verified version

**Success Criteria**:
- [ ] `/prep-session` reads grimoire entries before generating prep
- [ ] Prep output references established lore consistently (no contradictions)
- [ ] "Grimoire References" section lists consulted entry slugs
- [ ] No compiled HTML outputs remain from Quarto renders
- [ ] `npm run build` succeeds with no errors
- [ ] Full end-to-end test: run `/write-recap` → finalize → run `/prep-session` → verify grimoire context enriches output

**Known Risks**:
- Too many grimoire entries in prep context window can overwhelm the prompt — strictly cap at 5-7 most relevant
- Prep skill path references must be verified if any files moved during cleanup

---

## UI/UX Specification

### Layout
- **Max width**: 1400px centered
- **Sidebar**: 280px fixed left (collapsible on mobile)
- **Content area**: Remaining width with 40px padding
- **Header**: 64px height, fixed top, contains search bar and site title

### Color Palette (Dark Theme)
| Role | Hex | Usage |
|------|-----|-------|
| Background | `#0f0f1a` | Page background |
| Surface | `#1a1a2e` | Cards, sidebar, elevated elements |
| Surface Hover | `#25253d` | Interactive element hover state |
| Border | `#2a2a4a` | Dividers and card borders |
| Text Primary | `#e0e0e0` | Body text |
| Text Secondary | `#8888aa` | Metadata, labels, secondary info |
| Accent (Ioun Blue) | `#4a9eff` | Links, active states, highlights |
| Accent Hover | `#6bb3ff` | Link hover |
| Spring Green | `#4a9e68` | Calendar spring months |
| Summer Gold | `#c4a035` | Calendar summer months |
| Autumn Orange | `#c46a35` | Calendar autumn months |
| Winter Blue | `#3568a8` | Calendar winter months |
| Status Alive | `#4a9e68` | NPC alive indicator |
| Status Dead | `#9e4a4a` | NPC dead indicator |
| Status Unknown | `#8888aa` | NPC unknown indicator |

### Typography
- **Headings**: System serif stack (`Georgia, 'Times New Roman', serif`) — fantasy/scholarly feel
- **Body**: System sans stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`)
- **Code/Metadata**: System mono stack
- **Base size**: 16px, scale: 1.25

### Component Hierarchy
```
App
├── Header
│   ├── SiteTitle (links to home)
│   ├── SearchBar (Pagefind)
│   └── MobileMenuToggle
├── Sidebar
│   ├── CategoryNav
│   │   ├── NPCs (with count badge)
│   │   ├── Locations
│   │   ├── Factions
│   │   ├── Events
│   │   ├── Items
│   │   ├── Deities
│   │   ├── Lore
│   │   ├── Campaigns
│   │   └── PCs
│   ├── CalendarLink
│   └── MapLink
├── MainContent
│   ├── Breadcrumbs
│   ├── [Page Content]
│   └── Footer
└── [React Islands]
    ├── AstorianCalendar
    └── WorldMap
```

### Responsive Breakpoints
- **Desktop**: ≥1024px — full sidebar + content
- **Tablet**: 768px–1023px — collapsible sidebar overlay
- **Mobile**: <768px — hamburger menu, single column, calendar in linear mode

---

## Domain Rules

### Astorian Calendar Rules
- 14 months × 28 days = 392 days per year
- Each month is exactly 4 weeks (no partial weeks)
- Month 1 (Avandra) always starts on the same day of the week within a given year
- Holy days are fixed to specific days within their month (not floating)
- Moon phases are deterministic: Day 7 = New, Day 14 = First Quarter, Day 21 = Full, Day 28 = Last Quarter
- All three moons follow the same phase cycle (they align on 7th and 21st)
- King Tides span days 19-23 of every month (peak gravitational pull at full moon alignment)
- Fool Tides span days 5-9 of every month (weakest pull at new moon)
- Seasons: Spring = months 1-3 (Avandra, Melora, Yondalla), Summer = months 4-7 (Corellon, Ioun, Pelor, Glittergold), Autumn = months 8-10 (Moradin, Erathis, Obitris), Winter = months 11-14 (Sehanine, Kord, Bahamut, Raei)

### Campaign Timeline
| Campaign | In-World Years | Era |
|----------|---------------|-----|
| Ishetar OG | 1082 TA | Third Age |
| Ruins of Kalari | 1088-1089 TA | Third Age |
| SKT One Last Job | 1094 TA | Third Age |
| Rifthaven IRL | 1127-1128 TA | Third Age |
| Head Hunters Return to Wanun | TBD | Third Age |
| Ishetar 2.0 | 1136 TA | Third Age |
| Rifthaven Online | 1136 TA | Third Age |

### Entity Cross-Referencing Rules
- Every entry's `related` field should contain slugs of entities it directly interacts with
- Relationships are bidirectional: if A lists B as related, B should list A
- Campaign scoping: an NPC's status may differ across campaigns (alive in 1094, dead by 1136)
- When an entity appears in multiple campaigns, the entry body should have a `## Timeline` section documenting changes chronologically
- Location hierarchy: every location should specify `parent_location` to enable drill-down navigation (Continent → Region → City → District → Building)
- Events should always have at least a `year` for temporal sorting, even if exact date is unknown

### Slug Conventions
- Kebab-case, lowercase: `brenna-tolvane`, `house-of-autumn`, `the-rift-opening`
- No articles at the start unless critical to the name: `restful-lily` not `the-restful-lily`
- Multi-word deity names use full name: `the-knowing-mistress` for Ioun's title (but slug is `ioun` for the deity entry)
- Campaign slugs are short identifiers: `ishetar-og`, `ishetar-2`, `rifthaven-irl`, `rifthaven-online`, `kalari`, `skt`, `head-hunters`
