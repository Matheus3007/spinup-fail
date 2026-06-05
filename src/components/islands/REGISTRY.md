# Island registry

This file is the contract between the `obsidian-import` skill and the React
components in this folder.

## Design rules for islands (read before generating new ones)

### Layout & primitives
- **Wrap in `<IslandPanel>`** from `_primitives.tsx`. Do not author bespoke
  panel CSS — use the panel + control primitives.
- **Use `<Slider>` for any numeric input** that has reasonable bounds. Pick
  bounds that exceed plausible real-world values by ~25% so the user can
  experiment. The slider's value readout is a typeable number input — users
  can drag for exploration or type for precision. Pick units the user thinks
  in (mm, not m; rpm, not rad/s) so the typed values are readable.
- **Use `<NumberInput>` only when sliders can't express the value** (unbounded
  quantities, identifiers, or values whose plausible range spans many orders
  of magnitude).
- **No inline `font-family`.** All text inherits from the site (`var(--font-mono)`).
- **No bespoke colors.** Pull from CSS variables (`--accent` fired-clay
  terracotta, `--accent-2` deep brick, `--muted`, `--rule`, `--fg`).
- **Palette concept: "foundry at first light."** Charcoal kiln walls,
  dark taupe ash, fired-clay terracotta, deep brick. Earthy and
  warm-mineral. Avoid cool tones (no blues, cyans, pinks) and avoid
  pastels. Everything should feel like it could appear on the surface
  of fired pottery or the wall of a kiln.
- **Chart series colors**, in this order. They stay quiet — the chart is
  the body text of the post, not the headline. Do not introduce saturated
  cools or pure primaries:
  1. `#c9893a` — ember amber (warm, distinct from --accent terracotta)
  2. `#8a9670` — sage-clay (cool counterpoint, still earthen)
  3. `#a08474` — adobe taupe (third tone for 3-series charts)
  4. `#9c7c4a` — kiln gold (warm earth-yellow)
  5. `#7d6b5e` — burnt umber
  Avoid using `--accent` `#B34B0C` or `--accent-2` `#7C3306` themselves as a
  series color: panel border and cursors already carry them.

### Charts (Recharts)
- Wrap `<ResponsiveContainer>` in `<div className="island-chart">` so the
  global Recharts overrides apply.
- **Do NOT add a Recharts `<Legend>`** — the colored-bordered `<ControlGroup>`
  for each series is the legend.
- Use `tickMargin={6}` on axes; give axis labels offsets that clear the ticks
  (X: `offset: -16`, Y: `offset: 12`).
- **All chart updates animate smoothly.** Recharts series should set
  `isAnimationActive`, `animationDuration={180}`, `animationEasing="ease-out"`.
  This applies to every chart on the site — when sliders move, lines should
  *flow*, not jump. 180ms is short enough to feel responsive while still
  removing the visible step. (Earlier guidance was to disable animation for
  snappiness; that's reversed — smoothness wins, and 180ms is the right
  duration to avoid lag.)
- For non-Recharts interactive elements (custom canvas, SVG, CSS-driven
  layouts that respond to slider input), use `transition: <prop> 180ms ease-out;`
  on the moving properties. Same principle: nothing should snap.

### Comparing two or more values (the "answer" pattern)
When the post is comparing things, **the chart is not the answer** — it's the
context. The answer is a side-by-side readout below the chart.
- Add an **operating-point slider** per series (e.g. "rpm", "voltage",
  "duty cycle") that drives a colored `<ReferenceLine>` cursor on the chart.
- Below the chart, render `<Readout>` with one `<ReadoutRow>` per series
  showing its evaluated value at the operating point, plus a "ratio" row when
  exactly two series are present.

### Zooming
For any chart where ranges differ a lot between series (one peaks at 6k RPM,
another at 20k), add **drag-to-zoom**:
- Track a `drag` state from `onMouseDown`/`onMouseMove`/`onMouseUp` on the
  chart, render a `<ReferenceArea>` while dragging.
- On release, set the `XAxis` `domain` to the dragged range and let the Y-axis
  auto-fit to whatever's visible. Use `allowDataOverflow` on both axes.
- Add a `<Button>` labeled "reset zoom" that clears the zoom state.
- Add a `<Hint>` ("Drag across the chart to zoom in.") next to the button.

### Self-contained
No props unless the request explicitly names them — with one exception: `lang`.

### Bilingual labels
Every island MUST accept an optional `lang?: 'en' | 'pt'` prop (default `'en'`)
and externalize all user-visible strings (slider labels, control group legends,
panel title, readout labels, axis labels, tooltip names, series names) into a
`STR` lookup keyed by language. Sibling MDX files pass `lang="pt"` to the
PT version of an island. Variable names (r_dente, r_cp, K_s) stay verbatim
across languages — they're identifiers, not prose.

## Existing components

### HorizontalVsVerticalEnergy
- **File:** `HorizontalVsVerticalEnergy.tsx`
- **When to use:** Post compares the rotational energy of a horizontal vs a vertical bar weapon, parameterized by the horizontal's radius r_h (the one the designer is choosing) and showing the advantage factor f_vd = k · (k²·r_v² + p²) / (r_v² + p²) · (ω_h/ω_v)², where k = r_h/r_v and r_v = r_h/k. Sliders for r_h (operating point), depth p, radius ratio k, and angular velocity ratio d_v. Reference line at f_vd=1 marks break-even; readout shows the implied r_v, the advantage at the operating point, and the asymptotic value as r_h ≫ p.
- **Props:** `{ lang?: 'en' | 'pt' }`
- **Example:** `<HorizontalVsVerticalEnergy client:visible />` (EN), `<HorizontalVsVerticalEnergy client:visible lang="pt" />` (PT)

### WeaponDragRpm
- **File:** `WeaponDragRpm.tsx`
- **When to use:** Post compares the real RPM of an undercutter weapon under aerodynamic drag, on 4S vs 6S, with sliders for the bar geometry (r_dente, r_cp, h, Cd) and a throttle operating point. Operating-point slider drives a reference cursor; readout shows 4S/6S RPM, the 6S/4S ratio, and the system constant Ks.
- **Props:** `{ lang?: 'en' | 'pt' }`
- **Example:** `<WeaponDragRpm client:visible />` (EN), `<WeaponDragRpm client:visible lang="pt" />` (PT)

### Callout
- **File:** `Callout.tsx`
- **When to use:** Any aside the author flagged with an Obsidian `> [!note]` / `[!warning]` / `[!fail]` / `[!win]` callout.
- **Props:** `{ tone?: 'note' | 'warn' | 'fail' | 'win', title?: string, children }`
- **Example:** `<Callout tone="fail" title="bring-up">magic smoke escaped at 6S</Callout>`

### _primitives (not an island — shared building blocks)
- **File:** `_primitives.tsx`
- **Exports:** `IslandPanel`, `Controls`, `ControlGroup`, `Slider`, `NumberInput`.
- **Use:** Internal — never imported into MDX directly. New island components
  must build on top of these.
