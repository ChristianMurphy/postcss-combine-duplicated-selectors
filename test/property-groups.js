import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getPropertyGroupsSource } from './_property-groups.js';

describe('Property groups', () => {
  it('match the installed @webref/css; run `npm run generate` to update', () => {
    const committed = readFileSync(
      new URL('../src/property-groups.js', import.meta.url),
      'utf8',
    );
    assert.equal(committed, getPropertyGroupsSource());
  });
});
