---
name: obsidian-import
description: Transform an Obsidian vault note into an MDX entry under src/content/posts or src/content/updates, generating React island components on demand for inline ```island request blocks and converting Obsidian-isms (wikilinks, callouts, embeds) to MDX equivalents.
---

# obsidian-import

Convert a single Obsidian note into a publishable MDX entry, generating any
React island components it asks for along the way.

## When to invoke

User says any of:

- "Import `<vault-relative-path>`"
- "Pull `<note title>` from the vault"
- "Turn this Obsidian note into a post / update"

Or runs `/obsidian-import <vault-relative-path>`.

## Configuration

Read the import config from `.claude/skills/obsidian-import/config.json` (relative to repo root). The expected shape:

```json
{
  "vaultPath": "/absolute/path/to/Obsidian/MakerVault",
  "postsDir": "src/content/posts",
  "updatesDir": "src/content/updates",
  "islandsDir": "src/components/islands",
  "registryPath": "src/components/islands/REGISTRY.md",
  "publicAssetsDir": "public/imported"
}
```

If the file doesn't exist, ask the user for `vaultPath` once and offer to write
the config.

## Hard rules

- **Frontmatter-only classification.** The note's YAML frontmatter MUST contain
  `type: post` OR `type: update`. If absent, refuse and tell the user to add
  the field — do not guess. (The user explicitly chose strict frontmatter
  classification.)
- **Never overwrite without confirmation.** If the target MDX file already
  exists, show a unified diff and ask before writing.
- **Run `astro check` (or `npm run build` if check is unavailable) after
  writing.** If it fails, surface the failure and offer to revert.
- **Never invent island components.** Only generate a component when the source
  note explicitly requests one via an `island request` fenced block (see below)
  OR the user accepts a suggestion you proposed in suggest-mode.

## Pipeline

For a single note path `<vault-relative>`:

1. **Resolve** — read `<vaultPath>/<vault-relative>` (or accept an absolute
   path). Reject if outside the configured vault.

2. **Parse frontmatter.** Required keys vary by `type`:
   - `type: post` → require `title`, `summary`, `publishedAt`. Optional:
     `updatedAt`, `project`, `tags`, `hero`, `draft`.
   - `type: update` → require `project`, `date`. Optional: `title`, `mood`,
     `tags`, `draft`.

3. **Compute target path:**
   - post → `<postsDir>/<slugify(title)>.mdx`
   - update → `<updatesDir>/<YYYY-MM-DD>-<slugify(project|title)>.mdx`

4. **Run transforms in order** (see Transforms section below).

5. **Write output**, run validation, report what was inserted/skipped/generated.

## Transforms

Each transform is a pure rewrite over the body. Run them in this order:

### 1. Wikilinks
- `[[Other Note]]` → `[Other Note](/posts/other-note)` if `Other Note` resolves
  to an existing post slug, else `/updates/<id>`. If neither, leave the link
  text and emit a `{/* TODO: unresolved link "Other Note" */}` comment beside it.
- `[[Other Note|Display]]` → `[Display](/posts/other-note)`.
- `[[Other#Heading]]` → resolve note, append `#heading` (slugified).

### 2. Embeds
- `![[image.png]]` — copy the image from the vault's attachments folder
  (heuristic: same dir, then `attachments/`, then `_assets/`) into
  `<publicAssetsDir>/<slug>/`. Emit `<img src="/imported/<slug>/image.png" alt="" />`.
- `![[other-note]]` — inline-embed; render as a `> ` blockquote with a link to
  the source post.

### 3. Callouts
- `> [!note] Title\n> body` → `<Callout tone="note" title="Title">body</Callout>`.
- Map `info`/`tip` → `note`, `warning`/`caution` → `warn`,
  `failure`/`danger`/`error` → `fail`, `success`/`done` → `win`.
- Add the import for `Callout` at the top of the MDX file if not already
  present.

### 4. Island requests
The author's contract for "make me an interactive component here":

```
` ` `island request
<free-form description of what the component should do, what inputs it
takes, what data it shows>
` ` `
```

(Real backticks, no spaces — the spaces above are just to escape this fenced
block inside the SKILL.md fence.)

For each request:

1. **Extract** the description.
2. **Look up REGISTRY.md.** If an existing component's "When to use" matches,
   reuse it: replace the block with `<ComponentName client:visible />` and
   skip generation.
3. **Otherwise generate a new component**:
   - Choose a PascalCase name from the description (e.g. "compare beater
     energies" → `BeaterEnergyComparison`). If the name collides with an
     existing component, suffix with `2`, `3`, etc.
   - Write `<islandsDir>/<Name>.tsx`. Defaults:
     - Use Recharts for charts (already installed).
     - Use plain controlled `<input>` elements for parameters; style them to
       match `Callout.tsx`'s palette (`#15171c` bg, `#2a2c33` border,
       `#e6e6e6` fg, accent `#ff5b3a`).
     - Container: `padding: 1rem; border: 1px solid #2a2c33; border-radius: 8;
       background: #0f1014; margin: 1.5rem 0`.
     - Default-export the component.
     - No props unless the description names them. Component should be
       self-contained.
   - Append a `## <Name>` entry to `REGISTRY.md` with file, "When to use"
     (paraphrased from the request), props, and example.
   - Replace the request block in the MDX with
     `<Name client:visible />` and add the import at the top.
4. **Show the generated component to the user before writing**, with a one-
   line summary of what it does. They can accept, edit the description, or skip.

### 5. Suggest-mode (after explicit requests are handled)

Scan the MDX for moments where an interactive element would help but no
`island request` was authored. Heuristics:

- Two or more numeric values being compared in prose ("3" vs 5", "12V vs 18V").
- A code fence with tabular data (CSV-ish, key/value, or a markdown table) that
  has > 4 rows.
- Phrases like "compared", "versus", "as RPM goes up", "at varying", "tradeoff".

For each match, emit a comment in the MDX:

```
{/* island-suggestion: <one-sentence description of the suggested component> */}
```

Do NOT auto-generate from suggestions. The user reviews the MDX, deletes any
they don't want, and re-runs the skill (or the user just edits the suggestion
into a real ` ```island request ` block) to convert.

### 6. Dataview blocks
- ` ```dataview ` blocks — replace with `{/* TODO: dataview block was here, render
  manually or convert to a query island */}`. Do not attempt to evaluate.

### 7. Inline tags
- `#tag` at the start of a line or surrounded by whitespace → strip; if the
  frontmatter has no `tags`, prompt the user to merge them in.

## Validation step

After writing the MDX file and any generated components:

1. Run `npm run build` (Astro v6 has no separate `astro check` step, build
   does the type-checking).
2. If it fails, capture the error, leave the files in place, and tell the
   user. Offer to revert.
3. If it succeeds, print a summary:

```
✓ Imported <vault-rel>
  → <output-path>
  Transforms: wikilinks (3), embeds (2), callouts (1), islands (1 generated, 1 reused)
  Suggestions: 2 (look for `island-suggestion` comments)
  Build: passed
```

## Failure modes

- **Frontmatter missing `type`** — refuse, tell the user which field to add.
- **Required frontmatter missing** — refuse, list missing fields.
- **Image not found in vault** — leave a `{/* TODO: missing image: <name> */}`
  comment, don't fail the whole import.
- **Build fails after import** — leave files in place, surface the error,
  ask whether to revert.

## Slugify rule

Lowercase, ASCII-fold, replace non-`[a-z0-9]+` runs with `-`, trim leading/
trailing `-`. `Beater Bars: How Hard?` → `beater-bars-how-hard`.

## Out of scope (do not do)

- Don't bulk-import the whole vault — only the note path the user gave.
- Don't modify the source vault file.
- Don't push, commit, or open a PR — that's a separate step the user takes.
