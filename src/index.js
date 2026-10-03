import parser from 'postcss-selector-parser';
import valueParser from 'postcss-value-parser';
import packageJson from '../package.json' with { type: 'json' };

const { name } = packageJson;

/**
 * Ensure that attributes with different quotes match.
 * @param {Object} selector - postcss selector node
 */
function normalizeAttributes(selector) {
  selector.walkAttributes((node) => {
    if (node.value) {
      node.quoteMark = '"';
    }
  });
}

// Each of these starts with its own delimiter, so sorted runs of them cannot
// read as a different selector. A type selector moved after a class could:
// div.a would read as .adiv
const sortableTypes = new Set(['class', 'id', 'attribute', 'pseudo']);

/**
 * Sort the classes, ids, attributes and pseudo-classes in each compound of a
 * selector alphabetically, leaving other nodes in place.
 * @param {Object} selector - postcss selector node for one complex selector
 */
function sortCompounds(selector) {
  const nodes = selector.nodes;
  let slots = [];
  let isAfterPseudoElement = false;
  for (let index = 0; index <= nodes.length; index++) {
    const node = nodes[index];
    if (node === undefined || node.type === 'combinator') {
      const sorted = slots
        .map((slot) => nodes[slot])
        .sort((a, b) => (String(a) < String(b) ? -1 : 1));
      for (const [position, slot] of slots.entries()) {
        nodes[slot] = sorted[position];
      }
      slots = [];
      isAfterPseudoElement = false;
    } else if (parser.isPseudoElement(node)) {
      // Pseudo-classes after a pseudo-element apply to it, so keep the order
      isAfterPseudoElement = true;
    } else if (!isAfterPseudoElement && sortableTypes.has(node.type)) {
      slots.push(index);
    }
  }
}

// Pseudo-classes whose argument is a selector list where order and repeats do
// not change what matches
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
 * @param {Object} selectors - postcss selector root
 */
