export type RGB = { r: number; g: number; b: number };
export type HSV = { h: number; s: number; v: number };
export type LAB = { l: number; a: number; b: number };
export type CMYK = { c: number; m: number; y: number; k: number };
export type Illuminant = 'D65' | 'D50' | 'E';
export type GamutStrategy = 'clipping' | 'scaling';
export type SeparationAlgorithm = 'UCR' | 'GCR';

type XYZ = { x: number; y: number; z: number };
type Matrix3 = [[number, number, number], [number, number, number], [number, number, number]];
type ConversionMatrices = { rgbToXyz: Matrix3; xyzToRgb: Matrix3; whitePoint: XYZ };

const clamp = (x: number, min = 0, max = 1) => Math.min(max, Math.max(min, x));
const EPSILON = 0.008856;
const KAPPA = 7.787;
const EPSILON_CUBE_ROOT = 16 / 116;

// Стандартные белые точки CIE 1931 2° в относительных XYZ-координатах.
// Матрица RGB↔XYZ не хранится как готовая константа: она каждый раз
// вычисляется из примариев sRGB и выбранной белой точки.
const WHITE_POINTS: Record<Illuminant, XYZ> = {
  D65: { x: 0.95047, y: 1, z: 1.08883 },
  D50: { x: 0.96422, y: 1, z: 0.82521 },
  E: { x: 1, y: 1, z: 1 },
};

const SRGB_PRIMARIES = {
  r: { x: 0.64, y: 0.33 },
  g: { x: 0.30, y: 0.60 },
  b: { x: 0.15, y: 0.06 },
};

