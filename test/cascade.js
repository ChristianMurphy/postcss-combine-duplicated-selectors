/**
 * @import {Container, Declaration, Root, Rule} from 'postcss'
 * @import {Node, Selector} from 'postcss-selector-parser'
 * @import {AnyNode as DomNode} from 'domhandler'
 * @import {Options} from '../src/index.js'
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import postcss from 'postcss';
import parser from 'postcss-selector-parser';
import { selectAll } from 'css-select';
import plugin from '../src/index.js';
import {
  buildDocument,
  elementShapes,
  getParameters,
  selectOptions,
  stylesheet,
} from './_arbitraries.js';

/**
 * These tests compute which declaration wins for each element and property,
 * before and after the plugin. The model covers what the generated
 * stylesheets use: specificity, source order, `!important` and cascade layers
 * that do not nest. Every @media query applies.
 *
 * The plugin moves a later rule's declarations up to the first rule with the
 * same selector, ahead of the rules between them. The README warns that this
 * can change the cascade. So the check runs only when no rule in between sets
 * a moved property in the same layer as either rule.
 */

/** @type {Array<Options>} */
const modes = [
  {},
  { removeDuplicatedValues: true },
  { removeDuplicatedValues: 'syntax' },
  { removeDuplicatedProperties: true },
];

/** Pseudo-classes whose specificity is that of their most specific argument */
const listPseudos = new Set([':is', ':not', ':has', ':matches']);

/**
 * @param {Selector} selector - one complex selector
 * @return {number} specificity, with ids, then classes, then types as digits
 */
function getSpecificity(selector) {
  return selector.nodes.reduce(
    (total, node) => total + getNodeSpecificity(node),
    0,
  );
}

/**
 * @param {Node} node - one simple selector or combinator
 * @return {number} what the node adds to its selector's specificity
 */
function getNodeSpecificity(node) {
  switch (node.type) {
    case 'id': {
      return 10_000;
    }
    case 'class':
    case 'attribute': {
      return 100;
    }
    case 'tag': {
      return 1;
    }
    case 'pseudo': {
      const name = node.value.toLowerCase();
      if (name === ':where') return 0;
      if (listPseudos.has(name)) {
        return Math.max(...node.nodes.map((inner) => getSpecificity(inner)));
      }
      return parser.isPseudoElement(node) ? 1 : 100;
    }
    default: {
      return 0;
    }
  }
}

/**
 * A rule that takes part in the cascade
 * @typedef {{rule: Rule, layer: string, layerRank: number}} Entry
 */

/**
 * @param {Root} root - stylesheet
 * @return {Array<Entry>} rules outside @keyframes in source order, with the
 *   layer each belongs to; '' for none, and a number for each block of a
 *   layer without a name. Layers rank by their first block, and rules in no
 *   layer rank above every layer.
 */
function getEntries(root) {
  /** @type {Array<Entry>} */
  const entries = [];
  /** @type {Map<string, number>} */
  const layerRanks = new Map([['', Infinity]]);
  let anonymous = 0;
  /**
   * @param {Container} container - node whose children to visit
   * @param {string} layer - layer of the container
   * @return {undefined}
   */
  const visit = (container, layer) => {
    container.each((node) => {
      if (node.type === 'rule') {
        entries.push({
          rule: node,
          layer,
          layerRank: layerRanks.get(layer) ?? 0,
        });
      } else if (node.type === 'atrule') {
        const name = node.name.toLowerCase();
        if (name === 'layer') {
          const inner = node.params || `#${String(++anonymous)}`;
          if (!layerRanks.has(inner)) layerRanks.set(inner, layerRanks.size);
          visit(node, inner);
        } else if (name !== 'keyframes') {
          visit(node, layer);
        }
      }
    });
  };
  visit(root, '');
  return entries;
}

/**
 * The declaration winning so far, with what it won by
 * @typedef {{rank: Array<number>, value: string}} Winner
 */

/**
 * The winning value of each property for each element
 * @typedef {Map<DomNode, Map<string, string>>} Styles
 */

/**
 * @param {Root} root - stylesheet
 * @param {ReturnType<typeof buildDocument>} document - elements to style
 * @return {Styles} the declaration that wins for each element and property
 */
