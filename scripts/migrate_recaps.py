#!/usr/bin/env python3
"""
Phase 9: QMD → Recap MD migration
Parses both Campaign Recaps.qmd files and emits individual MD files
into iouns-eye/src/content/recaps/.
"""

import re
import os
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
REPO_ROOT = SCRIPT_DIR.parent
RECAPS_DIR = REPO_ROOT / "src" / "content" / "recaps"
RECAPS_DIR.mkdir(parents=True, exist_ok=True)

CAMPAIGNS = [
    {
        "slug": "ishetar-2",
        "vtt_campaign_id": "734eb9bf-29d0-4a16-b587-76c747c0d9fe",
        "qmd_path": Path("/Users/carlosperedo/Library/CloudStorage/Dropbox/TTRPGs/Astoria\u2014My World/Campaigns/Ishetar 2.0/Campaign Recaps.qmd"),
        # anchor -> arc_name. Arc carries forward until next anchor session.
        "arc_anchors": {
            "caldrows": "Help the Caldrows",
            "vegepygmies": "Deliver Meat to the Vegepygmies",
            "priceofbeauty": "The Price of Beauty",
            "emberspost": "Emberspost",
            "firewatchisland": "Firewarch Island",
        },
        # session_number -> arc override (for arcs with no anchor in QMD)
        "arc_overrides": {
            28: "Turquoise Timber Trust",
            29: "Turquoise Timber Trust",
            30: "Turquoise Timber Trust",
        },
    },
    {
        "slug": "rifthaven-online",
        "vtt_campaign_id": "d5b1d1b5-305d-4c4c-929a-f6bfd282aa91",
        "qmd_path": Path("/Users/carlosperedo/Library/CloudStorage/Dropbox/TTRPGs/Astoria\u2014My World/Campaigns/Rifthaven (Online)/Campaign Recaps.qmd"),
        "arc_anchors": {
            "sparkworks": "Sparkworks Tunnels",
            "backstoryinterludes1": "Backstory Interludes 1",
            "rocrun": "Roc Egg Run",
            "salvation": "Salvation",
            "nannypupu": "Boughshadow",
            "shadowfell": "Shadowfell",
        },
        "arc_overrides": {},
    },
]


def strip_frontmatter(text: str) -> str:
    """Remove YAML frontmatter block."""
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            return text[end + 4:].lstrip("\n")
    return text


def parse_arc_anchors_from_toc(text: str, arc_anchors: dict) -> dict:
    """
    Build anchor -> arc_name from the # Narrative Arcs section.
    Returns normalized lowercase anchor -> arc_name.
    """
    # Extract Narrative Arcs section
    match = re.search(r'# Narrative Arcs\n(.*?)(?=\n# |\Z)', text, re.DOTALL)
    if not match:
        return arc_anchors
    # arc_anchors already provided directly — just normalize keys
    return {k.lower(): v for k, v in arc_anchors.items()}


def parse_level_milestones(text: str) -> dict:
    """
    Build anchor -> level from # Leveling Milestones section.
    E.g. [Level 3](#levelup3) + ### Begin Level 3 {#levelup3}
    Returns anchor (lowercase, no #) -> level number.
    """
    milestones = {}
    section_match = re.search(r'# Leveling Milestones\n(.*?)(?=\n# |\Z)', text, re.DOTALL)
    if section_match:
        section = section_match.group(1)
        for m in re.finditer(r'\[Level (\d+)\]\(#([^)]+)\)', section):
            level = int(m.group(1))
            anchor = m.group(2).lower()
            milestones[anchor] = level
    return milestones


def clean_body(body: str) -> str:
    """Strip Quarto-specific syntax from body text."""
    # Remove local image references (no path separator = local file, can't resolve in Astro)
    body = re.sub(r'!\[([^\]]*)\]\((?!http|/)[^)]+\)', r'<!-- image: \1 -->', body)
    # Remove {#anchor} inline IDs
    body = re.sub(r'\s*\{#[^}]+\}', '', body)
    # Remove ^ superscripts (e.g. 14^th^)
    body = re.sub(r'\^([^^]+)\^', r'\1', body)
    # Remove backslash line continuations (QMD poetry/blockquotes use \\\n)
    body = re.sub(r'\\\n', '\n', body)
    # Collapse 3+ blank lines to 2
    body = re.sub(r'\n{3,}', '\n\n', body)
    return body.strip()


def extract_in_game_date(block: str):
    """Extract ## In-Game Date subheading content."""
    m = re.search(r'^## (.+)$', block, re.MULTILINE)
    if m:
        candidate = m.group(1).strip()
        # In-game dates look like "10th of Obitris, 1136"
        if re.search(r'\d{3,4}', candidate):
            return candidate
    return None


