# spinup.fail — agent steering

Personal blog. Maker projects, robots, drones, things that broke.
Read this file at the start of any session before editing the project.

## Project structure

- **Astro 6** with new content layer (`src/content.config.ts`).
- **MDX** for posts and updates.
- **React** for interactive "islands" (`client:visible`); **Recharts** for charts.
- **Static** output → **GitHub Pages** at the apex domain `spinup.fail`.

```
src/
  content/
    posts/      # long-form (.mdx)   — type: post
    updates/    # dev journal (.mdx) — type: update
  content.config.ts                  # collection schemas
  components/
    islands/                         # React islands; see REGISTRY.md
      _primitives.tsx                # IslandPanel, Slider, ControlGroup, …
      REGISTRY.md                    # design system contract (read it)
  layouts/                           # Base / Post / Update
  pages/                             # routes
  styles/global.css                  # design tokens + island CSS
.claude/
  skills/obsidian-import/
    SKILL.md                         # vault → MDX transformer
    config.json                      # vault path (gitignored)
docs/themes/                         # checkpointed palettes (restorable)
```

## Two sections, frontmatter-classified

Frontmatter is the source of truth. Never guess `type` — refuse and tell the
user to add it.

- `type: post`   — requires `title`, `summary`, `publishedAt` (+ optional `updatedAt`, `project`, `tags`, `hero`, `draft`)
- `type: update` — requires `project`, `date` (+ optional `title`, `mood`, `tags`, `draft`)

Schemas in `src/content.config.ts`. Validation runs on `npm run build`.

## Island design system (hard rules)

The full design contract lives in `src/components/islands/REGISTRY.md` —
*read that file* before generating, modifying, or styling any island.
Highlights that are easy to forget:

1. **Build on `_primitives.tsx`** (`IslandPanel`, `Controls`, `ControlGroup`,
   `Slider`, `NumberInput`, `Button`, `Readout`, `ReadoutRow`, `Hint`,
   `Callout`). Do not author bespoke panel CSS.
2. **Sliders by default**, `<NumberInput>` only when bounds can't be set.
3. **No inline `font-family`** — text inherits from the site (`var(--font-mono)`).
4. **No bespoke colors.** Pull from CSS variables and the documented chart
   series palette in REGISTRY.md.
5. **Charts must animate smoothly.** All Recharts series:
   `isAnimationActive`, `animationDuration={180}`, `animationEasing="ease-out"`.
   Non-Recharts interactive surfaces: `transition: <prop> 180ms ease-out`.
   Lines flow, not jump. This is a hard rule.
6. **No `<Legend>`** — colored `<ControlGroup>` swatches are the legend.
7. Wrap `<ResponsiveContainer>` in `<div className="island-chart">`.
8. Use `tickMargin={6}`; X-label `offset: -16`, Y-label `offset: 12`; chart
   `top: 28` margin so top reference-line labels don't clip.
9. **For comparing values:** add an operating-point slider per series → drives
   a `<ReferenceLine>` cursor → readout block below the chart with a "ratio"
   row when exactly two series exist.
10. **For wide-range data:** drag-to-zoom (track drag in state, render a
    `<ReferenceArea>`, set `XAxis.domain` on release, Y auto-fits with
    `allowDataOverflow`). Always include a "reset zoom" button + hint.

## Theme & palette

Current concept: **"foundry at first light"** — charcoal kiln walls, taupe
ash, fired-clay terracotta, deep brick. Earthy and warm-mineral.

Tokens in `src/styles/global.css :root`. **Never spot-edit a single token.**
Palette swaps must be holistic — the rule below is non-negotiable.

### Holistic palette rule

When the user asks to change a theme accent, palette, or "the highlight":

1. Re-tone `--bg`, `--bg-panel`, `--code-bg` so the neutral undertone matches
   the new accent's temperature.
2. Re-tone `--rule`, `--rule-strong` to share that undertone.
3. Update **`Callout.tsx`** — backgrounds in the same family as `--bg-panel`,
   borders that don't collide with `--accent`.
4. Update chart series colors in *every* island (these are hardcoded; CSS
   variables alone won't catch them). Series should *not* reuse `--accent`
   or `--accent-2` — those are already on the panel border and cursors.
5. Update the chart-series palette block in `REGISTRY.md` so future
   generated islands inherit the new colors.
6. Run `npm run build` to verify.

State the one-line concept first ("workshop notebook by lamplight," "old
herbarium cabinet"), let every neutral derive from its temperature. Do not
ship a highlight-only swap.

### Theme checkpoints

Restorable palettes live in `docs/themes/`. To restore one, copy the blocks
in the file over the live tokens/components and rebuild. Current saved
checkpoints:
- `docs/themes/machine-shop-at-dusk.md` — cool gunmetal + dusty rust-blue.

When a palette is replaced, save the outgoing one as a checkpoint *before*
applying the new one if the user has expressed any affection for it.

## obsidian-import skill

`.claude/skills/obsidian-import/SKILL.md` is the full pipeline (vault note →
MDX entry, generating React islands on demand from inline ` ```island request `
blocks). Read it before invoking. First-time setup: copy
`config.json.example` → `config.json` and set `vaultPath` (gitignored).

## Working norms

- **Always animate smooth.** See rule 5 above. If you add a chart and it
  isn't animating, that's a bug, not a stylistic choice.
- **Frontmatter-only classification.** Don't infer post vs update from
  content; require `type:` in frontmatter.
- **Don't hardcode colors in islands** beyond the documented chart-series
  palette. Anything that should track the theme goes through CSS variables.
- **Don't write planning/decision files** unless the user asks. Tasks and
  REGISTRY.md cover working state.
- **Verify with a build, not just a read.** `npm run build` runs schema
  validation, MDX rendering, and TypeScript checks. Run it after non-trivial
  changes.
- **GitHub Pages deploy is automatic** via `.github/workflows/deploy.yml`
  on push to `main`. Don't bypass with `gh-pages` branches or manual deploys.

## Commands

```sh
npm run dev      # localhost:4321
npm run build    # static site → dist/  (also validates content)
npm run preview  # serve dist/
```

## What lives where (so things don't drift)

| If you change… | Update… |
|---|---|
| A design token (color, spacing, font) | `src/styles/global.css` only — no inline styles in components |
| Island design rules (registry, slider behavior, animation) | `src/components/islands/REGISTRY.md` AND `.claude/skills/obsidian-import/SKILL.md` (so generated islands inherit) |
| Frontmatter shape | `src/content.config.ts` AND any layout/route reading the new field |
| Vault path / import config | `.claude/skills/obsidian-import/config.json` (gitignored) |
| Theme | All of: tokens, callouts, every island's hardcoded series colors, REGISTRY's chart-series palette block. Save the outgoing palette to `docs/themes/`. |
