'use client';

import { CMYK, HSV, LAB, GamutStrategy, Illuminant } from '../model/color';
import { ColorModelCard } from './ColorModelCard';
type SliderItem<T extends Record<string, number>> = [keyof T, string, number, number, number];

export function ColorWorkspace({
  state, illuminant, strategy, hex, gamutClipped,
  cmykFields, labFields, hsvFields,
  changeCmyk, changeLab, changeHsv, changeHex,
  gradients,
}: {
  state: { cmyk: CMYK; lab: LAB; hsv: HSV };
  illuminant: Illuminant;
  strategy: GamutStrategy;
  hex: string;
  gamutClipped: boolean;
  cmykFields: SliderItem<CMYK>[];
  labFields: SliderItem<LAB>[];
  hsvFields: SliderItem<HSV>[];
  changeCmyk: (key: keyof CMYK, value: number) => void;
  changeLab: (key: keyof LAB, value: number) => void;
  changeHsv: (key: keyof HSV, value: number) => void;
  changeHex: (hex: string) => void;
  gradients: {
    cmyk: (key: keyof CMYK) => string;
    lab: (key: keyof LAB) => string;
    hsv: (key: keyof HSV) => string;
  };
}) {
  return <>
    <div className="head">
      <div className="title">
        <h1>CMYK ↔ LAB ↔ HSV</h1>
        <p>Интерактивное ручное преобразование трёх цветовых моделей</p>
        <div className="color-tools">
          <input className="native-picker" type="color" value={hex} onChange={e => changeHex(e.target.value)} />
          <span className="hex-label">{hex.toUpperCase()}</span>
        </div>
      </div>
      <div className="swatch" style={{ background: hex }} />
    </div>

    <div className="grid">
      <ColorModelCard
        title="CMYK"
        note="Фиксированная шкала каждой CMYK-компоненты."
        items={cmykFields}
        values={state.cmyk}
        update={changeCmyk}
        gradientFor={gradients.cmyk}
      />
      <ColorModelCard
        title="LAB"
        note="Градиент рассчитывается с учётом выбранного освещения и стратегии гамута."
        items={labFields}
        values={state.lab}
        update={changeLab}
        gradientFor={gradients.lab}
      />
      <ColorModelCard
        title="HSV"
        note="Градиент показывает все промежуточные оттенки при текущих двух других компонентах."
        items={hsvFields}
        values={state.hsv}
        update={changeHsv}
        gradientFor={gradients.hsv}
      />
    </div>

    {gamutClipped && (
      <div className="notice" role="status">
        Цвет LAB выходит за RGB-гамут. Применена стратегия «{strategy === 'clipping' ? 'обрезание' : 'масштабирование'}».
      </div>
    )}
  </>;
}