def extract_level_milestone(block: str, level_milestones: dict):
    """Extract level from ### Begin Level X marker."""
    m = re.search(r'### Begin Level (\d+)', block)
    if m:
        return int(m.group(1))
    return None


def remove_structural_headings(body: str) -> str:
    """Remove ## In-Game Date and ### Begin/End Level X lines from body."""
    lines = body.split('\n')
    cleaned = []
    for line in lines:
        if re.match(r'^## \d', line):  # ## 10th of... (in-game date)
            continue
        if re.match(r'^### (Begin|End) Level \d+', line):
            continue
        cleaned.append(line)
    return '\n'.join(cleaned)


def parse_session_heading(heading: str):
    """
    Parse '# Session N—Date {#optional-anchor}'
    Returns (session_number, session_date, anchor_or_None)
    """
    # Strip leading '# Session '
    rest = heading.lstrip('#').strip()
    rest = re.sub(r'^Session\s+', '', rest)

    # Extract anchor
    anchor = None
    anchor_match = re.search(r'\{#([^}]+)\}', rest)
    if anchor_match:
        anchor = anchor_match.group(1).lower()
        rest = rest[:anchor_match.start()].strip()

    # Split on em dash or regular dash
    parts = re.split(r'[—–-]', rest, maxsplit=1)
    session_number = int(parts[0].strip())
    session_date = parts[1].strip() if len(parts) > 1 else ""

    return session_number, session_date, anchor


def yaml_str(s: str) -> str:
    """Wrap string in double quotes, escaping internal quotes."""
    return '"' + s.replace('"', '\\"') + '"'


def process_campaign(campaign: dict) -> int:
    slug = campaign["slug"]
    vtt_id = campaign["vtt_campaign_id"]
    qmd_path = campaign["qmd_path"]
    arc_anchors = {k.lower(): v for k, v in campaign["arc_anchors"].items()}
    arc_overrides = campaign.get("arc_overrides", {})

    print(f"\nProcessing {slug} from {qmd_path.name}")
    text = qmd_path.read_text(encoding="utf-8")
    text = strip_frontmatter(text)

    level_milestones = parse_level_milestones(text)

    # Split into session blocks on lines starting with '# Session '
    session_pattern = re.compile(r'^(# Session .+)$', re.MULTILINE)
    splits = list(session_pattern.finditer(text))

    if not splits:
        print(f"  WARNING: No sessions found in {qmd_path.name}")
        return 0

    count = 0
    current_arc = None

    for i, match in enumerate(splits):
        heading = match.group(1)
        start = match.end()
        end = splits[i + 1].start() if i + 1 < len(splits) else len(text)
        block = text[start:end]

        session_number, session_date, anchor = parse_session_heading(heading)

        # Update current arc from anchor
        if anchor and anchor in arc_anchors:
            current_arc = arc_anchors[anchor]

        # Apply override (supersedes anchor-derived arc)
        arc_name = arc_overrides.get(session_number, current_arc)

        in_game_date = extract_in_game_date(block)
        level_milestone = extract_level_milestone(block, level_milestones)

        # Clean body
        body = remove_structural_headings(block)
        body = clean_body(body)

        # Build frontmatter
        lines = ["---"]
        campaign_label = "Ishetar" if slug == "ishetar-2" else "Rifthaven"
        display_name = f"{campaign_label} Session {session_number} \u2014 {session_date}"
        lines.append(f'name: {yaml_str(display_name)}')
        lines.append(f"campaign: {slug}")
        lines.append(f"session_number: {session_number}")
        lines.append(f"session_date: {yaml_str(session_date)}")
        lines.append(f"author: PaleoDM")
        lines.append(f"recap_type: dm")
        if in_game_date:
            lines.append(f"in_game_date: {yaml_str(in_game_date)}")
        if level_milestone:
            lines.append(f"level_milestone: {level_milestone}")
        if arc_name:
            lines.append(f"arc_name: {yaml_str(arc_name)}")
        lines.append(f"vtt_campaign_id: {yaml_str(vtt_id)}")
        lines.append("tags: []")
        lines.append("related: []")
        lines.append("---")

        frontmatter = "\n".join(lines)
        content = frontmatter + "\n\n" + body + "\n"

        filename = f"{slug}-session-{session_number:02d}.md"
        out_path = RECAPS_DIR / filename
        out_path.write_text(content, encoding="utf-8")
        count += 1

    print(f"  Written {count} session files")
    return count


def main():
    total = 0
    for campaign in CAMPAIGNS:
        total += process_campaign(campaign)
    print(f"\nTotal: {total} recap files written to {RECAPS_DIR}")


if __name__ == "__main__":
    main()
