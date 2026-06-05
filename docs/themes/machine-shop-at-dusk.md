# Theme: machine shop at dusk (checkpoint)

A saved palette to restore. Concept: bead-blasted aluminum, gunmetal,
weathered steel, denim work clothes, dusty rust-blue patina on marine
fittings. Cool, dark, contemporary, slightly worn.

## Restore

Copy the blocks below over the live files. After applying, run
`npm run build` to verify.

### `src/styles/global.css` — `:root` tokens

```css
:root {
  --bg: #08090b;
  --bg-panel: #111316;
  --fg: #ebedf0;
  --muted: #8c8f96;
  --accent: #6e95aa;     /* dusty rust-blue */
  --accent-2: #8c6f5e;   /* muted rust-brown */
  --rule: #1d2025;
  --rule-strong: #353941;
  --code-bg: #14171b;
  --font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-family: var(--font-mono);
}
```

Slider focus glow:

```css
input[type="range"].island-slider:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 3px rgba(110, 149, 170, 0.3);
}
```

### `src/components/islands/Callout.tsx`

```ts
const colors: Record<Tone, { bg: string; border: string; label: string }> = {
  note: { bg: '#161a1f', border: '#7a818c', label: 'NOTE' },
  warn: { bg: '#1f1a12', border: '#b08540', label: 'WARN' },
  fail: { bg: '#0e1822', border: '#4ea8e0', label: 'FAIL' }, // welding-arc blue
  win:  { bg: '#161e18', border: '#6f9078', label: 'WIN'  },
};
```

### `src/components/islands/BeaterEnergyChart.tsx`

```ts
const initialBars: Bar[] = [
  { label: 'horizontal', lengthIn: 7,   massG: 450, rpm: 6000,  color: '#7a9a8e' }, // verdigris
  { label: 'vertical',   lengthIn: 2.5, massG: 180, rpm: 18000, color: '#8aa5b5' }, // weathered steel-blue
];
```

### `src/components/islands/REGISTRY.md` — palette guidance

```md
- Palette concept: "machine shop at dusk." Bead-blasted aluminum, gunmetal,
  weathered steel doors, denim work clothes, dusty rust-blue patina.
- Chart series stay quiet (verdigris → steel-blue → sage-gray → dust-tan →
  brushed steel). No saturated reds/oranges/bright blues.
- Series: #7a9a8e, #8aa5b5, #9aa098, #a89884, #7a818c
```
