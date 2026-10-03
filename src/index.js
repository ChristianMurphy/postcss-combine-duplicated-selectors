/**
 * @import {AtRule, ChildNode, Container, Declaration, PluginCreator, Root, Rule} from 'postcss'
 * @import {Pseudo, Root as SelectorRoot, Selector} from 'postcss-selector-parser'
 * @import {Node as ValueNode} from 'postcss-value-parser'
 */

/**
 * How to remove duplicated declarations from each rule.
 *
 * - `true`: remove a declaration when a later declaration of the same
 *   property has an equal value.
 * - `'syntax'`: also remove it when the later value has the same units,
 *   functions and keywords in the same positions. `margin: 10px` followed
 *   by `margin: 5px` is removed, but stays when followed by
 *   `margin: 1rem`. This follows stylelint's same-syntax rule for
 *   duplicated properties.
 *
 * In every mode, an `!important` declaration stays when the later
 * declaration does not have the flag.
 *
 * @typedef {true | 'syntax'} DuplicatedValuesMode
 */

/**
 * Options for postcss-combine-duplicated-selectors. Set at most one of
 * `removeDuplicatedProperties` and `removeDuplicatedValues`.
 *
 * @typedef {KeepDuplicatedOptions | RemoveDuplicatedPropertiesOptions | RemoveDuplicatedValuesOptions} Options
 */

/**
 * @typedef KeepDuplicatedOptions
 * @property {false} [removeDuplicatedProperties] Keep every duplicated
 *   declaration.
 * @property {false} [removeDuplicatedValues] Keep every duplicated
 *   declaration.
 */

/**
 * @typedef RemoveDuplicatedPropertiesOptions
 * @property {true} removeDuplicatedProperties Keep only the last declaration
 *   of each property, or the last `!important` one when an earlier
 *   declaration has the flag.
 * @property {false} [removeDuplicatedValues] Off, because only one of the
 *   two options can be set.
 */

/**
 * @typedef RemoveDuplicatedValuesOptions
 * @property {false} [removeDuplicatedProperties] Off, because only one of
 *   the two options can be set.
 * @property {DuplicatedValuesMode} removeDuplicatedValues Remove duplicated
 *   declarations; see {@link DuplicatedValuesMode}.
 */

import parser from 'postcss-selector-parser';
import valueParser from 'postcss-value-parser';
import packageJson from '../package.json' with { type: 'json' };

const { name } = packageJson;

/**
 * Ensure that attributes with different quotes match.
 * @param {SelectorRoot} selectors - parsed selector list
 * @return {undefined}
 */
function normalizeAttributes(selectors) {
  selectors.walkAttributes((node) => {
    if (node.value) {
      node.quoteMark = '"';
    }
  });
}

// Each of these starts with its own delimiter, so sorted runs of them cannot
// read as a different selector. A type selector moved after a class could:
// div.a would read as .adiv
/** @type {ReadonlySet<Selector['nodes'][number]['type']>} */
const sortableTypes = new Set(['class', 'id', 'attribute', 'pseudo']);

/**
 * Sort the classes, ids, attributes and pseudo-classes of one compound
 * alphabetically, leaving other nodes in place.
 * @param {Selector['nodes']} compound - nodes between two combinators
 * @return {Selector['nodes']} the same nodes, sorted
 */
function sortCompound(compound) {
  // Most compounds hold a single simple selector, which needs no sorting
  if (compound.length < 2) return compound;
  // Pseudo-classes after a pseudo-element apply to it, so keep the order
  const end = compound.findIndex((node) => parser.isPseudoElement(node));
  const head = end === -1 ? compound : compound.slice(0, end);
  const sortable = new Set(head.filter((node) => sortableTypes.has(node.type)));
  if (sortable.size < 2) return compound;
  const sorted = [...sortable].sort((a, b) => (String(a) < String(b) ? -1 : 1));
  let next = 0;
  // Each sortable node takes the next sorted one, so the index stays in range
  return compound.map((node) =>
    sortable.has(node)
      ? /** @type {Selector['nodes'][number]} */ (sorted[next++])
      : node,
  );
}

/**
 * Sort each compound of a selector with sortCompound.
 * @param {Selector} selector - one complex selector
 * @return {undefined}
 */
function sortCompounds(selector) {
  /** @type {Array<Selector['nodes']>} */
  const parts = [[]];
  for (const node of selector.nodes) {
    if (node.type === 'combinator') {
      parts.push([node], []);
    } else {
      parts.at(-1)?.push(node);
    }
  }
  selector.nodes = parts.flatMap(sortCompound);
}

