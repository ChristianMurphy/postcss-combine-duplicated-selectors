import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import postcss from 'postcss';
import plugin from '../src/index.js';

/**
 * These tests generate many selectors and check that the plugin treats two of
 * them as the same exactly when a simple reference model says they match the
 * same elements.
 */

const simpleOrders = [
  [],
  ['.b'],
  ['.ba'],
  [':hover'],
  ['.b', '.ba'],
  ['.ba', '.b'],
  ['.b', ':hover'],
  [':hover', '.b'],
  ['.ba', ':hover'],
  [':hover', '.ba'],
];

const compounds = [];
for (const tag of ['', 'a']) {
  for (const simples of simpleOrders) {
    for (const pseudoElement of ['', '::before', '::before:hover']) {
      const text = tag + simples.join('') + pseudoElement;
      if (text === '') continue;
      // Order only matters for the tag and from the pseudo-element on
      const reference = tag + [...simples].sort().join('') + pseudoElement;
      compounds.push({ text, reference });
    }
  }
}

const selectors = [...compounds];
for (const first of compounds) {
  for (const second of compounds) {
    selectors.push({
      text: `${first.text} ${second.text}`,
      reference: `${first.reference} ${second.reference}`,
    });
  }
}

describe('Selector equivalence', () => {
  it('combines rules exactly when their selectors are equivalent', () => {
    const input = selectors
      .map(({ text }, index) => `${text}{i:${index}}`)
      .join('');
    const { root } = postcss([plugin]).process(input, { from: undefined });
    const references = new Map(
      selectors.map(({ reference }, index) => [String(index), reference]),
    );
    const actual = root.nodes
      .filter((node) => node.type === 'rule')
      .map((rule) =>
        rule.nodes
          .filter((node) => node.type === 'decl')
          .map((declaration) => references.get(declaration.value)),
      );
    const groups = Map.groupBy(selectors, ({ reference }) => reference);
    const expected = [...groups.values()].map((group) =>
      group.map(({ reference }) => reference),
    );
    assert.deepEqual(actual, expected);
  });

  it('keeps the first of each group of equivalent selectors in a list', () => {
    const input = `${selectors.map(({ text }) => text).join(', ')} {}`;
    const { root } = postcss([plugin]).process(input, { from: undefined });
    /** @type {Set<string>} */
    const seen = new Set();
    const expected = selectors
      .filter(({ reference }) => !seen.has(reference) && seen.add(reference))
      .map(({ text }) => text);
    const [rule] = root.nodes.filter((node) => node.type === 'rule');
    assert.deepEqual(rule?.selectors, expected);
  });
});