function getStyles(root, document) {
  /** @type {Map<DomNode, Map<string, Winner>>} */
  const winners = new Map();
  let order = 0;
  for (const { rule, layerRank } of getEntries(root)) {
    /** @type {Map<DomNode, number>} */
    const matched = new Map();
    for (const text of rule.selectors) {
      const selector = /** @type {Selector} */ (
        parser().astSync(text).nodes[0]
      );
      const specificity = getSpecificity(selector);
      for (const element of selectAll(text, document, selectOptions)) {
        matched.set(element, Math.max(matched.get(element) ?? 0, specificity));
      }
    }
    for (const node of rule.nodes) {
      if (node.type !== 'decl') continue;
      order++;
      for (const [element, specificity] of matched) {
        // Important declarations in earlier layers win, the reverse of normal
        const rank = [
          node.important ? 1 : 0,
          node.important ? -layerRank : layerRank,
          specificity,
          order,
        ];
        /** @type {Map<string, Winner>} */
        const forElement = winners.get(element) ?? new Map();
        winners.set(element, forElement);
        const current = forElement.get(node.prop);
        if (!current || isGreater(rank, current.rank)) {
          forElement.set(node.prop, {
            rank,
            value: `${node.value}${node.important ? ' !important' : ''}`,
          });
        }
      }
    }
  }
  return new Map(
    [...winners].map(([element, properties]) => [
      element,
      new Map(
        [...properties].map(([property, { value }]) => [property, value]),
      ),
    ]),
  );
}

/**
 * @param {Array<number>} rank - cascade rank
 * @param {Array<number>} current - cascade rank to beat
 * @return {boolean} whether rank beats current
 */
function isGreater(rank, current) {
  for (const [index, value] of rank.entries()) {
    const other = current[index] ?? 0;
    if (value !== other) return value > other;
  }
  return false;
}

/**
 * Record where each declaration starts, to find the moves the plugin makes.
 * @param {Array<Entry>} entries - rules of the input, before the plugin runs
 * @return {() => boolean} after the plugin runs on the same root, whether a
 *   moved declaration jumped over a rule that sets the same property in the
 *   layer it left or the layer it joined
 */
function watchMoves(entries) {
  /** @type {Map<Declaration, number>} */
  const origins = new Map();
  const properties = entries.map(({ rule }, index) => {
    /** @type {Set<string>} */
    const declared = new Set();
    rule.each((node) => {
      if (node.type !== 'decl') return;
      origins.set(node, index);
      declared.add(node.prop);
    });
    return declared;
  });
  /**
   * @param {number} host - index of the rule the declarations moved into
   * @param {number} from - index of the rule they came from
   * @param {Set<number>} absorbed - indexes of every rule moved into host
   * @return {boolean} whether a rule in between conflicts
   */
  const isJumpBlocked = (host, from, absorbed) => {
    for (let between = host + 1; between < from; between++) {
      const { layer } = entries[between] ?? { layer: '' };
      if (
        !absorbed.has(between) &&
        (layer === entries[host]?.layer || layer === entries[from]?.layer) &&
        [...(properties[between] ?? [])].some((property) =>
          properties[from]?.has(property),
        )
      ) {
        return true;
      }
    }
    return false;
  };
  return () =>
    entries.some(({ rule }, host) => {
      /** @type {Set<number>} */
      const absorbed = new Set();
      // A rule merged into another one is left with no parent
      if (rule.parent) {
        rule.each((node) => {
          const origin = node.type === 'decl' ? origins.get(node) : undefined;
          if (origin !== undefined && origin !== host) absorbed.add(origin);
        });
      }
      return [...absorbed].some((from) => isJumpBlocked(host, from, absorbed));
    });
}

/**
 * @param {Styles} styles - winning declarations
 * @param {Array<DomNode>} elements - every element, in document order
 * @return {Array<Array<[string, string]>>} each element's winning
 *   declarations, sorted by property
 */
function getComparable(styles, elements) {
  return elements.map((element) =>
    [...(styles.get(element) ?? [])].sort(([a], [b]) => (a < b ? -1 : 1)),
  );
}

describe('Cascade', () => {
  it('keeps the winning declarations when no rule in between conflicts', () => {
    fc.assert(
      fc.property(
        stylesheet,
        elementShapes,
        fc.constantFrom(...modes),
        (css, shapes, options) => {
          const document = buildDocument(shapes);
          const before = getStyles(postcss.parse(css), document);
          const root = postcss.parse(css);
          const hasConflict = watchMoves(getEntries(root));
          const output = postcss([plugin(options)]).process(root, {
            from: undefined,
          }).root;
          fc.pre(!hasConflict());
          const elements = selectAll('*', document);
          assert.deepEqual(
            getComparable(getStyles(output, document), elements),
            getComparable(before, elements),
          );
        },
      ),
      getParameters(300),
    );
  });
});
