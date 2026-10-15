import { useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Label, Line, LineChart, ReferenceArea, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  IslandPanel, Controls, ControlGroup, Slider, Readout, ReadoutRow, Button, Hint, SERIES, fmtNum,
} from './_primitives';

/**
 * Generic chart from inline data. All prose comes in through props, so the PT
 * twin passes PT strings; `lang` only switches the built-in UI words.
 *
 * Line charts with a numeric x get an operating-point slider (cursor + readout,
 * ratio row when there are exactly two series) and drag-to-zoom.
 */

type Lang = 'en' | 'pt';
const STR = {
  en: { cursor: 'operating point', ratio: 'ratio', reset: 'reset zoom', hint: 'Drag across the chart to zoom in.' },
  pt: { cursor: 'ponto de operação', ratio: 'razão', reset: 'resetar zoom', hint: 'Arraste no gráfico para dar zoom.' },
} as const;

type Row = Record<string, number | string>;
interface Series { key: string; label: string; unit?: string }

interface Props {
  lang?: Lang;
  title?: string;
  kind?: 'line' | 'bar';
  /** Key in each data row used for the x axis. */
  x: string;
  xLabel?: string;
  yLabel?: string;
  xUnit?: string;
  series: Series[];
  data: Row[];
  /** Label for the operating-point slider (defaults to xLabel). Set false to hide. */
  cursor?: string | false;
  /** Initial cursor position (defaults to the middle of the x range). */
  cursorAt?: number;
  zoom?: boolean;
  /** Ratio row label when there are exactly two series (e.g. "6S / 4S"). */
  ratioLabel?: string;
  height?: number;
}

const ANIM = { isAnimationActive: true, animationDuration: 180, animationEasing: 'ease-out' as const };

function interp(data: Row[], x: string, key: string, at: number): number {
  const pts = data
    .map((r) => [Number(r[x]), Number(r[key])] as const)
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b))
    .sort((p, q) => p[0] - q[0]);
  if (pts.length === 0) return NaN;
  if (at <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    if (at <= x1) {
      const [x0, y0] = pts[i - 1];
      return x1 === x0 ? y1 : y0 + ((y1 - y0) * (at - x0)) / (x1 - x0);
    }
  }
  return pts[pts.length - 1][1];
}

