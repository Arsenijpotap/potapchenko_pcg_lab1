'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  CMYK, HSV, LAB, GamutStrategy, Illuminant, SeparationAlgorithm,
  labToRgbWithGamut, rgbToCmyk, rgbToHex, hexToRgb, hsvToRgb,
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

const CMYK_GRADIENTS = {
  c: 'linear-gradient(to right, #ffffff, #00ffff)',
  m: 'linear-gradient(to right, #ffffff, #ff00ff)',
  y: 'linear-gradient(to right, #ffffff, #ffff00)',
  k: 'linear-gradient(to right, #ffffff, #000000)',
} as const;

function toCssHex(rgb: { r: number; g: number; b: number }) {
  const clamp255 = (v: number) => Math.max(0, Math.min(255, v));
  return '#' + [rgb.r, rgb.g, rgb.b]
    .map(v => Math.round(clamp255(v)).toString(16).padStart(2, '0'))
    .join('');
}

function makeGradient(
  min: number,
  max: number,
  colorAt: (value: number) => string,
  stops = 25,
) {
  const colors = Array.from({ length: stops }, (_, i) => {
    const value = min + (max - min) * i / (stops - 1);
    return colorAt(value);
  });
  return `linear-gradient(to right, ${colors.map((color, i) => `${color} ${(i / (stops - 1)) * 100}%`).join(', ')})`;
}



export function useColorController() {
  const [illuminant, setIlluminant] = useState<Illuminant>('D65');
  const [strategy, setStrategy] = useState<GamutStrategy>('clipping');
  const [separation, setSeparation] = useState<SeparationAlgorithm>('GCR');
  const [state, setState] = useState<ColorState>(() =>
    stateFromHsv({ h: 0, s: 100, v: 100 }, 'D65', 'GCR'),
  );

  const changeCmyk = useCallback((key: keyof CMYK, value: number) => {
    setState(current => stateFromCmyk({ ...current.cmyk, [key]: value }, illuminant, separation, current.hsv));
  }, [illuminant, separation]);

  const changeLab = useCallback((key: keyof LAB, value: number) => {
    setState(current => stateFromLab({ ...current.lab, [key]: value }, illuminant, strategy, separation, current.hsv));
  }, [illuminant, strategy, separation]);

  const changeHsv = useCallback((key: keyof HSV, value: number) => {
    setState(current => stateFromHsv({ ...current.hsv, [key]: value }, illuminant, separation));
  }, [illuminant, separation]);

  const changeIlluminant = useCallback((value: Illuminant) => {
    setIlluminant(value);
    setState(current => stateForIlluminant(current, value, separation));
  }, [separation]);

  const changeSeparation = useCallback((value: SeparationAlgorithm) => {
    setSeparation(value);
    setState(current => stateForSeparation(current, value));
  }, []);

  const changeStrategy = useCallback((value: GamutStrategy) => {
    setStrategy(value);
    setState(current => stateFromLab(current.lab, illuminant, value, separation, current.hsv));
  }, [illuminant, separation]);

  const changeHex = useCallback((hexValue: string) => {
    const rgb = hexToRgb(hexValue);
    setState(current => stateFromCmyk(rgbToCmyk(rgb, separation), illuminant, separation, current.hsv));
  }, [illuminant, separation]);

  const hex = rgbToHex(state.rgb);
  const gamut = labToRgbWithGamut(state.lab, illuminant, strategy);



  const labLGradient = useMemo(() => makeGradient(
    0,
    100,
    value => toCssHex(labToRgbWithGamut(
      { l: value, a: state.lab.a, b: state.lab.b },
      illuminant,
      strategy,
    ).rgb),
  ), [state.lab.a, state.lab.b, illuminant, strategy]);

  const labAGradient = useMemo(() => makeGradient(
    -128,
    127,
    value => toCssHex(labToRgbWithGamut(
      { l: state.lab.l, a: value, b: state.lab.b },
      illuminant,
      strategy,
    ).rgb),
  ), [state.lab.l, state.lab.b, illuminant, strategy]);

  const labBGradient = useMemo(() => makeGradient(
    -128,
    127,
    value => toCssHex(labToRgbWithGamut(
      { l: state.lab.l, a: state.lab.a, b: value },
      illuminant,
      strategy,
    ).rgb),
  ), [state.lab.l, state.lab.a, illuminant, strategy]);

  const hsvHGradient = useMemo(() => makeGradient(
    0,
    360,
    value => toCssHex(hsvToRgb({ h: value, s: state.hsv.s, v: state.hsv.v })),
  ), [state.hsv.s, state.hsv.v]);

  const hsvSGradient = useMemo(() => makeGradient(
    0,
    100,
    value => toCssHex(hsvToRgb({ h: state.hsv.h, s: value, v: state.hsv.v })),
  ), [state.hsv.h, state.hsv.v]);

  const hsvVGradient = useMemo(() => makeGradient(
    0,
    100,
    value => toCssHex(hsvToRgb({ h: state.hsv.h, s: state.hsv.s, v: value })),
  ), [state.hsv.h, state.hsv.s]);

  const gradients = useMemo(() => ({
    cmyk: (key: keyof CMYK) => CMYK_GRADIENTS[key],
    lab: (key: keyof LAB) => ({ l: labLGradient, a: labAGradient, b: labBGradient }[key]),
    hsv: (key: keyof HSV) => ({ h: hsvHGradient, s: hsvSGradient, v: hsvVGradient }[key]),
  }), [labLGradient, labAGradient, labBGradient, hsvHGradient, hsvSGradient, hsvVGradient]);


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
