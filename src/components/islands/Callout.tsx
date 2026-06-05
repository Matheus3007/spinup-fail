import type { ReactNode } from 'react';

type Tone = 'note' | 'warn' | 'fail' | 'win';

const colors: Record<Tone, { bg: string; border: string; label: string }> = {
  // Backgrounds sit just below --bg-panel in the same warm-taupe family.
  // Borders pull from the foundry palette so callouts feel native.
  note: { bg: '#3f3a35', border: '#a09c97', label: 'NOTE' }, // ash-on-stone
  warn: { bg: '#3d352a', border: '#c9893a', label: 'WARN' }, // ember amber
  fail: { bg: '#3d2820', border: '#B34B0C', label: 'FAIL' }, // terracotta — fail is the brand color
  win:  { bg: '#33372d', border: '#8a9670', label: 'WIN'  }, // sage-clay
};

export function Callout({ tone = 'note', title, children }: { tone?: Tone; title?: string; children: ReactNode }) {
  const c = colors[tone];
  return (
    <aside style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderLeftWidth: 4,
      borderRadius: 6,
      padding: '0.85rem 1rem',
      margin: '1.25rem 0',
    }}>
      <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', color: c.border, marginBottom: 4 }}>
        {c.label}{title ? ` · ${title}` : ''}
      </div>
      <div>{children}</div>
    </aside>
  );
}

export default Callout;
