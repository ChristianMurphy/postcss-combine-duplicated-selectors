/**
 * @import {AtRule, Declaration, PluginCreator, Rule} from 'postcss'
 * @import {Pseudo, Root, Selector} from 'postcss-selector-parser'
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
 * @param {Root} selectors - parsed selector list
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
  return compound.flatMap((node) =>
    sortable.has(node) ? sorted.splice(0, 1) : [node],
  );
}

/**
 * Sort each compound of a selector with sortCompound.
 * @param {Selector} selector - one complex selector
 * @return {undefined}
 */
function sortCompounds(selector) {
  /** @type {Selector['nodes']} */
  const nodes = [];
  /** @type {Selector['nodes']} */
  let compound = [];
  for (const node of selector.nodes) {
    if (node.type === 'combinator') {
      nodes.push(...sortCompound(compound), node);
      compound = [];
    } else {
      compound.push(node);
    }
  }
  selector.nodes = [...nodes, ...sortCompound(compound)];
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
 * @param {Root} selectors - parsed selector list
 * @return {undefined}
 */
function normalizePseudos(selectors) {
  /** @type {Array<Pseudo>} */
  const pseudos = [];
  selectors.walkPseudos((pseudo) => {
    // Sass interpolation such as :#{$State} stays case-sensitive
    if (/^::?[a-z-]+$/i.test(pseudo.value)) {
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
  if (/^#[\da-f]+$/i.test(word)) return 'hash';
  if (word.startsWith('--')) return 'custom property';
  return `identifier ${word.toLowerCase()}`;
}

/**
 * Describe value nodes by kind, unit and name, ignoring numbers, spaces and
 * comments, the way stylelint compares value syntaxes.
 * @param {Array<ValueNode>} nodes - postcss-value-parser nodes
 * @return {string} the same shape for values with the same syntax
 */
function getValueShape(nodes) {
  const significant = nodes.filter(
    (node) => node.type !== 'space' && node.type !== 'comment',
  );
  return JSON.stringify(
    significant.map((node, index) => {
      switch (node.type) {
        case 'word': {
          return getWordShape(node.value);
        }
        case 'function': {
          return JSON.stringify([
            'function',
            node.value.toLowerCase(),
            getValueShape(node.nodes),
          ]);
        }
        case 'div': {
          return `div ${node.value}`;
        }
        case 'string': {
          // A Less escape such as ~"calc(1px)" holds value text, so use that
          return significant[index - 1]?.value === '~'
            ? JSON.stringify([
                'escape',
                getValueShape(valueParser(node.value).nodes),
              ])
            : 'string';
        }
        default: {
          return node.type;
        }
      }
    }),
  );
}

/**
 * Remove declarations that a later declaration of the same property overrides.
 * @param {Rule} rule - rule to clean up
 * @param {'property' | 'value' | 'syntax'} removal - remove any earlier
 *   declaration of the property, one with an equal value, or one with an
 *   equal value or the same syntax
 * @return {undefined}
 */
function removeDupProperties(rule, removal) {
  /** @type {Array<Declaration>} */
  const kept = [];
  for (const declaration of rule.nodes.filter((node) => node.type === 'decl')) {
    const earlier = kept.find(
      (candidate) =>
        candidate.prop === declaration.prop &&
        (removal === 'property' ||
          candidate.value === declaration.value ||
          (removal === 'syntax' &&
            getValueShape(valueParser(candidate.value).nodes) ===
              getValueShape(valueParser(declaration.value).nodes))),
    );
    if (earlier === undefined) {
      kept.push(declaration);
    } else if (earlier.important && !declaration.important) {
      // An !important declaration wins over a later one without it
      declaration.remove();
    } else {
      earlier.remove();
      kept[kept.indexOf(earlier)] = declaration;
    }
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
 * Remove each selector whose key matches an earlier one in the list.
 * @param {string} selector - selector list, kept with its original spacing
 * @param {string[]} keys - normalized selectors from getSelectorKeys
 * @return {string} selector list without the repeated selectors
 */
function removeDuplicateSelectors(selector, keys) {
  const repeated = new Set(
    keys.flatMap((key, index) => (keys.indexOf(key) < index ? [index] : [])),
  );
  return parser((selectors) => {
    for (const [index, node] of [...selectors.nodes].entries()) {
      if (repeated.has(index)) node.remove();
    }
  }).processSync(selector);
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

// Gives each block of an at-rule outside mergeableAtRules its own context
let lastBlockId = 0;

/**
 * Describe one at-rule ancestor for the context key.
 * @param {AtRule} atRule - at-rule ancestor
 * @return {string} the same step for blocks whose rules may merge
 */
function getAtRuleStep(atRule) {
  const name = atRule.name.toLowerCase();
  const step = `@${name} ${normalizeParams(atRule.params)}`;
  return mergeableAtRules.has(name) ? step : `${step} #${++lastBlockId}`;
}

/**
 * Describe every ancestor of a rule, from the root down, as one string.
 * @param {Rule} rule - rule to describe the context of
 * @param {WeakMap<AtRule | Rule, string>} stepCache - steps already computed
 * @return {string} key shared by rules in the same nesting context
 */
function getContextKey(rule, stepCache) {
  /** @type {Array<string>} */
  const steps = [];
  let node = rule.parent;
  while (node?.type === 'atrule' || node?.type === 'rule') {
    // Many rules share ancestors, so each ancestor's step is computed once
    let step = stepCache.get(node);
    if (step === undefined) {
      step =
        node.type === 'atrule'
          ? getAtRuleStep(node)
          : joinSelectorKeys(
              getSelectorKeys.transformSync(node.selector, { lossless: false }),
            );
      stepCache.set(node, step);
    }
    steps.unshift(step);
    node = node.parent;
  }
  return JSON.stringify(steps);
}

/**
 * Read which duplicated declarations to remove. Plain JavaScript callers can
 * pass any value, so this checks removeDuplicatedValues at run time.
 * @param {Options | undefined} options - options passed to the plugin
 * @return {'property' | 'value' | 'syntax' | undefined} which earlier
 *   declarations removeDupProperties removes; undefined keeps every one
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
    prepare() {
      // Map each nesting context to the rules seen in it
      /** @type {Map<string, Map<string, Rule>>} */
      const mapTable = new Map();
      /** @type {WeakMap<AtRule | Rule, string>} */
      const stepCache = new WeakMap();

      return {
        Rule: (rule) => {
          const keys = getSelectorKeys.transformSync(rule.selector, {
            lossless: false,
          });
          // postcss-selector-parser cannot read the // comments that
          // postcss-scss keeps in raws.selector.scss, so leave those lists
          const raws = rule.raws.selector;
          if (new Set(keys).size < keys.length && !(raws && 'scss' in raws)) {
            // PostCSS keeps a selector's comments only in raws.selector.raw
            const raw =
              raws?.value === rule.selector
                ? removeDuplicateSelectors(raws.raw, keys)
                : undefined;
            rule.selector = removeDuplicateSelectors(rule.selector, keys);
            if (raw !== undefined) {
              rule.raws.selector = { value: rule.selector, raw };
            }
          }

          // Rules only combine when every ancestor at-rule and rule matches
          const context = getContextKey(rule, stepCache);
          let map = mapTable.get(context);
          if (map === undefined) {
            map = new Map();
            mapTable.set(context, map);
          }

          const selector = joinSelectorKeys(keys);
          // The first rule seen with this selector, which later ones merge into
          const destination = map.get(selector);

          if (destination) {
            // check if node has already been processed
            if (destination === rule) return;

            // move declarations to original rule
            destination.append(...rule.nodes);

            // store the original rule parent before removal in case it or
            // its ancestors become empty as a result of the removal
            let emptied = rule.parent;

            // remove duplicated rule
            rule.remove();

            // Moving the rule can leave its wrappers empty, such as a second
            // @media block or a nesting parent. Remove each one, walking up.
            while (
              (emptied?.type === 'atrule' || emptied?.type === 'rule') &&
              emptied.nodes.length === 0
            ) {
              const parent = emptied.parent;
              emptied.remove();
              emptied = parent;
            }

            if (removal) removeDupProperties(destination, removal);
          } else {
            if (removal) removeDupProperties(rule, removal);
            // add new selector to symbol table
            map.set(selector, rule);
          }
        },
      };
    },
  };
};

plugin.postcss = true;

export default plugin;
