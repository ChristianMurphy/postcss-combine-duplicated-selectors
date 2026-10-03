/**
 * @import {Options} from '../src/index.js'
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import postcss from 'postcss';
import plugin from '../src/index.js';

/**
 * These tests check that run time grows in proportion to the input. Each case
 * runs at a size and at four times that size. Linear work takes about four
 * times as long, while squared work would take about sixteen times as long.
 * The runs alternate between sizes, so a busy machine slows both alike.
 */

const size = 8000;
const scale = 4;
const maximumRatio = 12;

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
  // The first round compiles the code paths these inputs take
  for (let round = 0; round < 4; round++) {
    for (const [index, css] of inputs.entries()) {
      const start = performance.now();
      processor.process(css, { from: undefined }).toString();
      const time = performance.now() - start;
      if (round > 0) fastest[index] = Math.min(fastest[index] ?? time, time);
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

// Each case lists the options whose code paths differ for its input
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
    label: 'a selector list repeating one selector',
    // Removing one selector is cheap, so squared growth shows only in a
    // longer list
    build: (size) => `${repeat(size * 2, (index) => (index ? ',.a' : '.a'))}{}`,
    modes: [{}],
  },
];

describe('Scaling', () => {
  for (const { label, build, modes } of cases) {
    for (const options of modes) {
      it(`${label} with ${JSON.stringify(options)}`, () => {
        const ratio = getRunTimeRatio(build, options);
        assert.ok(
          ratio < maximumRatio,
          `${scale} times the input took ${ratio.toFixed(1)} times as long`,
        );
      });
    }
  }
});
