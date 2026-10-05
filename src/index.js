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
 * @typedef {(KeepDuplicatedOptions | RemoveDuplicatedPropertiesOptions | RemoveDuplicatedValuesOptions) & KeepCascadeOptions} Options
 */

/**
 * @typedef KeepCascadeOptions
 * @property {boolean} [keepCascade] Combine a rule into an earlier one only
 *   when no rule between them sets a property it moves. A rule that holds
 *   nested rules or at-rules, or that sets `all`, stays in place.
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
import { propertyGroups, propertyGroupSegments } from './property-groups.js';

// Not read from package.json, so bundles omit it
const name = 'postcss-combine-duplicated-selectors';

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
  // sorted holds one node per sortable node
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
 * Remove nodes with one rebuild per parent. At-rules and rules left empty are
 * removed too, walking up.
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
 * @param {string} property - property name
 * @return {string} the same group for properties that set a value in common;
 *   a custom property is its own group, and a name with an escape or an
 *   interpolation is in the group of `all`
 */
function getPropertyGroup(property) {
  if (/\\|[#@]\{/.test(property)) return 'all';
  if (property.startsWith('--')) return property;
  const name = property.toLowerCase();
  const listed = propertyGroups.get(name);
  if (listed !== undefined) return listed;
  const unprefixed = name.replace(/^-[a-z]+-/, '');
  // A longhand the map does not list joins the longest property it extends
  /** @type {Array<number>} */
  const ends = [];
  for (
    let end = unprefixed.indexOf('-');
    end !== -1 && ends.length < propertyGroupSegments;
    end = unprefixed.indexOf('-', end + 1)
  ) {
    ends.push(end);
  }
  if (ends.length < propertyGroupSegments) ends.push(unprefixed.length);
  for (const end of ends.toReversed()) {
    const group = propertyGroups.get(unprefixed.slice(0, end));
    if (group !== undefined) return group;
  }
  return unprefixed.slice(0, ends[0]);
}

/**
 * @param {Options | undefined} options - options passed to the plugin
 * @return {boolean} whether to combine only rules whose move keeps the cascade
 */
function getKeepCascade(options) {
  /** @type {unknown} */
  const value = options?.keepCascade;
  if (value === undefined || value === null || value === false) return false;
  if (value === true) return true;
  throw new TypeError(
    `${name}: keepCascade must be false or true, not ${JSON.stringify(value)}`,
  );
}

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
  const isKeepingCascade = getKeepCascade(options);
  return {
    postcssPlugin: name,
    OnceExit(proxy) {
      // A PostCSS proxy's children are not the nodes their parents point to
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
      // keepCascade: the position where each property group was last set
      /** @type {Map<string, number>} */
      const lastSetPositions = new Map();
      /** @type {Map<string, string>} */
      const groupCache = new Map();
      // keepCascade: the rule that later rules with the same key combine into
      /** @type {Map<string, {key: string, position: number}>} */
      const hosts = new Map();
      let position = 0;
      let lastAllPosition = 0;
      /**
       * @param {Declaration} declaration - declaration to group
       * @return {string} its property group
       */
      const getGroup = (declaration) =>
        getCached(groupCache, declaration.prop, getPropertyGroup);
      /**
       * @param {Array<ChildNode>} nodes - children of a rule or at-rule
       * @return {{groups: Array<string>, hasNested: boolean}} the property
       *   groups its declarations set, and whether it holds rules or at-rules
       */
      const getDeclaredGroups = (nodes) => {
        /** @type {Array<string>} */
        const groups = [];
        let hasNested = false;
        for (const child of nodes) {
          if (child.type === 'decl') {
            groups.push(getGroup(child));
          } else if (child.type !== 'comment') {
            hasNested = true;
          }
        }
        return { groups, hasNested };
      };
      /**
       * @param {Array<string>} groups - property groups set
       * @param {number} at - position that sets them
       * @return {undefined}
       */
      const setPositions = (groups, at) => {
        for (const group of groups) lastSetPositions.set(group, at);
        if (groups.includes('all')) lastAllPosition = at;
      };

      // A rule's key is its context's number plus its normalized selector
      /** @type {Map<Rule, string>} */
      const ruleKeys = new Map();
      /** @type {Map<string, number>} */
      const contextIds = new Map();
      /**
       * @param {number} context - number of the parent context
       * @param {string} step - normalized selector or at-rule
       * @return {string} the key of the step within its context
       */
      const getKey = (context, step) => `${context}${JSON.stringify(step)}`;
      /**
       * @param {string} key - key from getKey
       * @return {number} the number of the context the key opens
       */
      const getContextId = (key) =>
        getCached(contextIds, key, () => contextIds.size + 1);
      // A stack, not recursion, so deep nesting cannot overflow; children go
      // on reversed to come off in document order
      // An array holds the groups of declarations that follow a nested node
      /** @type {Array<[Rule | AtRule | Array<string>, number]>} */
      const pending = [];
      /**
       * @param {Array<ChildNode>} nodes - children to visit
       * @param {number} context - number of their context
       * @return {undefined}
       */
      const visit = (nodes, context) => {
        if (!isKeepingCascade) {
          for (const node of nodes.toReversed()) {
            if (node.type === 'rule' || node.type === 'atrule') {
              pending.push([node, context]);
            }
          }
          return;
        }
        /** @type {Array<[Rule | AtRule | Array<string>, number]>} */
        const entries = [];
        let hasNested = false;
        /** @type {Array<string> | undefined} */
        let following;
        for (const node of nodes) {
          if (node.type === 'rule' || node.type === 'atrule') {
            entries.push([node, context]);
            hasNested = true;
            following = undefined;
          } else if (node.type === 'decl' && hasNested) {
            if (!following) {
              following = [];
              entries.push([following, context]);
            }
            following.push(getGroup(node));
          }
        }
        for (const entry of entries.toReversed()) pending.push(entry);
      };
      visit(root.nodes, 0);
      for (let entry = pending.pop(); entry; entry = pending.pop()) {
        const [node, context] = entry;
        if (Array.isArray(node)) {
          setPositions(node, ++position);
        } else if (node.type === 'rule') {
          const keys = getCached(selectorCache, node.selector, (selector) =>
            getSelectorKeys.transformSync(selector, { lossless: false }),
          );
          removeRepeatedSelectors(node, keys);
          let key = getKey(context, joinSelectorKeys(keys));
          if (isKeepingCascade) {
            position++;
            const { groups, hasNested } = getDeclaredGroups(node.nodes);
            const host = hosts.get(key);
            if (
              host &&
              !hasNested &&
              !groups.includes('all') &&
              lastAllPosition <= host.position &&
              groups.every(
                (group) => (lastSetPositions.get(group) ?? 0) <= host.position,
              )
            ) {
              setPositions(groups, host.position);
              key = host.key;
            } else {
              setPositions(groups, position);
              const hostKey = `${key}#${position}`;
              hosts.set(key, { key: hostKey, position });
              key = hostKey;
            }
          }
          ruleKeys.set(node, key);
          visit(node.nodes, getContextId(key));
        } else if (node.nodes) {
          if (isKeepingCascade) {
            const { groups } = getDeclaredGroups(node.nodes);
            if (groups.length > 0) setPositions(groups, ++position);
          }
          const atName = node.name.toLowerCase();
          const params = getCached(paramsCache, node.params, normalizeParams);
          const step = `@${atName} ${params}`;
          // Each @layer block without a name is a separate layer
          const blockStep =
            mergeableAtRules.has(atName) && (atName !== 'layer' || params)
              ? step
              : `${step} #${++blockId}`;
          visit(node.nodes, getContextId(getKey(context, blockStep)));
        } else if (isKeepingCascade) {
          // An at-rule without a block, such as @apply, can set any property
          lastAllPosition = ++position;
        }
      }

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
          // Only a repeated property can be a duplicate
          const duplicates = dedupe(
            declarations.flatMap((node) =>
              counts.get(node.prop) === 1
                ? []
                : [[node, getDeclarationKey(node)]],
            ),
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
