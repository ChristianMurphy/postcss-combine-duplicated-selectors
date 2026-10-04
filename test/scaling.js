/**
 * @import {Options} from '../src/index.js'
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import postcss from 'postcss';
import plugin from '../src/index.js';

/**
 * These tests check that run time grows in proportion to the input.
 */

const size = 8000;
const scale = 4;
const maximumRatio = 12;
const warmUpRounds = 1;
const measuredRounds = 3;

/**
 * @param {number} count - how many strings to build
 * @param {(index: number) => string} build - string for each index
 * @return {string} the strings joined
 */
function repeat(count, build) {
  return Array.from(Array(count).keys(), build).join('');
}

/**
 * @param {(size: number) => string} build - stylesheet of a given size
 * @param {Options} options - plugin options
 * @return {number} the fastest large run divided by the fastest small run
 */
function getRunTimeRatio(build, options) {
  const processor = postcss([plugin(options)]);
  const inputs = [build(size), build(size * scale)];
  const fastest = [Infinity, Infinity];
  for (let round = 0; round < warmUpRounds + measuredRounds; round++) {
    for (const [index, css] of inputs.entries()) {
      const start = performance.now();
      processor.process(css, { from: undefined }).toString();
      const time = performance.now() - start;
      if (round >= warmUpRounds)
        fastest[index] = Math.min(fastest[index] ?? time, time);
    }
  }
  const [small = 0, large = 0] = fastest;
  return large / small;
}

/** @type {Options} */
const properties = { removeDuplicatedProperties: true };
/** @type {Options} */
const values = { removeDuplicatedValues: true };
/** @type {Options} */
const syntax = { removeDuplicatedValues: 'syntax' };

/** @type {Array<{label: string, build: (size: number) => string, modes: Array<Options>}>} */
const cases = [
  {
    label: 'one rule with distinct properties',
    build: (size) => `.a{${repeat(size, (index) => `p${index}:1;`)}}`,
    modes: [properties],
  },
  {
    label: 'one rule repeating a property',
    build: (size) => `.a{${repeat(size, (index) => `color:#${index};`)}}`,
    modes: [properties, values, syntax],
  },
  {
    label: 'rules with the same selector',
    build: (size) => repeat(size, (index) => `.a{p${index}:1}`),
    modes: [{}, properties],
  },
  {
    label: 'rules with the same selector in the same at-rule',
    build: (size) =>
      repeat(size, (index) => `@media (width: 1px){.a{p${index}:1}}`),
    modes: [{}],
  },
  {
    label: 'rules nested in at-rules and rules',
    build: (size) => {
      const depth = size / 8;
      return `${'@media (width: 1px){.a{'.repeat(depth)}x:1${'}}'.repeat(depth)}`;
    },
    modes: [{}],
  },
  {
    label: 'a selector list repeating one selector',
    build: (size) => `${repeat(size * 2, (index) => (index ? ',.a' : '.a'))}{}`,
    modes: [{}],
  },
];

describe('Scaling', () => {
  for (const { label, build, modes } of cases) {
    for (const options of modes) {
      it(`${label} with ${JSON.stringify(options)}`, () => {
        let ratio = getRunTimeRatio(build, options);
        if (ratio >= maximumRatio) ratio = getRunTimeRatio(build, options);
        assert.ok(
          ratio < maximumRatio,
          `${scale} times the input took ${ratio.toFixed(1)} times as long`,
        );
      });
    }
  }
});
