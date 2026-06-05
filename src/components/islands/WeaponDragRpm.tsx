import { useMemo, useState } from 'react';
import {
  CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Label,
} from 'recharts';
import {
  IslandPanel, Controls, ControlGroup, Slider, Readout, ReadoutRow,
} from './_primitives';

const COLOR_4S = '#c9893a';
const COLOR_6S = '#8a9670';

type Lang = 'en' | 'pt';
const STR = {
  en: {
    title: 'real arm RPM under drag, 4S vs 6S',
    geometry: 'geometry',
    operating: 'operating point',
    rDente: 'tooth radius',
    rCp: 'counterweight radius',
    h: 'bar height',
    cd: 'Cd',
    throttle: 'throttle',
    rpm4s: '4S real RPM',
    rpm6s: '6S real RPM',
    ratio: '6S / 4S',
    ks: 'K_s',
    label4s: '4S',
    label6s: '6S',
    yLabel: 'real RPM',
    xLabel: 'throttle (%)',
  },
  pt: {
    title: 'RPM real da arma sob arrasto, 4S vs 6S',
    geometry: 'geometria',
    operating: 'ponto de operação',
    rDente: 'raio do dente',
    rCp: 'raio do contrapeso',
    h: 'altura da barra',
    cd: 'Cd',
    throttle: 'throttle',
    rpm4s: 'RPM real 4S',
    rpm6s: 'RPM real 6S',
    ratio: '6S / 4S',
    ks: 'K_s',
    label4s: '4S',
    label6s: '6S',
    yLabel: 'RPM real',
    xLabel: 'throttle (%)',
  },
} as const;

// Hardcoded from the post's iFlight XING 2814 880KV at sagged 4S/6S voltages.
const TAU_STALL_4S = 3.57;          // N·m
const TAU_STALL_6S = 5.35;          // N·m
const OMEGA_NL_4S = 1438;           // rad/s, no-load at full throttle
const OMEGA_NL_6S = 2156;           // rad/s
const RHO = 1.225;                  // kg/m³

const RAD_PER_S_TO_RPM = 60 / (2 * Math.PI);

function dragConst(rDente: number, rCp: number, h: number, Cd: number) {
  return (1 / 8) * RHO * Cd * h * (Math.pow(rDente, 4) + Math.pow(rCp, 4));
}

function realRad(t: number, tauStall: number, omegaNl: number, Ks: number) {
  if (t <= 0 || Ks <= 0) return 0;
  const a = tauStall / omegaNl;
  const disc = a * a + 4 * Ks * t * tauStall;
  return (-a + Math.sqrt(disc)) / (2 * Ks);
}

export function WeaponDragRpm({ lang = 'en' }: { lang?: Lang }) {
  const t = STR[lang];
  // Slider state is in mm — easier to read and to type. Convert to m at the
  // math boundary so the formulas keep their SI form.
  const [rDenteMm, setRDenteMm] = useState(140);
  const [rCpMm, setRCpMm] = useState(40);
  const [hMm, setHMm] = useState(15);
  const [Cd, setCd] = useState(1.2);
  const [throttle, setThrottle] = useState(100); // percent

  const Ks = useMemo(
    () => dragConst(rDenteMm / 1000, rCpMm / 1000, hMm / 1000, Cd),
    [rDenteMm, rCpMm, hMm, Cd],
  );

  const data = useMemo(() => {
    const points = [];
    for (let pct = 0; pct <= 100; pct += 2) {
      const t = pct / 100;
      points.push({
        throttle: pct,
        rpm4s: realRad(t, TAU_STALL_4S, OMEGA_NL_4S, Ks) * RAD_PER_S_TO_RPM,
        rpm6s: realRad(t, TAU_STALL_6S, OMEGA_NL_6S, Ks) * RAD_PER_S_TO_RPM,
      });
    }
    return points;
  }, [Ks]);

  const op = useMemo(() => {
    const t = throttle / 100;
    const r4 = realRad(t, TAU_STALL_4S, OMEGA_NL_4S, Ks) * RAD_PER_S_TO_RPM;
    const r6 = realRad(t, TAU_STALL_6S, OMEGA_NL_6S, Ks) * RAD_PER_S_TO_RPM;
    return { r4, r6, ratio: r4 > 0 ? r6 / r4 : 0 };
  }, [Ks, throttle]);

  return (
    <IslandPanel title={t.title}>
      <Controls>
        <ControlGroup legend={t.geometry}>
          <Slider
            label={t.rDente}
            value={rDenteMm}
            min={50}
            max={200}
            step={1}
            unit="mm"
            onChange={setRDenteMm}
          />
          <Slider
            label={t.rCp}
            value={rCpMm}
            min={10}
            max={120}
            step={1}
            unit="mm"
            onChange={setRCpMm}
          />
          <Slider
            label={t.h}
            value={hMm}
            min={5}
            max={40}
            step={1}
            unit="mm"
            onChange={setHMm}
          />
          <Slider
            label={t.cd}
            value={Cd}
            min={0.5}
            max={2.5}
            step={0.05}
            onChange={setCd}
          />
        </ControlGroup>
        <ControlGroup legend={t.operating}>
          <Slider
            label={t.throttle}
            value={throttle}
            min={0}
            max={100}
            step={1}
            unit="%"
            onChange={setThrottle}
          />
        </ControlGroup>
      </Controls>

      <div className="island-chart">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 28, right: 16, bottom: 36, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="throttle"
              tickMargin={6}
              type="number"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}`}
            >
              <Label value={t.xLabel} position="insideBottom" offset={-16} />
            </XAxis>
            <YAxis
              tickMargin={6}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            >
              <Label value={t.yLabel} angle={-90} position="insideLeft" offset={12} />
            </YAxis>
            <Tooltip
              formatter={(v: number, name: string) => [`${Math.round(v).toLocaleString()} rpm`, name]}
              labelFormatter={(v) => `throttle ${v}%`}
            />
            <ReferenceLine x={throttle} stroke="var(--rule-strong)" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="rpm4s"
              name={t.label4s}
              stroke={COLOR_4S}
              strokeWidth={2}
              dot={false}
              isAnimationActive
              animationDuration={180}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="rpm6s"
              name={t.label6s}
              stroke={COLOR_6S}
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
          label={t.rpm4s}
          value={`${Math.round(op.r4).toLocaleString()} rpm`}
          swatch={COLOR_4S}
        />
        <ReadoutRow
          label={t.rpm6s}
          value={`${Math.round(op.r6).toLocaleString()} rpm`}
          swatch={COLOR_6S}
        />
        <ReadoutRow
          label={t.ratio}
          value={op.ratio > 0 ? `${op.ratio.toFixed(2)}×` : '...'}
        />
        <ReadoutRow
          label={t.ks}
          value={`${Ks.toExponential(3)}`}
        />
      </Readout>
    </IslandPanel>
  );
}

export default WeaponDragRpm;