// Pseudo-classes whose argument is a selector list where order and repeats do
// not change what matches
/** @type {ReadonlySet<string>} */
const listPseudos = new Set([
  ':is',
  ':where',
  ':not',
  ':has',
  ':matches',
  ':-webkit-any',
  ':-moz-any',
]);

/**
 * Lowercase pseudo-class and pseudo-element names, which CSS treats as
 * case-insensitive, and normalize the selector lists inside their arguments.
 * @param {SelectorRoot} selectors - parsed selector list
 * @return {undefined}
 */
function normalizePseudos(selectors) {
  /** @type {Array<Pseudo>} */
  const pseudos = [];
  selectors.walkPseudos((pseudo) => {
    // Sass interpolation such as :#{$State} stays case-sensitive
    const name = pseudo.value.slice(pseudo.value.startsWith('::') ? 2 : 1);
    if (
      pseudo.value.startsWith(':') &&
      name.length > 0 &&
      [...name].every(
        (char) =>
          char === '-' ||
          (char >= 'a' && char <= 'z') ||
          (char >= 'A' && char <= 'Z'),
      )
    ) {
      pseudo.value = pseudo.value.toLowerCase();
    }
    if (listPseudos.has(pseudo.value)) pseudos.push(pseudo);
  });
  // The walk lists outer pseudo-classes first; inner ones must sort first
  for (const pseudo of pseudos.reverse()) {
    pseudo.each(sortCompounds);
    const unique = new Map(pseudo.nodes.map((node) => [String(node), node]));
    pseudo.nodes = [...unique]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, node]) => node);
  }
}

/**
 * Describe a word node by its kind: a number with its unit, a hash, a custom
 * property name, or another identifier with its lowercased name.
 * @param {string} word - word node value
 * @return {string} the same shape for words of the same kind
 */
function getWordShape(word) {
  const dimension = valueParser.unit(word);
  if (dimension) return `number ${dimension.unit}`;
  const digits = Array.from(word.slice(1));
  if (
    word.startsWith('#') &&
    digits.length > 0 &&
    digits.every((digit) => !Number.isNaN(Number.parseInt(digit, 16)))
  ) {
    return 'hash';
  }
  if (word.startsWith('--')) return 'custom property';
  return `identifier ${word.toLowerCase()}`;
}

/**
 * A description of each value node, with nested arrays for function arguments
 * @typedef {string | Array<ValueShape>} ValueShape
 */

/**
 * Describe value nodes by kind, unit and name, ignoring numbers, spaces and
 * comments, the way stylelint compares value syntaxes.
 * @param {Array<ValueNode>} nodes - postcss-value-parser nodes
 * @return {Array<ValueShape>} the same shape for values with the same syntax
 */
function getValueShape(nodes) {
  const significant = nodes.filter(
    (node) => node.type !== 'space' && node.type !== 'comment',
  );
  return significant.map((node, index) => {
    switch (node.type) {
      case 'word': {
        return getWordShape(node.value);
      }
      case 'function': {
        return [
          'function',
          node.value.toLowerCase(),
          getValueShape(node.nodes),
        ];
      }
      case 'div': {
        return `div ${node.value}`;
      }
      case 'string': {
        // A Less escape such as ~"calc(1px)" holds value text, so use that
        return significant[index - 1]?.value === '~'
          ? ['escape', getValueShape(valueParser(node.value).nodes)]
          : 'string';
      }
      default: {
        return node.type;
      }
    }
  });
}

/**
 * Keep one item per key. When a key repeats, `merge` receives the kept item
 * and the new one and returns the one to keep; the other one is dropped.
 * @template T
 * @param {Iterable<[T, string]>} entries - items with their keys, in order
 * @param {(kept: T, item: T) => T} merge - choose the item to keep
 * @return {Array<T>} the dropped items
 */
function dedupe(entries, merge) {
  /** @type {Map<string, T>} */
  const kept = new Map();
  /** @type {Array<T>} */
  const dropped = [];
  for (const [item, key] of entries) {
    const earlier = kept.get(key);
    if (earlier === undefined) {
      kept.set(key, item);
    } else {
      const winner = merge(earlier, item);
      kept.set(key, winner);
      dropped.push(winner === item ? earlier : item);
    }
  }
  return dropped;
}

/**
 * Read a value from a per-run cache, computing it on the first request.
 * @template K, V
 * @param {Map<K, V>} cache - values computed so far in this run
 * @param {K} key - what the value is computed from
 * @param {(key: K) => V} compute - compute the value from the key
 * @return {V} the cached value
 */
function getCached(cache, key, compute) {
  let value = cache.get(key);
  if (value === undefined) {
    value = compute(key);
    cache.set(key, value);
  }
  return value;
}

/**
 * A container that holds the removed nodes, so its children are defined.
 * @typedef {Container & {nodes: Array<ChildNode>}} Parent
 */

