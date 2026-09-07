'use client';

import { useMemo, useState } from 'react';
import {
  CMYK, HSV, LAB, GamutStrategy, Illuminant, SeparationAlgorithm,
  cmykToRgb, hsvToRgb, labToRgbWithGamut, rgbToCmyk, rgbToHex, hexToRgb,
} from '../model/color';
import {
  ColorState,
  stateForIlluminant,
  stateForSeparation,
  stateFromCmyk,
  stateFromHsv,
  stateFromLab,
} from './color-controller';
type SliderItem<T extends Record<string, number>> = [keyof T, string, number, number, number];

const CMYK_FIELDS: SliderItem<CMYK>[] = [
  ['c', 'C', 0, 100, 0.1], ['m', 'M', 0, 100, 0.1],
  ['y', 'Y', 0, 100, 0.1], ['k', 'K', 0, 100, 0.1],
];
const LAB_FIELDS: SliderItem<LAB>[] = [
  ['l', 'L*', 0, 100, 0.1], ['a', 'a*', -128, 127, 0.1], ['b', 'b*', -128, 127, 0.1],
];
const HSV_FIELDS: SliderItem<HSV>[] = [
  ['h', 'H°', 0, 360, 0.1], ['s', 'S%', 0, 100, 0.1], ['v', 'V%', 0, 100, 0.1],
];

const buildGradient = <T extends Record<string, number>>(
  items: SliderItem<T>[],
  values: T,
  key: keyof T,
  toRgb: (value: T) => { r: number; g: number; b: number },
) => {
  const item = items.find(candidate => candidate[0] === key);
  if (!item) return '';
  const min = item[2];
  const max = item[3];
  const stops = Array.from({ length: 17 }, (_, index) => {
    const value = min + (max - min) * index / 16;
    const candidate = { ...values, [key]: value } as T;
    return rgbToHex(toRgb(candidate));
  });
  return `linear-gradient(to right, ${stops.join(', ')})`;
};

export function useColorController() {
  const [illuminant, setIlluminant] = useState<Illuminant>('D65');
  const [strategy, setStrategy] = useState<GamutStrategy>('clipping');
  const [separation, setSeparation] = useState<SeparationAlgorithm>('GCR');
  const [state, setState] = useState<ColorState>(() =>
    stateFromHsv({ h: 0, s: 100, v: 100 }, 'D65', 'GCR'),
  );

  const changeCmyk = (key: keyof CMYK, value: number) => {
    setState(stateFromCmyk({ ...state.cmyk, [key]: value }, illuminant, separation));
  };
  const changeLab = (key: keyof LAB, value: number) => {
    setState(stateFromLab({ ...state.lab, [key]: value }, illuminant, strategy, separation));
  };
  const changeHsv = (key: keyof HSV, value: number) => {
    setState(stateFromHsv({ ...state.hsv, [key]: value }, illuminant, separation));
  };
  const changeIlluminant = (value: Illuminant) => {
    setIlluminant(value);
    setState(stateForIlluminant(state, value, separation));
  };
  const changeSeparation = (value: SeparationAlgorithm) => {
    setSeparation(value);
    setState(stateForSeparation(state, value));
  };
  const changeStrategy = (value: GamutStrategy) => {
    setStrategy(value);
    setState(stateFromLab(state.lab, illuminant, value, separation));
  };
  const changeHex = (hex: string) => {
    const rgb = hexToRgb(hex);
    setState(stateFromCmyk(rgbToCmyk(rgb, separation), illuminant, separation));
  };

  const hex = rgbToHex(state.rgb);
  const gamut = labToRgbWithGamut(state.lab, illuminant, strategy);

  const gradients = useMemo(() => ({
    cmyk: (key: keyof CMYK) => buildGradient(CMYK_FIELDS, state.cmyk, key, cmykToRgb),
    lab: (key: keyof LAB) => buildGradient(LAB_FIELDS, state.lab, key, value =>
      labToRgbWithGamut(value as LAB, illuminant, strategy).rgb,
    ),
    hsv: (key: keyof HSV) => buildGradient(HSV_FIELDS, state.hsv, key, value => hsvToRgb(value as HSV)),
  }), [state.cmyk, state.lab, state.hsv, illuminant, strategy]);

  return {
    state,
    illuminant,
    strategy,
    separation,
    hex,
    gamutClipped: gamut.clipped,
    cmykFields: CMYK_FIELDS,
    labFields: LAB_FIELDS,
    hsvFields: HSV_FIELDS,
    changeCmyk,
    changeLab,
    changeHsv,
    changeIlluminant,
    changeStrategy,
    changeSeparation,
    changeHex,
    gradients,
  };
}
