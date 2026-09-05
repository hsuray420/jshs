import assert from 'node:assert/strict';
import test from 'node:test';
import { guardGeneratedEsm } from '../build/vinext-commonjs-guard.ts';

test('generated ESM bypasses CommonJS scanning while actual CommonJS delegates', async () => {
  const calls = [];
  const plugin = guardGeneratedEsm({ name: 'vite-plugin-commonjs', transform(code, id) {
    calls.push({code, id, context: this});
    return {code: 'transformed'};
  }});
  const context = {marker: true};
  assert.equal(await plugin.transform.call(context, 'export default {}', '/data/schools.json?import'), null);
  assert.equal(await plugin.transform.call(context, 'export const SOURCE_FILES = []', '/app/lib/source-code.ts'), null);
  assert.deepEqual(await plugin.transform.call(context, 'module.exports = 1', '/lib/module.js'), {code: 'transformed'});
  assert.equal(calls.length, 1);
  assert.equal(calls[0].context, context);
});

test('unrelated plugins keep their original transform', () => {
  const plugin = {name: 'other', transform() { return 'unchanged'; }};
  assert.equal(guardGeneratedEsm(plugin), plugin);
});
