import { useMemo, useState } from 'react';
import {
  CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Label,
} from 'recharts';
import {
  IslandPanel, Controls, ControlGroup, Slider, Readout, ReadoutRow,
} from './_primitives';

const COLOR_FVD = '#c9893a';

type Lang = 'en' | 'pt';
const STR = {
  en: {
    title: 'advantage factor, horizontal vs vertical',
    geometry: 'geometry',
    ratios: 'ratios',
    rh: 'r_h (operating)',
    depth: 'depth',
    rRatio: 'r_h / r_v',
    wRatio: 'ω_h / ω_v',
    rv: 'vertical radius (r_v)',
    advantage: 'advantage factor',
    asymptote: 'asymptote (r_h ≫ p)',
    breakEven: 'break-even',
    tooltip: 'advantage',
    xLabel: 'r_h (mm)',
  },
  pt: {
    title: 'fator de vantagem, horizontal vs vertical',
    geometry: 'geometria',
    ratios: 'razões',
    rh: 'r_h (op)',
    depth: 'profundidade',
    rRatio: 'r_h / r_v',
    wRatio: 'ω_h / ω_v',
    rv: 'raio do vertical (r_v)',
    advantage: 'fator de vantagem',
    asymptote: 'assíntota (r_h ≫ p)',
    breakEven: 'empate',
    tooltip: 'vantagem',
    xLabel: 'r_h (mm)',
  },
} as const;

/**
 * Advantage factor f_vd: how much more rotational energy the horizontal stores
 * compared to the vertical, parameterized by the horizontal's radius r_h.
 * Bar mass cancels (same density, same height, same depth p between bars),
 * so the ratio is geometric only. r_h and p are in millimeters, but the
 * ratio is dimensionless so the units cancel.
 *
 *   r_v = r_h / k
 *   E_h ∝ k · r_v · (k² · r_v² + p²)
 *   E_v ∝     r_v · (    r_v² + p²)
 *   f_vd = (E_h / E_v) · d_v² = k · (k² · r_v² + p²) / (r_v² + p²) · d_v²
 */
function fvd(rhMm: number, pMm: number, k: number, dv: number) {
  if (k === 0) return 0;
  const rvMm = rhMm / k;
  const r2 = rvMm * rvMm;
  const p2 = pMm * pMm;
  const den = r2 + p2;
  if (den === 0) return 0;
  const num = k * (k * k * r2 + p2);
  return (num / den) * dv * dv;
}

export function HorizontalVsVerticalEnergy({ lang = 'en' }: { lang?: Lang }) {
  const t = STR[lang];
  const [rhMm, setRhMm] = useState(90);   // operating point: horizontal's radius
  const [pMm, setPMm] = useState(10);     // bar depth (same on both bars)
  const [k, setK] = useState(3);          // r_h / r_v
  const [dv, setDv] = useState(0.5);      // ω_h / ω_v

  const data = useMemo(() => {
    const points = [];
    for (let r = 30; r <= 450; r += 3) {
      points.push({ rh: r, fvd: fvd(r, pMm, k, dv) });
    }
    return points;
  }, [pMm, k, dv]);

  const op = useMemo(() => {
    const value = fvd(rhMm, pMm, k, dv);
    const asymptote = k * k * k * dv * dv;
    return { value, asymptote, rv: k > 0 ? rhMm / k : 0 };
  }, [rhMm, pMm, k, dv]);

  return (
    <IslandPanel title={t.title}>
      <Controls>
        <ControlGroup legend={t.geometry}>
          <Slider
            label={t.rh}
            value={rhMm}
            min={30}
            max={450}
            step={1}
            unit="mm"
            onChange={setRhMm}
          />
          <Slider
            label={t.depth}
            value={pMm}
            min={2}
            max={40}
            step={1}
            unit="mm"
            onChange={setPMm}
          />
        </ControlGroup>
        <ControlGroup legend={t.ratios}>
          <Slider
            label={t.rRatio}
            value={k}
            min={1}
            max={5}
            step={0.05}
            onChange={setK}
          />
          <Slider
            label={t.wRatio}
            value={dv}
            min={0.1}
            max={1.5}
            step={0.01}
            onChange={setDv}
          />
        </ControlGroup>
      </Controls>

      <div className="island-chart">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 28, right: 16, bottom: 36, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="rh"
              type="number"
              domain={[30, 450]}
              tickMargin={6}
              tickFormatter={(v) => `${v}`}
            >
              <Label value={t.xLabel} position="insideBottom" offset={-16} />
            </XAxis>
            <YAxis tickMargin={6} tickFormatter={(v) => `${v.toFixed(1)}`}>
              <Label value="f_vd" angle={-90} position="insideLeft" offset={12} />
            </YAxis>
            <Tooltip
              formatter={(v: number) => [`${v.toFixed(2)}×`, t.tooltip]}
              labelFormatter={(v) => `r_h = ${v} mm`}
            />
            <ReferenceLine y={1} stroke="var(--rule-strong)" strokeDasharray="4 4">
              <Label value={t.breakEven} position="insideTopRight" fill="var(--muted)" fontSize={10} />
            </ReferenceLine>
            <ReferenceLine x={rhMm} stroke="var(--accent)" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="fvd"
              name="f_vd"
              stroke={COLOR_FVD}
              strokeWidth={2}
              dot={false}
              isAnimationActive
              animationDuration={180}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <Readout>
        <ReadoutRow
          label={t.rv}
          value={`${op.rv.toFixed(1)} mm`}
        />
        <ReadoutRow
          label={t.advantage}
          value={`${op.value.toFixed(2)}×`}
          swatch={COLOR_FVD}
        />
        <ReadoutRow
          label={t.asymptote}
          value={`${op.asymptote.toFixed(2)}×`}
        />
      </Readout>
    </IslandPanel>
  );
}

export default HorizontalVsVerticalEnergy;
