---
name: post
description: Turn the author's rough material (bullets, dictation, links, render paths) into a Claude-written bilingual blog post (EN + PT twin) with interactive islands, pushed as an unlisted draft preview at blog.spinup.fail/drafts/<slug>. Also handles "change X" iterations and "ship it". Use for /post, "write a post about…", "ship it", "ship <slug>".
---

# /post: AI-written posts, previewed as drafts

Posts are **written by Claude** from the author's material. They go out as
drafts first (unlisted preview on the live site), and go live only when the
author says so. The author is usually on a phone: keep replies short, never
stop for approvals mid-flow, and always end with a URL.

Three entry points:

| Author says | You do |
|---|---|
| `/post <material>` | write EN + PT draft, verify, push, reply with preview URLs |
| `change …` / `/post <slug> change …` | edit both languages, verify, push, reply with preview URLs |
| `ship it` / `/post ship <slug>` | `node scripts/ship.mjs <slug>`, build, push, reply with live URLs |

If "ship it" / "change" is ambiguous (several drafts exist and none was touched
in this session), list the drafts (`grep -l "draft: true" src/content/posts/*`)
and ask which one, in one line.

**Site URL.** The blog is served from the GitHub Pages custom domain, which
is currently `blog.spinup.fail` (the apex `spinup.fail` is a registrar
placeholder). If URLs stop resolving, check the real one with
`gh api repos/Matheus3007/spinup-fail/pages -q .cname` and use that.

## Before writing

1. Read `CLAUDE.md` and `src/components/islands/REGISTRY.md` (design rules +
   existing islands). Skim one or two existing posts in `src/content/posts/` for
   the author's voice: first person, casual, technical, short paragraphs, dry
   humor, honest about what broke. Match it; don't sound like marketing.
