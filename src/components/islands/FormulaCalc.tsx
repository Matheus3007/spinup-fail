import { useMemo, useState } from 'react';
import {
  CartesianGrid, Label, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  IslandPanel, Controls, ControlGroup, Slider, Readout, ReadoutRow, SERIES, fmtNum, fmtTick,
} from './_primitives';

/**
 * Formula-driven calculator: sliders in, computed readouts out, optional chart
 * sweeping one input. Expressions are plain JS (written by the post author, not
 * by readers) and may use any input id, any earlier output id, Math functions
 * (sqrt, sin, PI, …) and `^` for powers.
 *
 * When `chart` is set, the swept input becomes the operating point: its slider
 * drives the ReferenceLine cursor and the readout, and a ratio row is added
 * when exactly two outputs are charted.
 */

type Lang = 'en' | 'pt';
const STR = {
  en: { inputs: 'inputs', ratio: 'ratio', error: 'formula error' },
  pt: { inputs: 'entradas', ratio: 'razão', error: 'erro na fórmula' },
} as const;

interface Input { id: string; label: string; min: number; max: number; step?: number; value: number; unit?: string; group?: string }
interface Output { id: string; label: string; expr: string; unit?: string; digits?: number; hidden?: boolean }
interface ChartSpec { x: string; y: string[]; xLabel?: string; yLabel?: string; points?: number; ratioLabel?: string }

interface Props {
  lang?: Lang;
  title?: string;
  inputs: Input[];
  outputs: Output[];
  chart?: ChartSpec;
  height?: number;
}

const ANIM = { isAnimationActive: true, animationDuration: 180, animationEasing: 'ease-out' as const };

type Fn = (scope: Record<string, number>) => number;

// Each expression sees Math's names, then the inputs, then earlier outputs;
// later names shadow earlier ones (an output called `E` hides Math.E).
function compile(inputs: Input[], outputs: Output[]): (Fn | null)[] {
  return outputs.map((o, idx) => {
    const names = [...new Set([
      ...Object.getOwnPropertyNames(Math),
      ...inputs.map((i) => i.id),
      ...outputs.slice(0, idx).map((p) => p.id),
    ])];
    try {
      // eslint-disable-next-line no-new-func
      const f = new Function(...names, `"use strict"; return (${o.expr.replace(/\^/g, '**')});`);
      return (scope: Record<string, number>) => f(...names.map((n) => (n in scope ? scope[n] : (Math as any)[n])));
    } catch {
      return null;
    }
  });
}

function evaluate(fns: (Fn | null)[], vals: Record<string, number>, outputs: Output[]): number[] {
  const scope: Record<string, number> = { ...vals };
  return fns.map((fn, i) => {
    let v = NaN;
    try { v = fn ? Number(fn(scope)) : NaN; } catch { v = NaN; }
    scope[outputs[i].id] = v;
    return v;
  });
}

export function FormulaCalc({ lang = 'en', title, inputs, outputs, chart, height = 240 }: Props) {
  const t = STR[lang];
  const [vals, setVals] = useState<Record<string, number>>(
    () => Object.fromEntries(inputs.map((i) => [i.id, i.value])),
  );
  const set = (id: string) => (v: number) => setVals((prev) => ({ ...prev, [id]: v }));

  const fns = useMemo(() => compile(inputs, outputs), [inputs, outputs]);
  const results = useMemo(() => evaluate(fns, vals, outputs), [fns, vals, outputs]);

  const charted = chart ? chart.y.map((id) => outputs.findIndex((o) => o.id === id)).filter((i) => i >= 0) : [];
  const xInput = chart ? inputs.find((i) => i.id === chart.x) : undefined;
  const colorOf = (outIdx: number) => {
    const k = charted.indexOf(outIdx);
    return k >= 0 ? SERIES[k % SERIES.length] : undefined;
  };

  const data = useMemo(() => {
    if (!chart || !xInput) return [];
    const n = chart.points ?? 80;
    const rows = [];
    for (let k = 0; k <= n; k++) {
      const xv = xInput.min + ((xInput.max - xInput.min) * k) / n;
      const r = evaluate(fns, { ...vals, [xInput.id]: xv }, outputs);
      const row: Record<string, number> = { [xInput.id]: xv };
      charted.forEach((oi) => { row[outputs[oi].id] = r[oi]; });
      rows.push(row);
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fns, vals, chart, xInput, inputs, outputs]);

  // Group sliders: the swept input gets its own "operating point" group.
  const groups = new Map<string, Input[]>();
  for (const i of inputs) {
    const g = i.group ?? t.inputs;
    groups.set(g, [...(groups.get(g) ?? []), i]);
  }

  const ratio = charted.length === 2 && results[charted[0]] !== 0 ? results[charted[1]] / results[charted[0]] : NaN;

  return (
    <IslandPanel title={title}>
      <Controls>
        {[...groups.entries()].map(([g, list]) => (
          <ControlGroup key={g} legend={g}>
            {list.map((i) => (
              <Slider key={i.id} label={i.label} value={vals[i.id]} min={i.min} max={i.max}
                step={i.step ?? 1} unit={i.unit} onChange={set(i.id)} />
            ))}
          </ControlGroup>
        ))}
      </Controls>

      {chart && xInput && (
        <div className="island-chart">
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 28, right: 16, bottom: 36, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xInput.id} type="number" domain={[xInput.min, xInput.max]} tickMargin={6}
                allowDataOverflow tickFormatter={(v) => fmtTick(Number(v))}>
                <Label value={chart.xLabel ?? `${xInput.label}${xInput.unit ? ` (${xInput.unit})` : ''}`}
                  position="insideBottom" offset={-16} />
              </XAxis>
              <YAxis tickMargin={6} tickFormatter={(v) => fmtTick(Number(v))}>
                {chart.yLabel && <Label value={chart.yLabel} angle={-90} position="insideLeft" offset={12} />}
              </YAxis>
              <Tooltip
                formatter={(v: number, name: string) => [fmtNum(Number(v), 4), name]}
                labelFormatter={(v) => `${xInput.label} ${fmtNum(Number(v), 4)}${xInput.unit ? ` ${xInput.unit}` : ''}`}
              />
              <ReferenceLine x={vals[xInput.id]} stroke="var(--accent)" strokeDasharray="3 3" />
              {charted.map((oi, k) => (
                <Line key={outputs[oi].id} type="monotone" dataKey={outputs[oi].id} name={outputs[oi].label}
                  stroke={SERIES[k % SERIES.length]} strokeWidth={2} dot={false} {...ANIM} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <Readout>
        {outputs.map((o, oi) => !o.hidden && (
          <ReadoutRow key={o.id} label={o.label} swatch={colorOf(oi)}
            value={fns[oi] ? `${fmtNum(results[oi], o.digits ?? 3)}${o.unit ? ` ${o.unit}` : ''}` : t.error} />
        ))}
        {charted.length === 2 && (
          <ReadoutRow label={chart?.ratioLabel ?? t.ratio} value={Number.isFinite(ratio) ? `${ratio.toFixed(2)}×` : '—'} />
        )}
      </Readout>
    </IslandPanel>
  );
}

export default FormulaCalc;
