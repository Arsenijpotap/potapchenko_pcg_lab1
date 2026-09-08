import { readFileSync } from 'fs';
import { join } from 'path';
import assert from 'node:assert/strict';

const file = readFileSync(join(process.cwd(), 'src/controller/use-color-controller.ts'), 'utf8');
const controllerFile = readFileSync(join(process.cwd(), 'src/controller/color-controller.ts'), 'utf8');
assert.ok(file.includes('const gradients = useMemo'));
assert.ok(file.includes('    gradients,'));

assert.ok(controllerFile.includes('function keepHueAtBlack'));
assert.ok(controllerFile.includes('return { ...calculated, h: previous.h }'));
assert.ok(controllerFile.includes('previousHsv?: HSV'));
assert.ok(file.includes('current.hsv'));

console.log('Controller gradient tests passed.');
