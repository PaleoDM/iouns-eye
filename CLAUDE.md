# Ioun's Eye — World Grimoire for Astoria

## Project Context
Ioun's Eye is a wiki-style website and knowledge management system for the D&D homebrew world of Astoria. It serves two audiences simultaneously: the DM (Carlos) browses it as an interactive wiki with search, cross-links, and an interactive calendar; Claude Code reads the same source files as context for session prep, recap writing, and world-building. Named after Ioun, the Knowing Mistress — goddess of all knowledge in the Astorian pantheon.

**Read `ROADMAP.md` before doing any work.** It contains the complete development plan.

## Tech Stack
| Layer | Choice | Why |
|---|---|---|
| Framework | Astro 5 | Purpose-built for content-driven static sites; native markdown content collections with schema validation |
| Interactive Components | React 19 | Islands architecture — React only loads for calendar and map components; Carlos already knows React from the VTT |
| Styling | Tailwind CSS v4 | Consistent with VTT Product; utility-first for rapid iteration |
| Search | Pagefind | Client-side static search, zero server cost, integrates cleanly with Astro |
| Language | TypeScript | Type safety on content schemas and components |
| Hosting | GitHub Pages | Free, already set up under PaleoDM account at peredocm.com |
| CI/CD | GitHub Actions | Auto-build and deploy on push to main |

## Current Phase
Phase 10

## Development Phases
| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Project scaffolding & configuration | Complete |
| 1 | Foundational lore extraction | Complete |
| 2 | Completed campaign extraction | Complete |
| 3 | Active campaign extraction | Complete |
| 4 | Website build — full wiki with search, browsing, cross-links | Complete |
| 5 | Interactive calendar component | Complete |
| 6 | Map integration with clickable regions | Complete |
| 7 | `/grimoire` Claude Code skill | Complete |
| 8 | UX Rework — campaign-first navigation & homepage | Complete |
| 9 | `/write-recap` and `/prep-session` skill upgrades | Complete |
| 10 | QMD migration — populate recaps collection & campaign pages | Not Started |
| 11 | `/prep-session` upgrade + repo cleanup | Not Started |

## Rules for Agents
- Follow `ROADMAP.md` phases exactly — do not skip ahead or improvise architecture
- Each phase has explicit success criteria — verify all of them before marking complete
- Update the "Current Phase" and status table in this file when completing a phase
- Commit after each phase completion with message format: `"Phase N: {Name} — {Summary}"`
- The grimoire entry files in `src/content/` are the **single source of truth** for world knowledge
- Never fabricate lore — only extract what exists in source material or what Carlos explicitly provides
- When extracting entities, preserve the DM's voice and intent — do not editorialize
- Cross-references between entries use slugs, not display names (e.g., `related: [brenna-tolvane]` not `related: [Brenna Tolvane]`)
- All dates use the Astorian calendar format: `{day} {month-name} {year}` (e.g., `25 Bahamut 1136`)
- Year format: numeric only in data, display as "1136 TA" (Third Age) in rendered content

