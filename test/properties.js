/**
 * @import {Container} from 'postcss'
 * @import {Options} from '../src/index.js'
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import postcss from 'postcss';
import scss from 'postcss-scss';
import plugin from '../src/index.js';
import { getParameters, stylesheet, uniqueStylesheet } from './_arbitraries.js';

/** @type {Array<Options>} from keeping the most declarations to the fewest */
const modes = [
  {},
  { removeDuplicatedValues: true },
  { removeDuplicatedValues: 'syntax' },
  { removeDuplicatedProperties: true },
];

/**
 * @param {string} css - stylesheet
 * @param {Options} options - plugin options
 * @return {string} the plugin's output
 */
function run(css, options) {
  return postcss([plugin(options)]).process(css, { from: undefined }).css;
}

/**
 * Counts each declaration together with the at-rules around it. The key
 * leaves out the rule's selector, because a merge keeps only the first
 * spelling.
 *
 * @param {string} css - stylesheet
 * @return {Map<string, number>} occurrences of each declaration
 */
function countDeclarations(css) {
  /** @type {Map<string, number>} */
  const counts = new Map();
  /**
   * @param {Container} container - node to search
   * @param {Array<string>} atRules - at-rules around container
   */
  const visit = (container, atRules) => {
    for (const node of container.nodes ?? []) {
      if (node.type === 'atrule') {
        visit(node, [...atRules, `@${node.name} ${node.params}`]);
      } else if (node.type === 'rule') {
        visit(node, atRules);
      } else if (node.type === 'decl') {
        const key = JSON.stringify([
          atRules,
          node.prop,
          node.value,
          node.important,
        ]);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  };
  visit(postcss.parse(css), []);
  return counts;
}

/**
 * @param {Map<string, number>} smaller - declaration counts
 * @param {Map<string, number>} larger - declaration counts
 * @return {boolean} whether every declaration in smaller is also in larger
 */
function isSubset(smaller, larger) {
  return [...smaller].every(([key, count]) => (larger.get(key) ?? 0) >= count);
}

describe('Properties', () => {
  it('gives the same output when run on its own output', () => {
    fc.assert(
      fc.property(
        stylesheet,
        fc.constantFrom(...modes),
        fc.boolean(),
        (css, options, isScss) => {
          const processor = postcss([plugin(options)]);
          const syntax = isScss ? { syntax: scss } : {};
          const once = processor.process(css, {
            from: undefined,
            ...syntax,
          }).css;
          const twice = processor.process(once, {
            from: undefined,
            ...syntax,
          }).css;
          assert.equal(twice, once);
        },
      ),
      getParameters(150),
    );
  });

  it('keeps every declaration in its at-rules without removal options', () => {
    fc.assert(
      fc.property(stylesheet, (css) => {
        assert.deepEqual(
          countDeclarations(run(css, {})),
          countDeclarations(css),
        );
      }),
      getParameters(150),
    );
  });

  it('keeps each block of an at-rule outside the merge list', () => {
    fc.assert(
      fc.property(stylesheet, fc.constantFrom(...modes), (css, options) => {
        const countKeyframes = (/** @type {string} */ text) =>
          text.split('@keyframes').length;
        assert.equal(countKeyframes(run(css, options)), countKeyframes(css));
      }),
      getParameters(150),
    );
  });

  it('removes declarations in each mode only where a gentler mode did', () => {
    fc.assert(
      fc.property(stylesheet, (css) => {
        const counts = modes.map((options) =>
          countDeclarations(run(css, options)),
        );
        for (const [index, remaining] of counts.entries()) {
          const gentler = counts[index - 1];
          if (gentler)
            assert.ok(
              isSubset(remaining, gentler),
              JSON.stringify(modes[index]),
            );
        }
      }),
      getParameters(150),
    );
  });

  it('leaves a stylesheet without duplicates unchanged', () => {
    fc.assert(
      fc.property(
        uniqueStylesheet,
        fc.constantFrom(...modes),
        (css, options) => {
          assert.equal(run(css, options), css);
        },
      ),
      getParameters(150),
    );
  });
});
