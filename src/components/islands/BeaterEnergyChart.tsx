import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';

// Energy of a uniform-rod weapon: E = 0.5 * I * ω²
// I (rod about end) = (1/3) * m * L², where L is half-length from pivot.
// We approximate a beater bar as a uniform rod of given length & mass, spinning about its center.
// I (rod about center) = (1/12) * m * L²
const PIT_DAMAGE_THRESHOLD_J = 50;

interface Bar {
  label: string;
  lengthIn: number;
  massG: number;
  color: string;
}

const defaultBars: Bar[] = [
  { label: '3" beater', lengthIn: 3, massG: 200, color: '#ff8c5a' },
  { label: '5" beater', lengthIn: 5, massG: 200, color: '#5aa9ff' },
];

function energyJ(bar: Bar, rpm: number) {
  const lengthM = (bar.lengthIn * 0.0254);
  const massKg = bar.massG / 1000;
  const I = (1 / 12) * massKg * lengthM * lengthM;
  const omega = (rpm * 2 * Math.PI) / 60;
  return 0.5 * I * omega * omega;
}

export default function BeaterEnergyChart() {
  const [bars, setBars] = useState<Bar[]>(defaultBars);

  const data = useMemo(() => {
    const rows: Record<string, number>[] = [];
    for (let rpm = 0; rpm <= 8000; rpm += 200) {
      const row: Record<string, number> = { rpm };
      for (const b of bars) row[b.label] = +energyJ(b, rpm).toFixed(2);
      rows.push(row);
    }
    return rows;
  }, [bars]);

  const updateBar = (i: number, patch: Partial<Bar>) => {
    setBars((prev) => prev.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  };

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', border: '1px solid #2a2c33', borderRadius: 8, background: '#0f1014' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
        {bars.map((b, i) => (
          <div key={i} style={{ borderLeft: `3px solid ${b.color}`, paddingLeft: '0.5rem' }}>
            <div style={{ fontWeight: 600 }}>{b.label}</div>
            <label style={{ display: 'block', color: '#8b8d92' }}>
              mass (g):{' '}
              <input
                type="number"
                value={b.massG}
                onChange={(e) => updateBar(i, { massG: Number(e.target.value) })}
                style={{ width: 70, background: '#15171c', color: '#e6e6e6', border: '1px solid #2a2c33', borderRadius: 4, padding: '0.15rem 0.3rem' }}
              />
            </label>
            <label style={{ display: 'block', color: '#8b8d92' }}>
              length (in):{' '}
              <input
                type="number"
                step="0.5"
                value={b.lengthIn}
                onChange={(e) => updateBar(i, { lengthIn: Number(e.target.value) })}
                style={{ width: 70, background: '#15171c', color: '#e6e6e6', border: '1px solid #2a2c33', borderRadius: 4, padding: '0.15rem 0.3rem' }}
              />
            </label>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 16, bottom: 30, left: 0 }}>
          <CartesianGrid stroke="#2a2c33" />
          <XAxis dataKey="rpm" stroke="#8b8d92" label={{ value: 'RPM', position: 'insideBottom', offset: -10, fill: '#8b8d92' }} />
          <YAxis stroke="#8b8d92" label={{ value: 'Energy (J)', angle: -90, position: 'insideLeft', fill: '#8b8d92' }} />
          <Tooltip contentStyle={{ background: '#15171c', border: '1px solid #2a2c33' }} />
          <Legend />
          <ReferenceLine y={PIT_DAMAGE_THRESHOLD_J} stroke="#ff5b3a" strokeDasharray="4 4" label={{ value: '~50J pit damage', fill: '#ff5b3a', position: 'insideTopRight' }} />
          {bars.map((b) => (
            <Line key={b.label} type="monotone" dataKey={b.label} stroke={b.color} dot={false} strokeWidth={2} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
