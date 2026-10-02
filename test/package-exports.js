import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import postcss from 'postcss';
import plugin from '../src/index.js';
// Importing by package name resolves through the "exports" map in package.json
import pluginByName from 'postcss-combine-duplicated-selectors';

const require = createRequire(import.meta.url);

describe('package exports', () => {
  it('resolves the plugin by package name', () => {
    assert.equal(pluginByName, plugin);
  });

  it('exposes the plugin as default to CommonJS require', () => {
    const { css } = postcss([
      require('postcss-combine-duplicated-selectors').default,
    ]).process('.a{color:red}.a{margin:0}', { from: undefined });
    assert.equal(css, '.a{color:red;margin:0}');
  });
});
