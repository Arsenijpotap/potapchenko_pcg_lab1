import assert from 'node:assert/strict';
import { buildConversionMatrices, rgbToCmyk, rgbToLab, labToRgb, cmykToRgb, cmykToHsv, hsvToCmyk, labToHsv, hsvToLab, cmykToLab, labToCmyk } from '../model/color.ts';

const close = (actual: number, expected: number, tolerance: number) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`);
};

const redLab = rgbToLab({ r: 255, g: 0, b: 0 }, 'D65');
close(redLab.l, 53.2408, 0.01);
close(redLab.a, 80.0925, 0.01);
close(redLab.b, 67.2032, 0.01);
assert.deepEqual(rgbToCmyk({ r: 255, g: 0, b: 0 }, 'GCR'), { c: 0, m: 100, y: 100, k: 0 });
const redRgb = cmykToRgb({ c: 0, m: 100, y: 100, k: 0 });
close(redRgb.r, 255, 1e-8); close(redRgb.g, 0, 1e-8); close(redRgb.b, 0, 1e-8);

const d65 = buildConversionMatrices('D65').rgbToXyz;
const d50 = buildConversionMatrices('D50').rgbToXyz;
const e = buildConversionMatrices('E').rgbToXyz;
assert.ok(Math.abs(d65[0][0] - d50[0][0]) > 1e-5);
assert.ok(Math.abs(d50[0][0] - e[0][0]) > 1e-5);

const roundTrip = labToRgb(redLab, 'D65', 'clipping');
close(roundTrip.r, 255, 0.01); close(roundTrip.g, 0, 0.01); close(roundTrip.b, 0, 0.01);

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
close(redLabFromCmyk.l, 53.2408, 0.01);
close(redLabFromCmyk.a, 80.0925, 0.01);
close(redLabFromCmyk.b, 67.2032, 0.01);
const redHsvLab = labToHsv(redLabFromCmyk, 'D65', 'clipping');
close(redHsvLab.h, 0, 0.01); close(redHsvLab.s, 100, 0.01); close(redHsvLab.v, 100, 0.01);
const redCmykFromLab = labToCmyk(redLabFromCmyk, 'D65', 'clipping', 'GCR');
close(redCmykFromLab.c, 0, 0.01); close(redCmykFromLab.m, 100, 0.01); close(redCmykFromLab.y, 100, 0.01); close(redCmykFromLab.k, 0, 0.01);
const redLabFromHsv = hsvToLab(redHsv, 'D65');
close(redLabFromHsv.l, 53.2408, 0.01); close(redLabFromHsv.a, 80.0925, 0.01); close(redLabFromHsv.b, 67.2032, 0.01);