/**
 * Remove nodes with one rebuild per parent. Removing a node one at a time
 * searches and shifts its siblings, so many removals would take squared time.
 * At-rules and rules left empty are removed too, walking up.
 * @param {Array<ChildNode>} nodes - nodes to remove; emptied wrappers are
 *   appended to it
 * @return {undefined}
 */
function removeNodes(nodes) {
  /** @type {Map<Parent, Set<ChildNode>>} */
  const removedByParent = new Map();
  // The loop visits wrappers pushed while it runs
  for (const node of nodes) {
    const parent = /** @type {Parent} */ (node.parent);
    const removed = getCached(removedByParent, parent, () => new Set());
    removed.add(node);
    if (
      (parent.type === 'atrule' || parent.type === 'rule') &&
      removed.size === parent.nodes.length
    ) {
      nodes.push(/** @type {AtRule | Rule} */ (parent));
    }
  }
  for (const [parent, removed] of removedByParent) {
    const kept = parent.nodes.filter((node) => !removed.has(node));
    parent.removeAll();
    parent.append(kept);
  }
}

// Normalize each selector in a list, so selectors that match the same
// elements read the same
const getSelectorKeys = parser((selectors) => {
  normalizeAttributes(selectors);
  normalizePseudos(selectors);
  selectors.each(sortCompounds);
  return selectors.map(String);
});

/**
 * Describe a selector list so that lists matching the same elements share it.
 * @param {string[]} keys - normalized selectors from getSelectorKeys
 * @return {string} the distinct keys, sorted and joined
 */
function joinSelectorKeys(keys) {
  return [...new Set(keys)].sort().join(',');
}

/**
 * Remove the selectors at the given positions of a list.
 * @param {string} selector - selector list, kept with its original spacing
 * @param {Set<number>} repeated - positions of the selectors to remove
 * @return {string} selector list without the repeated selectors
 */
function removeDuplicateSelectors(selector, repeated) {
  return parser((selectors) => {
    selectors.nodes = selectors.nodes.filter(
      (_, index) => !repeated.has(index),
    );
  }).processSync(selector);
}

/**
 * Remove each selector whose key matches an earlier one in the rule's list.
 * @param {Rule} rule - rule to clean up
 * @param {string[]} keys - normalized selectors from getSelectorKeys
 * @return {undefined}
 */
function removeRepeatedSelectors(rule, keys) {
  // postcss-selector-parser cannot read the // comments that postcss-scss
  // keeps in raws.selector.scss, so leave those lists
  const raws = rule.raws.selector;
  if (raws && 'scss' in raws) return;
  const repeated = new Set(
    dedupe(
      keys.map((key, index) => [index, key]),
      (first) => first,
    ),
  );
  if (repeated.size === 0) return;
  // PostCSS keeps a selector's comments only in raws.selector.raw
  const raw =
    raws?.value === rule.selector
      ? removeDuplicateSelectors(raws.raw, repeated)
      : undefined;
  rule.selector = removeDuplicateSelectors(rule.selector, repeated);
  if (raw !== undefined) {
    rule.raws.selector = { value: rule.selector, raw };
  }
}

/**
 * Normalize at-rule params so that spacing differences are ignored.
 * @param {string} params - at-rule params
 * @return {string} params with single spaces, no padding around brackets,
 * commas, slashes and colons, and selector() arguments normalized as selectors
 */
function normalizeParams(params) {
  const parsed = valueParser(params);
  parsed.walk((node) => {
    // Spaces in a selector can be combinators, so parse it as a selector
    if (node.type === 'function' && node.value.toLowerCase() === 'selector') {
      const keys = getSelectorKeys.transformSync(
        valueParser.stringify(node.nodes),
        { lossless: false },
      );
      node.nodes = [
        {
          type: 'word',
          value: joinSelectorKeys(keys),
          sourceIndex: node.sourceIndex,
          sourceEndIndex: node.sourceEndIndex,
        },
      ];
      node.before = '';
      node.after = '';
      return false;
    }
    if (node.type === 'space') {
      node.value = ' ';
    } else if (node.type === 'function' || node.type === 'div') {
      node.before = '';
      node.after = '';
    }
  });
  return parsed.toString();
}

// Rules in separate blocks of these at-rules apply under the same condition, so
// they can merge. Other at-rules, such as @keyframes, Sass control flow and
// mixins, can replace or depend on earlier blocks, so rules merge only within
// one block
/** @type {ReadonlySet<string>} */
const mergeableAtRules = new Set([
  'media',
  'supports',
  'layer',
  'container',
  'scope',
  'starting-style',
]);

