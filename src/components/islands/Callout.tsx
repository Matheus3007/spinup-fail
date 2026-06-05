import type { ReactNode } from 'react';

type Tone = 'note' | 'warn' | 'fail' | 'win';

const colors: Record<Tone, { bg: string; border: string; label: string }> = {
  note: { bg: '#15171c', border: '#2a4a8a', label: 'NOTE' },
  warn: { bg: '#1c1812', border: '#b48a3a', label: 'WARN' },
  fail: { bg: '#1c1213', border: '#a83a3a', label: 'FAIL' },
  win:  { bg: '#121c14', border: '#3aa86a', label: 'WIN'  },
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