## Key Files
- `ROADMAP.md` — Complete development roadmap (the source of truth for implementation)
- `INDEX.md` — Auto-generated master index of all grimoire entries (Claude's quick-lookup file)
- `src/content.config.ts` — Astro content collection schemas (defines all entry types)
- `src/data/calendar.json` — Calendar system data (months, holy days, moon phases, tides)
- `src/data/deities.json` — Complete deity data (names, titles, domains, symbols)

## Project Structure
```
iouns-eye/
├── src/
│   ├── content/              # Grimoire entries (markdown + YAML frontmatter)
│   │   ├── npcs/
│   │   ├── locations/
│   │   ├── factions/
│   │   ├── events/
│   │   ├── items/
│   │   ├── lore/
│   │   ├── deities/
│   │   ├── campaigns/
│   │   ├── chronicles/       # Player-created content (narratives, journals, recaps)
│   │   └── pcs/
│   ├── content.config.ts     # Content collection schemas
│   ├── components/           # Astro + React components
│   │   ├── calendar/         # Interactive circular calendar (React island)
│   │   ├── map/              # Interactive world map (React island)
│   │   ├── search/           # Pagefind search integration
│   │   └── ui/               # Shared UI components
│   ├── layouts/              # Page layouts
│   ├── pages/                # Astro pages (routes)
│   ├── styles/               # Global styles
│   └── data/                 # Structured JSON data
│       ├── calendar.json
│       └── deities.json
├── public/
│   ├── maps/                 # World map images (exported from Illustrator)
│   ├── chronicles/           # Player-written original documents (PDFs)
│   ├── deity-symbols/        # Deity symbol PNGs
│   └── deity-tokens/         # Deity token PNGs
├── INDEX.md                  # Master index for Claude Code lookups
├── CLAUDE.md
├── ROADMAP.md
├── DEPLOY.md
├── astro.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Key Architectural Rules

### Content & Data
- Grimoire entries are markdown files with YAML frontmatter in `src/content/`
- Astro content collections validate frontmatter against Zod schemas in `content.config.ts`
- Structured reference data (calendar, deities) lives in `src/data/` as JSON — not as content collections
- Entry slugs are kebab-case derived from filenames (e.g., `brenna-tolvane.md` → slug `brenna-tolvane`)
- Cross-references between entries use the `related` frontmatter field with an array of slugs
- Campaign-scoped fields (like NPC status) use a `campaign_appearances` array of objects, not flat fields

### Styling
- Tailwind CSS v4 for all styling — no CSS modules, no styled-components
- Dark theme by default (this is a fantasy world grimoire, not a docs site)
- Responsive: mobile-friendly but desktop-primary

### Interactive Components
- Calendar and Map are React components loaded as Astro islands (`client:load` or `client:visible`)
- Keep React islands minimal — most pages are static Astro components with zero JS
- Calendar renders as SVG within a React component
- Map uses an image base layer with SVG overlay for clickable regions

### Deployment
- Static output only — no SSR, no server functions
- GitHub Pages deployment via GitHub Actions on push to main
- Base path: `/iouns-eye/` (deployed as a slug under peredocm.com)

## Data Patterns

### Entry Type Slugs
`npc` | `location` | `faction` | `event` | `item` | `lore` | `deity` | `campaign` | `pc` | `chronicle`

### Campaign Identifiers
`ishetar-og` | `head-hunters` | `kalari` | `skt` | `rifthaven-irl` | `ishetar-2` | `rifthaven-online`

### NPC Status Values
`alive` | `dead` | `unknown` | `missing` | `transformed` | `imprisoned`

### Location Types
`continent` | `region` | `city` | `district` | `building` | `dungeon` | `wilderness` | `planar`

### Faction Types
`political` | `religious` | `criminal` | `military` | `commercial` | `secret` | `planar`

### Calendar Constants
- 14 months × 28 days = 392 days/year
- 7-day weeks (S, M, T, W, R, F, S)
- King Tides: days 19–23 (peak 21, full moons)
- Fool Tides: days 5–9 (peak 7, new moons)
- Seasons: Spring (months 1–3: Avandra, Melora, Yondalla), Summer (months 4–7: Corellon, Ioun, Pelor, Glittergold), Autumn (months 8–10: Moradin, Erathis, Obitris), Winter (months 11–14: Sehanine, Kord, Bahamut, Raei)

### Month Order
1. Avandra, 2. Melora, 3. Yondalla (Spring)
4. Corellon, 5. Ioun, 6. Pelor, 7. Glittergold (Summer)
8. Moradin, 9. Erathis, 10. Obitris (Autumn)
11. Sehanine, 12. Kord, 13. Bahamut, 14. Raei (Winter)

## Commands
```bash
npm run dev          # Start dev server (localhost:4321)
npm run build        # Production build to dist/
npm run preview      # Preview production build locally
npm run index        # Regenerate INDEX.md from content collections
```

## Manual Steps (Developer, Not Agent)
- Copy map JPGs from `World Building/` to `public/maps/` (one-time, Phase 0)
- Copy deity symbol/token PNGs from `World Building/` to `public/` (one-time, Phase 0)
- Create GitHub repo `iouns-eye` under PaleoDM account
- Configure GitHub Pages to deploy from GitHub Actions
- Install pandoc locally for .docx → .md conversion (needed for completed campaign extraction)

## Do NOT
- Do NOT use Quarto — the project is explicitly moving away from it
- Do NOT use Next.js for this project — Astro is the chosen framework
- Do NOT add SSR or server-side functionality — this is a static site
- Do NOT fabricate world lore — only extract from existing source material or DM-provided input
- Do NOT modify files in the parent TTRPG repo (`../`) during site build phases
- Do NOT use `getStaticPaths` patterns from Astro v4 — use Astro 5 Content Layer API
- Do NOT install a separate search library (Algolia, Lunr, etc.) — use Pagefind
- Do NOT put content entry files anywhere except `src/content/` — Astro requires this
- Do NOT hardcode the base path — use `import.meta.env.BASE_URL` for all internal links