/**
 * Read which duplicated declarations to remove. Plain JavaScript callers can
 * pass any value, so this checks removeDuplicatedValues at run time.
 * @param {Options | undefined} options - options passed to the plugin
 * @return {'property' | 'value' | 'syntax' | undefined} which earlier
 *   declarations to remove; undefined keeps every one
 */
function getDuplicateRemoval(options) {
  /** @type {unknown} */
  const values = options?.removeDuplicatedValues;
  if (values === 'syntax') return 'syntax';
  if (values === true) return 'value';
  if (values !== undefined && values !== null && values !== false) {
    throw new TypeError(
      `${name}: removeDuplicatedValues must be false, true or 'syntax', not ${JSON.stringify(values)}`,
    );
  }
  return options?.removeDuplicatedProperties ? 'property' : undefined;
}

/**
 * Combine rules with equivalent selectors in the same context, and optionally
 * remove duplicated declarations.
 *
 * @example
 *   import postcss from 'postcss';
 *   import combineSelectors from 'postcss-combine-duplicated-selectors';
 *
 *   postcss([combineSelectors({ removeDuplicatedValues: true })]);
 *
 * @type {PluginCreator<Options>}
 */
const plugin = (options) => {
  const removal = getDuplicateRemoval(options);
  return {
    postcssPlugin: name,
    OnceExit(proxy) {
      // PostCSS may pass a proxy whose nodes getter copies the array on each
      // read and whose children differ in identity from their parent pointers
      const root = /** @type {{proxyOf: Root}} */ (
        /** @type {unknown} */ (proxy)
      ).proxyOf;
      /** @type {Map<string, Array<string>>} */
      const selectorCache = new Map();
      /** @type {Map<string, string>} */
      const paramsCache = new Map();
      /** @type {Map<string, string>} */
      const shapeCache = new Map();
      let blockId = 0;

      // Each rule's key: the steps of its ancestors and itself, from the root
      // down. Rules merge when every ancestor at-rule and rule matches.
      /** @type {Map<Rule, string>} */
      const ruleKeys = new Map();
      /**
       * @param {Array<ChildNode>} nodes - children whose rules to key
       * @param {string} path - key of the parent
       * @return {undefined}
       */
      const keyRules = (nodes, path) => {
        for (const node of nodes) {
          if (node.type === 'rule') {
            const keys = getCached(selectorCache, node.selector, (selector) =>
              getSelectorKeys.transformSync(selector, { lossless: false }),
            );
            removeRepeatedSelectors(node, keys);
            const key = path + JSON.stringify(joinSelectorKeys(keys));
            ruleKeys.set(node, key);
            keyRules(node.nodes, key);
          } else if (node.type === 'atrule' && node.nodes) {
            const atName = node.name.toLowerCase();
            const params = getCached(paramsCache, node.params, normalizeParams);
            const step = `@${atName} ${params}`;
            keyRules(
              node.nodes,
              path +
                JSON.stringify(
                  mergeableAtRules.has(atName) ? step : `${step} #${++blockId}`,
                ),
            );
          }
        }
      };
      keyRules(root.nodes, '');

      // Move the children of each repeated rule into the first one
      /** @type {Array<ChildNode>} */
      const dropped = dedupe(ruleKeys, (first, rule) => {
        const children = rule.nodes;
        rule.removeAll();
        first.append(children);
        return first;
      });

      if (removal) {
        /**
         * @param {Declaration} declaration - declaration to describe
         * @return {string} the same key for declarations that duplicate
         *   each other
         */
        const getDeclarationKey = ({ prop, value }) => {
          if (removal === 'property') return prop;
          return JSON.stringify([
            prop,
            removal === 'value'
              ? value
              : getCached(shapeCache, value, (text) =>
                  JSON.stringify(getValueShape(valueParser(text).nodes)),
                ),
          ]);
        };
        for (const rule of ruleKeys.keys()) {
          /** @type {Array<Declaration>} */
          const declarations = [];
          /** @type {Map<string, number>} */
          const counts = new Map();
          for (const node of rule.nodes) {
            if (node.type !== 'decl') continue;
            declarations.push(node);
            counts.set(node.prop, (counts.get(node.prop) ?? 0) + 1);
          }
          // Only a repeated property can be a duplicate, so most declarations
          // skip building a key
          const duplicates = dedupe(
            declarations.flatMap((node) =>
              counts.get(node.prop) === 1
                ? []
                : [[node, getDeclarationKey(node)]],
            ),
            // An !important declaration wins over a later one without it
            (earlier, declaration) =>
              earlier.important && !declaration.important
                ? earlier
                : declaration,
          );
          for (const duplicate of duplicates) dropped.push(duplicate);
        }
      }

      removeNodes(dropped);
    },
  };
};

plugin.postcss = true;

export default plugin;
