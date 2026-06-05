import { useEffect, useState, type ReactNode } from 'react';

/**
 * Shared building blocks for interactive islands.
 *
 * Rules of thumb when wiring a new island:
 *   - Use <Slider> for any numeric input the user can reasonably bound.
 *   - Use <NumberInput> only when min/max can't be sensibly chosen, or when
 *     the value is a precise quantity the user types.
 *   - Wrap the whole thing in <IslandPanel>; put control groups inside
 *     <ControlGroup> with a colored swatch when the group corresponds to
 *     a series in a chart.
 *   - For charts, wrap <ResponsiveContainer> in <div className="island-chart">
 *     so global.css picks up the styling.
 *   - Use <Readout> + <ReadoutRow> for "the answer" — the values that the
 *     reader is here to compare. Put it below the chart.
 *   - Use <Button> for actions like "reset zoom".
 */

export function IslandPanel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="island-panel">
      {title && <div className="island-panel__title">{title}</div>}
      {children}
    </div>
  );
}

export function ControlGroup({ legend, swatch, children }: { legend: string; swatch?: string; children: ReactNode }) {
  return (
    <div className="island-control" style={swatch ? { borderLeftColor: swatch } : undefined}>
      <div className="island-control__legend">
        {swatch && <span className="island-control__swatch" style={{ background: swatch }} />}
        {legend}
      </div>
      {children}
    </div>
  );
}

export function Controls({ children }: { children: ReactNode }) {
  return <div className="island-controls">{children}</div>;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (next: number) => void;
}

/**
 * The value readout is a typeable number input, so users can drag for
 * exploration or type for precision. The input keeps a local string draft
 * while focused (so the user can clear the box and type a new number)
 * and only commits clamped values on blur / Enter / valid in-range edits.
 */
export function Slider({ label, value, min, max, step = 1, unit, onChange }: SliderProps) {
  const [draft, setDraft] = useState(String(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  const handleSlider = (raw: string) => {
    const n = Number(raw);
    if (Number.isFinite(n)) onChange(n);
  };

  const handleType = (raw: string) => {
    setDraft(raw);
    if (raw === '' || raw === '-') return;
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    if (n >= min && n <= max) onChange(n);
  };

  const commit = () => {
    setEditing(false);
    const n = Number(draft);
    if (draft === '' || !Number.isFinite(n)) {
      setDraft(String(value));
      return;
    }
    const clamped = Math.min(max, Math.max(min, n));
    onChange(clamped);
    setDraft(String(clamped));
  };

  return (
    <div className="island-field">
      <label className="island-field__label">{label}</label>
      <input
        type="range"
        className="island-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => handleSlider(e.target.value)}
      />
      <span className="island-field__value">
        <input
          type="number"
          className="island-number"
          min={min}
          max={max}
          step={step}
          value={draft}
          onFocus={() => setEditing(true)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          onChange={(e) => handleType(e.target.value)}
        />
        {unit && <span className="island-field__unit">{unit}</span>}
      </span>
    </div>
  );
}

interface NumberInputProps {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  onChange: (next: number) => void;
}

export function NumberInput({ label, value, step = 1, min, max, unit, onChange }: NumberInputProps) {
  return (
    <div className="island-field">
      <label className="island-field__label">{label}</label>
      <span />
      <span className="island-field__value">
        <input
          type="number"
          className="island-number"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {unit && <span className="island-field__unit">{unit}</span>}
      </span>
    </div>
  );
}

export function Button({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="island-button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Readout({ children }: { children: ReactNode }) {
  return <div className="island-readout">{children}</div>;
}

interface ReadoutRowProps {
  label: string;
  value: string;
  swatch?: string;
}

export function ReadoutRow({ label, value, swatch }: ReadoutRowProps) {
  return (
    <div className="island-readout__row">
      <span className="island-readout__label">
        {swatch && <span className="island-readout__swatch" style={{ background: swatch }} />}
        {label}
      </span>
      <span className="island-readout__value">{value}</span>
    </div>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return <div className="island-hint">{children}</div>;
}
