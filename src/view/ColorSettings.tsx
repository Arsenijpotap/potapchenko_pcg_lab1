import type { ChangeEvent } from 'react';
'use client';
import { GamutStrategy, Illuminant, SeparationAlgorithm } from '../model/color';
export function ColorSettings({ illuminant, strategy, separation, onIlluminant, onStrategy, onSeparation }: { illuminant: Illuminant; strategy: GamutStrategy; separation: SeparationAlgorithm; onIlluminant: (v: Illuminant) => void; onStrategy: (v: GamutStrategy) => void; onSeparation: (v: SeparationAlgorithm) => void }) {
 return <section className="settings card">
  <div><label>Стандарт освещения<select value={illuminant} onChange={(e: ChangeEvent<HTMLSelectElement>) => onIlluminant(e.target.value as Illuminant)}><option>D65</option><option>D50</option><option>E</option></select></label><span className="help">Белая точка и матрицы RGB↔XYZ пересчитываются автоматически.</span></div>
  <div><label>Вывод из гамута<select value={strategy} onChange={(e: ChangeEvent<HTMLSelectElement>) => onStrategy(e.target.value as GamutStrategy)}><option value="clipping">Clipping — обрезание</option><option value="scaling">Scaling — масштабирование</option></select></label><span className="help">Стратегия применяется при выходе LAB за RGB-гамут.</span></div>
  <div><label>Цветоделение CMYK<select value={separation} onChange={(e: ChangeEvent<HTMLSelectElement>) => onSeparation(e.target.value as SeparationAlgorithm)}><option value="GCR">GCR — замена серой компоненты</option><option value="UCR">UCR — удаление подложечного цвета</option></select></label><span className="help">Алгоритм используется при расчёте CMYK.</span></div>
 </section>;
}
