'use client';
import type { CSSProperties, ChangeEvent } from 'react';
import { SliderItem } from './slider-types';

export function ColorModelCard<T extends Record<string, number>, K extends keyof T>({
  title, note, items, values, update, gradientFor,
}: { title: string; note: string; items: SliderItem<T>[]; values: T; update: (key: K, value: number) => void; gradientFor: (key: K) => string }) {
  return <section className="card model-card">
    <h2>{title}</h2><p className="model-note">{note}</p>
    {items.map(([key, label, min, max, step]) => (
      <div className="row" key={String(key)}>
        <div className="label"><span>{label}</span><input className="value" type="number" min={min} max={max} step={step} value={Math.round(Number(values[key]) * 10) / 10} onChange={(e: ChangeEvent<HTMLInputElement>) => { const n = Number(e.target.value); if (Number.isFinite(n)) update(key as K, Math.max(min, Math.min(max, n))); }} /></div>
        <input className="slider" style={{ background: gradientFor(key as K) } as CSSProperties} type="range" min={min} max={max} step={step} value={Number(values[key])} onChange={(e: ChangeEvent<HTMLInputElement>) => update(key as K, Number(e.target.value))} />
      </div>
    ))}
  </section>;
}