function invertMatrix(matrix: Matrix3): Matrix3 {
  const [[a, b, c], [d, e, f], [g, h, i]] = matrix;
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(det) < 1e-12) throw new Error('Матрица перехода вырожденная');
  return [
    [(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det],
    [(f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det],
    [(d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det],
  ];
}

function multiplyMatrixVector(matrix: Matrix3, vector: XYZ): XYZ {
  return {
    x: matrix[0][0] * vector.x + matrix[0][1] * vector.y + matrix[0][2] * vector.z,
    y: matrix[1][0] * vector.x + matrix[1][1] * vector.y + matrix[1][2] * vector.z,
    z: matrix[2][0] * vector.x + matrix[2][1] * vector.y + matrix[2][2] * vector.z,
  };
}

export function buildConversionMatrices(illuminant: Illuminant): ConversionMatrices {
  const white = WHITE_POINTS[illuminant];
  const primaries: Matrix3 = [
    [SRGB_PRIMARIES.r.x / SRGB_PRIMARIES.r.y, SRGB_PRIMARIES.g.x / SRGB_PRIMARIES.g.y, SRGB_PRIMARIES.b.x / SRGB_PRIMARIES.b.y],
    [1, 1, 1],
    [
      (1 - SRGB_PRIMARIES.r.x - SRGB_PRIMARIES.r.y) / SRGB_PRIMARIES.r.y,
      (1 - SRGB_PRIMARIES.g.x - SRGB_PRIMARIES.g.y) / SRGB_PRIMARIES.g.y,
      (1 - SRGB_PRIMARIES.b.x - SRGB_PRIMARIES.b.y) / SRGB_PRIMARIES.b.y,
    ],
  ];
  const scale = multiplyMatrixVector(invertMatrix(primaries), white);
  const rgbToXyz: Matrix3 = [
    [primaries[0][0] * scale.x, primaries[0][1] * scale.y, primaries[0][2] * scale.z],
    [primaries[1][0] * scale.x, primaries[1][1] * scale.y, primaries[1][2] * scale.z],
    [primaries[2][0] * scale.x, primaries[2][1] * scale.y, primaries[2][2] * scale.z],
  ];
  return { rgbToXyz, xyzToRgb: invertMatrix(rgbToXyz), whitePoint: white };
}

export function hexToRgb(hex: string): RGB {
  const normalized = hex.replace('#', '');
  const n = parseInt(normalized, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex(x: RGB): string {
  return '#' + [x.r, x.g, x.b].map(v => Math.round(clamp(v / 255) * 255).toString(16).padStart(2, '0')).join('');
}

export function rgbToHsv({ r, g, b }: RGB): HSV {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
    if (h < 0) h += 360;
  }
  return { h, s: max ? d / max * 100 : 0, v: max * 100 };
}

export function hsvToRgb({ h, s, v }: HSV): RGB {
  const S = s / 100, V = v / 100;
  const C = V * S, X = C * (1 - Math.abs((h / 60) % 2 - 1)), m = V - C;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = C; g = X; }
  else if (h < 120) { r = X; g = C; }
  else if (h < 180) { g = C; b = X; }
  else if (h < 240) { g = X; b = C; }
  else if (h < 300) { r = X; b = C; }
  else { r = C; b = X; }
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

function rgbToCmy({ r, g, b }: RGB) {
  return { c: 1 - r / 255, m: 1 - g / 255, y: 1 - b / 255 };
}

export function rgbToCmyk(rgb: RGB, algorithm: SeparationAlgorithm = 'GCR'): CMYK {
  const { c, m, y } = rgbToCmy(rgb);
  const k = Math.min(c, m, y);
  if (k >= 0.999999) return { c: 0, m: 0, y: 0, k: 100 };

  if (algorithm === 'UCR') {
    // UCR удаляет серую составляющую преимущественно в глубоких тенях.
    // До 50% плотности дополнительный чёрный не вводится; от 50% до 100%
    // его доля плавно возрастает. Формула сохраняет исходный RGB при обратном CMYK→RGB.
    const shadowStrength = clamp((k - 0.5) / 0.5);
    const black = k * shadowStrength;
    const denominator = 1 - black;
    return {
      c: (c - black) / denominator * 100,
      m: (m - black) / denominator * 100,
      y: (y - black) / denominator * 100,
      k: black * 100,
    };
  }

  // GCR заменяет серую компоненту во всём диапазоне:
  // K = min(C, M, Y), затем оставшиеся CMY нормируются относительно K.
  const gray = k;
  const denominator = 1 - gray;
  return {
    c: denominator === 0 ? 0 : (c - gray) / denominator * 100,
    m: denominator === 0 ? 0 : (m - gray) / denominator * 100,
    y: denominator === 0 ? 0 : (y - gray) / denominator * 100,
    k: gray * 100,
  };
}

export function cmykToRgb({ c, m, y, k }: CMYK): RGB {
  const K = k / 100;
  return { r: 255 * (1 - c / 100) * (1 - K), g: 255 * (1 - m / 100) * (1 - K), b: 255 * (1 - y / 100) * (1 - K) };
}

function rgbToXyz(rgb: RGB, illuminant: Illuminant): XYZ {
  const linearize = (value: number) => {
    const x = value / 255;
    return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  const linear = { x: linearize(rgb.r), y: linearize(rgb.g), z: linearize(rgb.b) };
  return multiplyMatrixVector(buildConversionMatrices(illuminant).rgbToXyz, linear);
}

function gammaEncode(value: number): number {
  return value <= 0.0031308 ? 12.92 * value : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
}

export function xyzToRgbRaw(xyz: XYZ, illuminant: Illuminant): RGB {
  const linear = multiplyMatrixVector(buildConversionMatrices(illuminant).xyzToRgb, xyz);
  return { r: gammaEncode(linear.x) * 255, g: gammaEncode(linear.y) * 255, b: gammaEncode(linear.z) * 255 };
}

function mapOutOfGamut(raw: RGB, strategy: GamutStrategy): { rgb: RGB; clipped: boolean } {
  const out = raw.r < 0 || raw.r > 255 || raw.g < 0 || raw.g > 255 || raw.b < 0 || raw.b > 255;
  if (!out) return { rgb: raw, clipped: false };
  if (strategy === 'clipping') {
    return { rgb: { r: clamp(raw.r / 255) * 255, g: clamp(raw.g / 255) * 255, b: clamp(raw.b / 255) * 255 }, clipped: true };
  }
  const min = Math.min(raw.r, raw.g, raw.b);
  const max = Math.max(raw.r, raw.g, raw.b);
  if (max === min) return { rgb: { r: clamp(raw.r / 255) * 255, g: clamp(raw.g / 255) * 255, b: clamp(raw.b / 255) * 255 }, clipped: true };
  const scale = (value: number) => (value - min) / (max - min) * 255;
  return { rgb: { r: scale(raw.r), g: scale(raw.g), b: scale(raw.b) }, clipped: true };
}

export function xyzToRgbWithGamut(xyz: XYZ, illuminant: Illuminant, strategy: GamutStrategy): { rgb: RGB; clipped: boolean } {
  return mapOutOfGamut(xyzToRgbRaw(xyz, illuminant), strategy);
}

export function xyzToRgb(xyz: XYZ, illuminant: Illuminant, strategy: GamutStrategy = 'clipping'): RGB {
  return xyzToRgbWithGamut(xyz, illuminant, strategy).rgb;
}

export function rgbToLab(rgb: RGB, illuminant: Illuminant = 'D65'): LAB {
  const q = rgbToXyz(rgb, illuminant);
  const white = buildConversionMatrices(illuminant).whitePoint;
  const f = (t: number) => t > EPSILON ? Math.cbrt(t) : KAPPA * t + EPSILON_CUBE_ROOT;
  const X = f(q.x / white.x), Y = f(q.y / white.y), Z = f(q.z / white.z);
  return { l: 116 * Y - 16, a: 500 * (X - Y), b: 200 * (Y - Z) };
}

export function labToXyz({ l, a, b }: LAB, illuminant: Illuminant = 'D65'): XYZ {
  const fy = (l + 16) / 116, fx = a / 500 + fy, fz = fy - b / 200;
  const finv = (t: number) => {
    const t3 = t * t * t;
    return t3 > EPSILON ? t3 : (t - EPSILON_CUBE_ROOT) / KAPPA;
  };
  const white = buildConversionMatrices(illuminant).whitePoint;
  return { x: white.x * finv(fx), y: white.y * finv(fy), z: white.z * finv(fz) };
}

export function labToRgbWithGamut(lab: LAB, illuminant: Illuminant = 'D65', strategy: GamutStrategy = 'clipping') {
  return xyzToRgbWithGamut(labToXyz(lab, illuminant), illuminant, strategy);
}

export function labToRgb(lab: LAB, illuminant: Illuminant = 'D65', strategy: GamutStrategy = 'clipping'): RGB {
  return labToRgbWithGamut(lab, illuminant, strategy).rgb;
}

export function cmykToLab(x: CMYK, illuminant: Illuminant = 'D65'): LAB { return rgbToLab(cmykToRgb(x), illuminant); }
export function labToCmyk(x: LAB, illuminant: Illuminant = 'D65', strategy: GamutStrategy = 'clipping', algorithm: SeparationAlgorithm = 'GCR'): CMYK { return rgbToCmyk(labToRgb(x, illuminant, strategy), algorithm); }
export function cmykToHsv(x: CMYK): HSV { return rgbToHsv(cmykToRgb(x)); }
export function hsvToCmyk(x: HSV, algorithm: SeparationAlgorithm = 'GCR'): CMYK { return rgbToCmyk(hsvToRgb(x), algorithm); }
export function labToHsv(x: LAB, illuminant: Illuminant = 'D65', strategy: GamutStrategy = 'clipping'): HSV { return rgbToHsv(labToRgb(x, illuminant, strategy)); }
export function hsvToLab(x: HSV, illuminant: Illuminant = 'D65'): LAB { return rgbToLab(hsvToRgb(x), illuminant); }