2. Read every link / path in the material. Local paths are often under
   `/mnt/c/Users/mathe/` (e.g. `eitri/projects/...`, `pcb-lab/build/renders`,
   a repo's `README.md`/`screenshots/`). For URLs, fetch them. Ground every
   claim in the material or those sources. **Don't invent numbers, results or
   anecdotes.** If something essential is missing, write around it and list it
   under "gaps" in your reply instead of asking.

## Write the pair

- Slug: English, `slugify(title)` (lowercase, ASCII-fold, `[^a-z0-9]+` → `-`).
- `translationKey`: the PT slug (convention: `radii.mdx` ↔ `raios.pt.mdx`,
  `translationKey: raios`; PT URL is `/pt/posts/<translationKey>`).
- Files: `src/content/posts/<slug>.mdx` and `src/content/posts/<pt-slug>.pt.mdx`.
- Frontmatter (both files):

```yaml
---
type: post
title: "…"
summary: "…"          # one or two sentences, shown in lists and meta description
publishedAt: <today>  # ship.mjs resets it to the ship date
project: <Project>    # if one applies (ReBot, pcb-lab, …)
tags: ["…"]
lang: en              # or pt
translationKey: <pt-slug>
draft: true
---
```

- PT is a real translation into Brazilian Portuguese in the same voice (not
  literal; keep technical terms people actually use in PT-BR: "throttle",
  "ESC", "PCB" stay). Islands get `lang="pt"`; prose props passed to generic
  islands are translated.
- Math: KaTeX (`$…$`, `$$…$$`) is wired up.
- Callouts: `import Callout from '../../components/islands/Callout.tsx';`
  `<Callout tone="note|warn|fail|win" title="…">…</Callout>`.

### Media

Copy images into `public/media/posts/<slug>/` (kebab-case names), reference as
`/media/posts/<slug>/<file>`. Both language files point to the same files.
Prefer `<figure><img src="…" alt="…" /><figcaption>…</figcaption></figure>`
with a real alt text. Images over ~800 KB: downscale first if `convert`
(ImageMagick) or `npx sharp-cli` is available; otherwise keep as-is and mention it.

### Islands (in this order of preference)

1. **Generic, data-driven islands** (no new React code):
   - `DataChart`: chart from inline data (line or bar), with operating-point
     cursor + readout + ratio and drag-to-zoom built in.
   - `FormulaCalc`: sliders → formulas → readouts, optional chart sweeping one
     input with a cursor.
   See REGISTRY.md for props and examples.
2. **Existing bespoke islands** in REGISTRY.md whose "When to use" fits.
3. **A new island**, only if 1 and 2 can't express it. Follow REGISTRY.md's
   design rules strictly (primitives, sliders, no font-family, palette, 180ms
   ease-out animations, no `<Legend>`, `island-chart` wrapper, tick/label
   offsets, operating-point pattern, zoom pattern, `lang` + `STR` table), then
   add a registry entry.

Add interactivity where it helps the reader *play with the idea*: a number the
reader would want to vary, a comparison, a trade-off. Not every post needs one;
a post about a tool may be better served by screenshots and a link.

## Verify (no approvals: check it yourself)

1. `npm run build` (Node ≥ 22: `source ~/.nvm/nvm.sh && nvm use 22`). Fix errors.
2. `npx astro preview --port 4399 &` then screenshot both drafts, phone and desktop:
   ```sh
   S=<scratchpad>
   node scripts/shoot.mjs http://localhost:4399/drafts/<slug> $S/en-m.png --mobile --full
   node scripts/shoot.mjs http://localhost:4399/drafts/pt/<pt-slug> $S/pt-m.png --mobile --full
   node scripts/shoot.mjs http://localhost:4399/drafts/<slug> $S/en-d.png --full
   ```
   The script prints console errors and flags horizontal overflow. Read the
   PNGs and check against this list; fix and re-shoot until clean:
   - islands rendered (not blank), no console errors, no horizontal overflow
   - chart lines/axes/labels not clipped (top reference labels, axis labels)
   - colors only from the palette / CSS variables; no Recharts legend
   - sliders present for numeric inputs, readout under the chart, ratio row for 2 series
   - images load and fit the column; PT page fully translated (island UI too)
   - "draft preview" banner visible
3. Stop the preview server.
4. After the push (below), shoot the live preview URL once at phone width too.
   `shoot.mjs` uses Firefox for `https://` URLs automatically (Chromium's TLS
   is broken by the WSL lib workaround).

## Publish the draft

Draft pushes to `main` are authorized (drafts are unlisted, noindex, and kept
out of every list):

```sh
git add -A src/content/posts public/media src/components/islands
git commit -m "draft: <slug>"
git push origin main
gh run watch --exit-status $(gh run list -L1 --json databaseId -q '.[0].databaseId')
curl -s -o /dev/null -w '%{http_code}' https://blog.spinup.fail/drafts/<slug>/
```

Reply (short, phone-sized):

```
draft up: https://blog.spinup.fail/drafts/<slug>
pt:       https://blog.spinup.fail/drafts/pt/<pt-slug>
islands: <reused/generated, one line>
gaps: <anything you couldn't verify, or "none">
say "ship it" or "change …"
```

## Ship (only on the author's word)

Only when the author explicitly says to ship (or "publish", "go live"):

```sh
node scripts/ship.mjs <slug>      # flips both languages, publishedAt = today
npm run build
git commit -am "post: <slug>" && git push origin main
gh run watch --exit-status $(gh run list -L1 --json databaseId -q '.[0].databaseId')
```

Reply with `https://blog.spinup.fail/posts/<slug>` and `/pt/posts/<pt-slug>`.
Old `/drafts/<slug>` URLs stop existing after the ship deploy (fine).

## Notes

- No AI mark, badge or "written with Claude" line anywhere on the site: the
  author decided against it. Don't add one, in frontmatter or in the prose.
- Never touch updates (`src/content/updates/`) from this skill: those are the
  author's own words (see the `update` skill).

## Gotcha: deleted entries linger locally

Astro's content cache (`node_modules/.astro/data-store.json`) can keep an
entry after its file is deleted when the collection folder ends up empty. CI
builds from scratch, so the live site is unaffected; locally, after deleting
an entry, `rm node_modules/.astro/data-store.json` before rebuilding.
