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
import BeaterEnergyChart from '../../components/islands/BeaterEnergyChart.tsx';

<BeaterEnergyChart client:visible />
```

`REGISTRY.md` in that folder is the contract used by the `obsidian-import`
skill — it maps "when to use" descriptions to existing components so they get
reused instead of regenerated.

## Importing from Obsidian

```sh
claude
> /obsidian-import "Spinup/2026-05-31 arena test"
```

See `.claude/skills/obsidian-import/SKILL.md` for the full pipeline.

First-time setup: copy `config.json.example` to `config.json` and set
`vaultPath`.

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
