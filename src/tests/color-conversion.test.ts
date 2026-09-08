import assert from 'node:assert/strict';
import { buildConversionMatrices, rgbToCmyk, rgbToLab, labToRgb, cmykToRgb, cmykToHsv, hsvToCmyk, labToHsv, hsvToLab, cmykToLab, labToCmyk, rgbToHsv, hsvToRgb } from '../model/color.ts';

const close = (actual: number, expected: number, tolerance: number) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`);
};

const redLab = rgbToLab({ r: 255, g: 0, b: 0 }, 'D65');
close(redLab.l, 53.2407888676, 1e-9);
close(redLab.a, 80.0924942864, 1e-9);
close(redLab.b, 67.2031913974, 1e-9);
assert.deepEqual(rgbToCmyk({ r: 255, g: 0, b: 0 }, 'GCR'), { c: 0, m: 100, y: 100, k: 0 });
const redRgb = cmykToRgb({ c: 0, m: 100, y: 100, k: 0 });
close(redRgb.r, 255, 1e-8); close(redRgb.g, 0, 1e-8); close(redRgb.b, 0, 1e-8);

const d65 = buildConversionMatrices('D65').rgbToXyz;
const d50 = buildConversionMatrices('D50').rgbToXyz;
const e = buildConversionMatrices('E').rgbToXyz;
close(d65[0][0], 0.41245644, 2e-5);
close(d65[0][1], 0.35757608, 2e-5);
close(d65[0][2], 0.18043748, 2e-5);
assert.ok(Math.abs(d65[0][0] - d50[0][0]) > 1e-5);
assert.ok(Math.abs(d50[0][0] - e[0][0]) > 1e-5);

const roundTrip = labToRgb(redLab, 'D65', 'clipping');
close(roundTrip.r, 255, 0.01); close(roundTrip.g, 0, 0.01); close(roundTrip.b, 0, 0.01);


const sampleRgb = { r: 51, g: 102, b: 153 };
const sampleCmyk = rgbToCmyk(sampleRgb, 'GCR');
const expectedK = Math.min(1 - 51 / 255, 1 - 102 / 255, 1 - 153 / 255);
const expectedC = (1 - 51 / 255 - expectedK) / (1 - expectedK) * 100;
const expectedM = (1 - 102 / 255 - expectedK) / (1 - expectedK) * 100;
const expectedY = (1 - 153 / 255 - expectedK) / (1 - expectedK) * 100;
close(sampleCmyk.c, expectedC, 1e-10);
close(sampleCmyk.m, expectedM, 1e-10);
close(sampleCmyk.y, expectedY, 1e-10);
close(sampleCmyk.k, expectedK * 100, 1e-10);

const richRgb = { r: 64, g: 72, b: 80 };
for (const algorithm of ['GCR', 'UCR'] as const) {
  const separated = rgbToCmyk(richRgb, algorithm);
  const restored = cmykToRgb(separated);
  close(restored.r, richRgb.r, 1e-8);
  close(restored.g, richRgb.g, 1e-8);
  close(restored.b, richRgb.b, 1e-8);
}

console.log('All color math micro-tests passed.');


const blackCmyk = { c: 0, m: 0, y: 0, k: 100 };
const blackHsv = cmykToHsv(blackCmyk);
close(blackHsv.h, 0, 1e-8); close(blackHsv.s, 0, 1e-8); close(blackHsv.v, 0, 1e-8);
const blackLab = cmykToLab(blackCmyk, 'D65');
close(blackLab.l, 0, 1e-8);
const blackBack = hsvToCmyk(blackHsv, 'GCR');
close(blackBack.k, 100, 1e-8);

const redCmyk = { c: 0, m: 100, y: 100, k: 0 };
const redHsv = cmykToHsv(redCmyk);
close(redHsv.h, 0, 1e-8); close(redHsv.s, 100, 1e-8); close(redHsv.v, 100, 1e-8);
const redLabFromCmyk = cmykToLab(redCmyk, 'D65');
close(redLabFromCmyk.l, 53.2407888676, 1e-9);
close(redLabFromCmyk.a, 80.0924942864, 1e-9);
close(redLabFromCmyk.b, 67.2031913974, 1e-9);
const redHsvLab = labToHsv(redLabFromCmyk, 'D65', 'clipping');
close(redHsvLab.h, 0, 0.01); close(redHsvLab.s, 100, 0.01); close(redHsvLab.v, 100, 0.01);
const redCmykFromLab = labToCmyk(redLabFromCmyk, 'D65', 'clipping', 'GCR');
close(redCmykFromLab.c, 0, 0.01); close(redCmykFromLab.m, 100, 0.01); close(redCmykFromLab.y, 100, 0.01); close(redCmykFromLab.k, 0, 0.01);
const redLabFromHsv = hsvToLab(redHsv, 'D65');
close(redLabFromHsv.l, 53.2407888676, 1e-9); close(redLabFromHsv.a, 80.0924942864, 1e-9); close(redLabFromHsv.b, 67.2031913974, 1e-9);

assert.deepEqual(rgbToHsv({ r: 255, g: 0, b: 0 }), { h: 0, s: 100, v: 100 });
assert.deepEqual(rgbToHsv({ r: 0, g: 255, b: 0 }), { h: 120, s: 100, v: 100 });
assert.deepEqual(rgbToHsv({ r: 0, g: 0, b: 255 }), { h: 240, s: 100, v: 100 });
const cyan = hsvToRgb({ h: 180, s: 100, v: 100 });
close(cyan.r, 0, 1e-10); close(cyan.g, 255, 1e-10); close(cyan.b, 255, 1e-10);

close(sampleCmyk.c, 66.66666666666667, 1e-10);
close(sampleCmyk.m, 33.33333333333333, 1e-10);
close(sampleCmyk.y, 0, 1e-10);
close(sampleCmyk.k, 40, 1e-10);

for (const illuminant of ['D65', 'D50', 'E'] as const) {
  const matrix = buildConversionMatrices(illuminant).rgbToXyz;
  for (const row of matrix) for (const value of row) assert.ok(Number.isFinite(value));
}
