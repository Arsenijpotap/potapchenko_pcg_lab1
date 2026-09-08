import {
  CMYK, HSV, Illuminant, LAB, RGB, GamutStrategy, SeparationAlgorithm,
  cmykToHsv, cmykToLab, cmykToRgb, hsvToCmyk, hsvToLab, hsvToRgb,
  labToCmyk, labToHsv, labToRgbWithGamut, rgbToCmyk, rgbToHsv, rgbToLab,
} from '../model/color';

export type ColorState = { rgb: RGB; cmyk: CMYK; lab: LAB; hsv: HSV };

function keepHueAtBlack(rgb: RGB, calculated: HSV, previous?: HSV): HSV {
  const isBlack = Math.max(Math.abs(rgb.r), Math.abs(rgb.g), Math.abs(rgb.b)) < 1e-9;
  if (isBlack && previous) return { ...calculated, h: previous.h };
  return calculated;
}

export function stateFromRgb(rgb: RGB, illuminant: Illuminant, separation: SeparationAlgorithm, previousHsv?: HSV): ColorState {
  return {
    rgb,
    cmyk: rgbToCmyk(rgb, separation),
    lab: rgbToLab(rgb, illuminant),
    hsv: keepHueAtBlack(rgb, rgbToHsv(rgb), previousHsv),
  };
}

export function stateFromCmyk(cmyk: CMYK, illuminant: Illuminant, separation: SeparationAlgorithm, previousHsv?: HSV): ColorState {
  const rgb = cmykToRgb(cmyk);
  return { rgb, cmyk, lab: cmykToLab(cmyk, illuminant), hsv: keepHueAtBlack(rgb, cmykToHsv(cmyk), previousHsv) };
}

export function stateFromLab(lab: LAB, illuminant: Illuminant, strategy: GamutStrategy, separation: SeparationAlgorithm, previousHsv?: HSV): ColorState {
  const rgb = labToRgbWithGamut(lab, illuminant, strategy).rgb;
  return { rgb, lab, cmyk: labToCmyk(lab, illuminant, strategy, separation), hsv: keepHueAtBlack(rgb, labToHsv(lab, illuminant, strategy), previousHsv) };
}

export function stateFromHsv(hsv: HSV, illuminant: Illuminant, separation: SeparationAlgorithm): ColorState {
  const rgb = hsvToRgb(hsv);
  return { rgb, hsv, cmyk: hsvToCmyk(hsv, separation), lab: hsvToLab(hsv, illuminant) };
}

export function stateForIlluminant(state: ColorState, illuminant: Illuminant, separation: SeparationAlgorithm): ColorState {
  return stateFromRgb(state.rgb, illuminant, separation, state.hsv);
}

export function stateForSeparation(state: ColorState, separation: SeparationAlgorithm): ColorState {
  return { ...state, cmyk: rgbToCmyk(state.rgb, separation) };
}
