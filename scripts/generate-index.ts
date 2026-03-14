import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(import.meta.dirname, '..', 'src', 'content');
const INDEX_PATH = path.join(import.meta.dirname, '..', 'INDEX.md');

interface EntryMeta {
  slug: string;
  name: string;
  summary: string;
}

const CATEGORIES = [
  { dir: 'npcs', label: 'NPCs', summaryFields: ['status', 'title'] },
  { dir: 'locations', label: 'Locations', summaryFields: ['location_type', 'region'] },
  { dir: 'factions', label: 'Factions', summaryFields: ['faction_type', 'status'] },
  { dir: 'events', label: 'Events', summaryFields: ['year', 'campaign'] },
  { dir: 'items', label: 'Items', summaryFields: ['item_type', 'rarity'] },
  { dir: 'deities', label: 'Deities', summaryFields: ['title', 'category'] },
  { dir: 'lore', label: 'Lore', summaryFields: ['lore_type'] },
  { dir: 'campaigns', label: 'Campaigns', summaryFields: ['status', 'start_year'] },
  { dir: 'pcs', label: 'PCs', summaryFields: ['race', 'class', 'campaign'] },
];

function parseFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const result: Record<string, unknown> = {};

  for (const line of yaml.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    let value: string | string[] = line.slice(colonIndex + 1).trim();

    // Handle simple arrays like [a, b, c]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    } else {
      // Remove quotes
      value = value.replace(/^["']|["']$/g, '');
    }

    result[key] = value;
  }

  return result;
}

function getEntries(categoryDir: string, summaryFields: string[]): EntryMeta[] {
  const dirPath = path.join(CONTENT_DIR, categoryDir);
  if (!fs.existsSync(dirPath)) return [];

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
  const entries: EntryMeta[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
    const data = parseFrontmatter(content);
    const slug = file.replace('.md', '');
    const name = (data.name as string) || slug;

    const summaryParts: string[] = [];
    for (const field of summaryFields) {
      const val = data[field];
      if (val) {
        summaryParts.push(Array.isArray(val) ? val.join(', ') : String(val));
      }
    }

    const campaigns = data.campaigns || data.campaign;
    if (campaigns) {
      const campStr = Array.isArray(campaigns) ? campaigns.join(', ') : String(campaigns);
      summaryParts.push(`[${campStr}]`);
    }

    entries.push({
      slug,
      name,
      summary: summaryParts.join(' | '),
    });
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

function generateIndex(): void {
  const lines: string[] = [
    '# Ioun\'s Eye — Codex Index',
    '<!-- Auto-generated. Do not edit manually. Run `npm run index` to regenerate. -->',
    `<!-- Last updated: ${new Date().toISOString().split('T')[0]} -->`,
    '',
  ];

  for (const category of CATEGORIES) {
    const entries = getEntries(category.dir, category.summaryFields);
    lines.push(`## ${category.label} (${entries.length})`);

    if (entries.length === 0) {
      lines.push('_No entries yet._');
    } else {
      for (const entry of entries) {
        const summary = entry.summary ? ` — ${entry.summary}` : '';
        lines.push(`- \`${entry.slug}\` ${entry.name}${summary}`);
      }
    }

    lines.push('');
  }

  fs.writeFileSync(INDEX_PATH, lines.join('\n'));
  console.log(`INDEX.md generated with entries across ${CATEGORIES.length} categories.`);
}

generateIndex();
