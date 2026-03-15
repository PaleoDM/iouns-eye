# Deployment

## Development
```bash
npm run dev
# Starts Astro dev server at http://localhost:4321/iouns-eye/
```

## Production Build
```bash
npm run build
# Outputs static site to dist/
```

## Preview Production Build
```bash
npm run preview
# Serves dist/ locally for testing before deploy
```

## Deploy
Deployment is automatic via GitHub Actions on push to `main`.

```bash
git push origin main
# GitHub Actions builds and deploys to GitHub Pages
```

## URL
https://www.peredocm.com/iouns-eye/

## Environment Variables
None required — this is a fully static site with no server-side dependencies.

## Manual Setup (One-Time)
1. Create GitHub repo: `gh repo create PaleoDM/iouns-eye --public`
2. In repo Settings → Pages → Source: select "GitHub Actions"
3. Push to main — the workflow in `.github/workflows/deploy.yml` handles the rest

## Regenerate Grimoire Index
```bash
npm run index
# Regenerates INDEX.md from all content collections
# Run this after manually adding/modifying entries outside of Claude Code skills
```
