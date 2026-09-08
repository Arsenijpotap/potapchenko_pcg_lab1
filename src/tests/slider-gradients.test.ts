import { readFileSync } from 'fs';
import { join } from 'path';
import assert from 'node:assert/strict';

const file = readFileSync(join(process.cwd(), 'src/controller/use-color-controller.ts'), 'utf8');

assert.ok(file.includes("c: 'linear-gradient(to right, #ffffff, #00ffff)'"));
assert.ok(file.includes("m: 'linear-gradient(to right, #ffffff, #ff00ff)'"));
assert.ok(file.includes("y: 'linear-gradient(to right, #ffffff, #ffff00)'"));
assert.ok(file.includes("k: 'linear-gradient(to right, #ffffff, #000000)'"));
assert.ok(!file.includes('state.cmyk, [key]'));

assert.ok(file.includes('{ l: value, a: state.lab.a, b: state.lab.b }'));
assert.ok(file.includes('{ l: state.lab.l, a: value, b: state.lab.b }'));
assert.ok(file.includes('{ l: state.lab.l, a: state.lab.a, b: value }'));
assert.ok(file.includes('labToRgbWithGamut('));

assert.ok(file.includes('{ h: value, s: state.hsv.s, v: state.hsv.v }'));
assert.ok(file.includes('{ h: state.hsv.h, s: value, v: state.hsv.v }'));
assert.ok(file.includes('{ h: state.hsv.h, s: state.hsv.s, v: value }'));
assert.ok(file.includes('hsvToRgb('));

console.log('Slider gradient tests passed.');
