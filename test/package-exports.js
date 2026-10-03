import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import plugin from '../src/index.js';
// Importing by package name resolves through the "exports" map in package.json
import pluginByName from 'postcss-combine-duplicated-selectors';

const require = createRequire(import.meta.url);

describe('package exports', () => {
  it('resolves the plugin by package name', () => {
    assert.equal(pluginByName, plugin);
  });

  it('exposes the plugin as default to CommonJS require', () => {
    /** @type {unknown} */
    const required = require('postcss-combine-duplicated-selectors');
    assert.ok(
      typeof required === 'object' &&
        required !== null &&
        'default' in required,
    );
    assert.equal(required.default, plugin);
  });
});