export function DataChart({
  lang = 'en', title, kind = 'line', x, xLabel, yLabel, xUnit, series, data,
  cursor, cursorAt, zoom = true, ratioLabel, height = 260,
}: Props) {
  const t = STR[lang];
  const numericX = data.every((r) => typeof r[x] === 'number');
  const isLine = kind === 'line';
  const xs = numericX ? data.map((r) => Number(r[x])) : [];
  const xMin = xs.length ? Math.min(...xs) : 0;
  const xMax = xs.length ? Math.max(...xs) : 1;
  const span = xMax - xMin || 1;
  const step = Number((span / 200).toPrecision(1));

  const showCursor = isLine && numericX && cursor !== false;
  const showZoom = isLine && numericX && zoom;

  const [at, setAt] = useState(cursorAt ?? Number((xMin + span / 2).toPrecision(3)));
  const [domain, setDomain] = useState<[number, number] | null>(null);
  const [drag, setDrag] = useState<{ a: number; b: number } | null>(null);

  const values = useMemo(
    () => series.map((s) => interp(data, x, s.key, at)),
    [series, data, x, at],
  );

  const color = (i: number) => SERIES[i % SERIES.length];
  const ratio = values.length === 2 && values[0] !== 0 ? values[1] / values[0] : NaN;

  const onDown = (e: any) => showZoom && e?.activeLabel != null && setDrag({ a: Number(e.activeLabel), b: Number(e.activeLabel) });
  const onMove = (e: any) => drag && e?.activeLabel != null && setDrag({ ...drag, b: Number(e.activeLabel) });
  const onUp = () => {
    if (drag && Math.abs(drag.b - drag.a) > span / 100) {
      setDomain([Math.min(drag.a, drag.b), Math.max(drag.a, drag.b)]);
    }
    setDrag(null);
  };

  const margin = { top: 28, right: 16, bottom: 36, left: 8 };
  const xAxis = (
    <XAxis
      dataKey={x}
      tickMargin={6}
      type={numericX ? 'number' : 'category'}
      domain={domain ?? (numericX ? [xMin, xMax] : undefined)}
      allowDataOverflow
      tickFormatter={numericX ? (v) => fmtNum(Number(v), 3) : undefined}
    >
      {xLabel && <Label value={xLabel} position="insideBottom" offset={-16} />}
    </XAxis>
  );
  const yAxis = (
    <YAxis tickMargin={6} allowDataOverflow domain={['auto', 'auto']} tickFormatter={(v) => fmtNum(Number(v), 3)}>
      {yLabel && <Label value={yLabel} angle={-90} position="insideLeft" offset={12} />}
    </YAxis>
  );
  const tooltip = (
    <Tooltip
      formatter={(v: number, name: string) => [fmtNum(Number(v), 4), name]}
      labelFormatter={(v) => `${xLabel ?? x} ${numericX ? fmtNum(Number(v), 4) : v}${xUnit ? ` ${xUnit}` : ''}`}
    />
  );
  const visible = domain ? data.filter((r) => Number(r[x]) >= domain[0] && Number(r[x]) <= domain[1]) : data;

  return (
    <IslandPanel title={title}>
      {showCursor && (
        <Controls>
          <ControlGroup legend={t.cursor}>
            <Slider
              label={cursor || xLabel || x}
              value={at}
              min={xMin}
              max={xMax}
              step={step || 1}
              unit={xUnit}
              onChange={setAt}
            />
          </ControlGroup>
        </Controls>
      )}

      <div className="island-chart">
        <ResponsiveContainer width="100%" height={height}>
          {isLine ? (
            <LineChart data={visible} margin={margin} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}>
              <CartesianGrid strokeDasharray="3 3" />
              {xAxis}
              {yAxis}
              {tooltip}
              {showCursor && <ReferenceLine x={at} stroke="var(--accent)" strokeDasharray="3 3" />}
              {series.map((s, i) => (
                <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={color(i)}
                  strokeWidth={2} dot={false} {...ANIM} />
              ))}
              {drag && <ReferenceArea x1={drag.a} x2={drag.b} strokeOpacity={0.3} fill="var(--rule-strong)" fillOpacity={0.25} />}
            </LineChart>
          ) : (
            <BarChart data={data} margin={margin}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              {xAxis}
              {yAxis}
              {tooltip}
              {series.map((s, i) => (
                <Bar key={s.key} dataKey={s.key} name={s.label} fill={color(i)} radius={[3, 3, 0, 0]} {...ANIM} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {showZoom && (
        <Controls>
          <Button onClick={() => setDomain(null)} disabled={!domain}>{t.reset}</Button>
          <Hint>{t.hint}</Hint>
        </Controls>
      )}

      {showCursor ? (
        <Readout>
          {series.map((s, i) => (
            <ReadoutRow key={s.key} label={s.label} swatch={color(i)}
              value={`${fmtNum(values[i], 4)}${s.unit ? ` ${s.unit}` : ''}`} />
          ))}
          {series.length === 2 && (
            <ReadoutRow label={ratioLabel ?? `${series[1].label} / ${series[0].label}`}
              value={Number.isFinite(ratio) ? `${ratio.toFixed(2)}×` : '—'} />
          )}
        </Readout>
      ) : series.length > 1 && (
        // Bar charts and cursor-less lines: the colored rows are the legend.
        <Readout>
          {series.map((s, i) => <ReadoutRow key={s.key} label={s.label} swatch={color(i)} value={s.unit ?? ''} />)}
        </Readout>
      )}
    </IslandPanel>
  );
}

export default DataChart;