function normalizePseudos(selectors) {
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
    pseudo.nodes = [...unique.keys()].sort().map((key) => unique.get(key));
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
 * Compare value nodes by kind, unit and name, ignoring numbers, spaces and
 * comments, the way stylelint compares value syntaxes.
 * @param {Object[]} first - postcss-value-parser nodes
 * @param {Object[]} second - postcss-value-parser nodes
 * @return {boolean} whether both lists have the same syntax
 */
function isSameSyntax(first, second) {
  const isSignificant = ({ type }) => type !== 'space' && type !== 'comment';
  const firstNodes = first.filter(isSignificant);
  const secondNodes = second.filter(isSignificant);
  return (
    firstNodes.length === secondNodes.length &&
    firstNodes.every((node, index) => {
      const other = secondNodes[index];
      if (node.type !== other.type) return false;
      if (node.type === 'word') {
        return getWordShape(node.value) === getWordShape(other.value);
      }
      if (node.type === 'function') {
        return (
          node.value.toLowerCase() === other.value.toLowerCase() &&
          isSameSyntax(node.nodes, other.nodes)
        );
      }
      if (node.type === 'div') return node.value === other.value;
      // A Less escape such as ~"calc(1px)" holds value text, so compare that
      if (node.type === 'string' && firstNodes[index - 1]?.value === '~') {
        return isSameSyntax(
          valueParser(node.value).nodes,
          valueParser(other.value).nodes,
        );
      }
      return true;
    })
  );
}

/**
 * Remove declarations that a later declaration of the same property overrides.
 * @param {Object} rule - postcss rule node
 * @param {false|true|'syntax'} mode - false removes any earlier declaration,
 * true only one with an equal value, 'syntax' also one with the same syntax
 */
function removeDupProperties(rule, mode) {
  const kept = [];
  for (const declaration of rule.nodes.filter(({ type }) => type === 'decl')) {
    const index = kept.findIndex(
      (earlier) =>
        earlier.prop === declaration.prop &&
        (!mode ||
          earlier.value === declaration.value ||
          (mode === 'syntax' &&
            isSameSyntax(
              valueParser(earlier.value).nodes,
              valueParser(declaration.value).nodes,
            ))),
    );
    if (index === -1) {
      kept.push(declaration);
    } else if (kept[index].important && !declaration.important) {
      // An !important declaration wins over a later one without it
      declaration.remove();
    } else {
      kept[index].remove();
      kept[index] = declaration;
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
  return parser((selectors) => {
    for (const [index, node] of [...selectors.nodes].entries()) {
      if (keys.indexOf(keys[index]) < index) node.remove();
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
      node.nodes = [{ type: 'word', value: joinSelectorKeys(keys) }];
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
 * @param {Object} atRule - postcss at-rule node
 * @return {string} the same step for blocks whose rules may merge
 */
function getAtRuleStep(atRule) {
  const name = atRule.name.toLowerCase();
  const step = `@${name} ${normalizeParams(atRule.params)}`;
  return mergeableAtRules.has(name) ? step : `${step} #${++lastBlockId}`;
}

/**
 * Describe every ancestor of a rule, from the root down, as one string.
 * @param {Object} rule - postcss rule node
 * @param {WeakMap<Object, string>} stepCache - steps already computed per node
 * @return {string} key shared by rules in the same nesting context
 */
function getContextKey(rule, stepCache) {
  const steps = [];
  for (let node = rule.parent; node.type !== 'root'; node = node.parent) {
    // Re-parsing ancestor selectors for every nested rule tripled run time
    if (!stepCache.has(node)) {
      stepCache.set(
        node,
        node.type === 'atrule'
          ? getAtRuleStep(node)
          : joinSelectorKeys(
              getSelectorKeys.transformSync(node.selector, { lossless: false }),
            ),
      );
    }
    steps.unshift(stepCache.get(node));
  }
  return JSON.stringify(steps);
}

const defaultOptions = {
  removeDuplicatedProperties: false,
};

const valueModes = new Set([undefined, null, false, true, 'syntax']);

const plugin = (options) => {
  options = Object.assign({}, defaultOptions, options);
  if (!valueModes.has(options.removeDuplicatedValues)) {
    throw new TypeError(
      `${name}: removeDuplicatedValues must be false, true or 'syntax', not ${JSON.stringify(options.removeDuplicatedValues)}`,
    );
  }
  return {
    postcssPlugin: name,
    prepare() {
      // Map each nesting context to the rules seen in it
      const mapTable = new Map();
      const stepCache = new WeakMap();

      return {
        Rule: (rule) => {
          const keys = getSelectorKeys.transformSync(rule.selector, {
            lossless: false,
          });
          // postcss-selector-parser cannot read the // comments that
          // postcss-scss keeps in raws.selector.scss, so leave those lists
          if (
            new Set(keys).size < keys.length &&
            rule.raws.selector?.scss === undefined
          ) {
            // PostCSS keeps a selector's comments only in raws.selector.raw
            const raws = rule.raws.selector;
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
          const map = mapTable.has(context)
            ? mapTable.get(context)
            : mapTable.set(context, new Map()).get(context);

          const selector = joinSelectorKeys(keys);

          if (map.has(selector)) {
            // store original rule as destination
            const destination = map.get(selector);

            // check if node has already been processed
            if (destination === rule) return;

            // move declarations to original rule
            while (rule.nodes.length > 0) {
              destination.append(rule.nodes[0]);
            }

            // store the original rule parent before removal in case it or
            // its ancestors become empty as a result of the removal
            let emptied = rule.parent;

            // remove duplicated rule
            rule.remove();

            // Moving the rule can leave its wrappers empty, such as a second
            // @media block or a nesting parent. Remove each one, walking up.
            while (emptied.type !== 'root' && emptied.nodes.length === 0) {
              const parent = emptied.parent;
              emptied.remove();
              emptied = parent;
            }

            if (
              options.removeDuplicatedProperties ||
              options.removeDuplicatedValues
            ) {
              removeDupProperties(destination, options.removeDuplicatedValues);
            }
          } else {
            if (
              options.removeDuplicatedProperties ||
              options.removeDuplicatedValues
            ) {
              removeDupProperties(rule, options.removeDuplicatedValues);
            }
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
