# spinup.fail

Personal blog: maker projects, robots, and the things that broke along the way.

## Stack

- **Astro 6** with the new content layer (`src/content.config.ts`).
- **MDX** for posts and updates.
- **React** for interactive islands (`client:visible` hydration).
- **Recharts** for charts.
- **GitHub Pages** for hosting (custom apex domain `spinup.fail`).

## Sections

- `src/content/posts/*.mdx` — long-form, requires `type: post` plus `title`, `summary`, `publishedAt`.
- `src/content/updates/*.mdx` — dev journal, requires `type: update` plus `project`, `date`.

Schemas: `src/content.config.ts`.

## Interactive islands

React components live under `src/components/islands/`. Use them in MDX with an
explicit hydration directive:

```mdx
import WeaponDragRpm from '../../components/islands/WeaponDragRpm.tsx';

<WeaponDragRpm client:visible />
```

`DataChart` and `FormulaCalc` are generic, props-driven islands (inline data,
formulas) so most posts need no new React code. `REGISTRY.md` in that folder
is the contract the `post` skill follows: design rules plus a "when to use"
entry per component, so islands get reused instead of regenerated.

## Writing (Claude Code skills)

- **`/post <rough notes, links, render paths>`**: Claude writes the EN post
  and its PT twin, picks or builds islands, checks them with a build and
  screenshots, and pushes a draft. Preview: `https://blog.spinup.fail/drafts/<slug>` (PT:
  `/drafts/pt/<translationKey>`), unlisted and noindex. Then `change …` to
  iterate or `ship it` to publish (`scripts/ship.mjs`).
- **`/update <text>`**: publishes the author's text verbatim as a journal
  update (`scripts/new-update.mjs`), plus frontmatter and any media, after one
  confirmation.
- `/obsidian-import`: the older vault-note importer (see its SKILL.md).

Drafts (`draft: true`) are excluded from every list; they only exist under
`/drafts/`. `npm run shoot -- <url> <out.png> [--mobile] [--full]` takes
Playwright screenshots (prints console errors and horizontal overflow).

## Develop

```sh
npm run dev      # localhost:4321
npm run build    # static site → dist/
npm run preview  # serve dist/
```

## Deploy

Push to `main` → `.github/workflows/deploy.yml` builds and deploys to GitHub
Pages. The `public/CNAME` file points the deployment at `spinup.fail`.

DNS records (set at the registrar):

```
A    @   185.199.108.153
A    @   185.199.109.153
A    @   185.199.110.153
A    @   185.199.111.153
CNAME www <username>.github.io
```
