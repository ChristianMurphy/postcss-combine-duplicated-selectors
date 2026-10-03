/**
 * @import {ElementShape} from './_arbitraries.js'
 */

import { describe, it } from 'node:test';
import fc from 'fast-check';
import postcss from 'postcss';
import { selectAll } from 'css-select';
import plugin from '../src/index.js';
import {
  buildDocument,
  elementShapes,
  getParameters,
  selectOptions,
  selectorPair,
} from './_arbitraries.js';

/**
 * These tests check each merge against css-select. When the plugin treats two
 * selectors as the same, both must match the same elements of random
 * documents.
 */

/**
 * @param {string} first - selector the plugin merged
 * @param {string} second - selector the plugin merged
 * @param {Array<ElementShape>} shapes - document to query
 * @return {boolean} whether both match the same elements
 */
function isSameMatch(first, second, shapes) {
  const document = buildDocument(shapes);
  const firstMatches = selectAll(first, document, selectOptions);
  const secondMatches = selectAll(second, document, selectOptions);
  return (
    firstMatches.length === secondMatches.length &&
    firstMatches.every((match, index) => match === secondMatches[index])
  );
}

describe('Selector soundness', () => {
  it('merges rules only when their selectors match the same elements', () => {
    fc.assert(
      fc.property(selectorPair, elementShapes, ({ first, second }, shapes) => {
        const { root } = postcss([plugin]).process(
          `${first}{i:1}${second}{i:2}`,
          { from: undefined },
        );
        return root.nodes.length === 2 || isSameMatch(first, second, shapes);
      }),
      getParameters(1000),
    );
  });

  it('drops a selector from a list only when it matches the same elements', () => {
    fc.assert(
      fc.property(selectorPair, elementShapes, ({ first, second }, shapes) => {
        const { root } = postcss([plugin]).process(`${first}, ${second}{}`, {
          from: undefined,
        });
        const [rule] = root.nodes.filter((node) => node.type === 'rule');
        return (
          rule?.selectors.length === 2 || isSameMatch(first, second, shapes)
        );
      }),
      getParameters(1000),
    );
  });
});
