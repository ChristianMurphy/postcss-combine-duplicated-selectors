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
 * Normalize the selector lists inside pseudo-class arguments.
 * @param {Object} selectors - postcss selector root
 */
function sortPseudoArguments(selectors) {
  const pseudos = [];
  selectors.walkPseudos((pseudo) => {
    if (listPseudos.has(pseudo.value.toLowerCase())) pseudos.push(pseudo);
  });
  // The walk lists outer pseudo-classes first; inner ones must sort first
  for (const pseudo of pseudos.reverse()) {
    pseudo.each(sortCompounds);
    const unique = new Map(pseudo.nodes.map((node) => [String(node), node]));
    pseudo.nodes = [...unique.keys()].sort().map((key) => unique.get(key));
  }
}

/**
 * Remove duplicated properties
 * @param {Object} selector - postcss selector node
 * @param {Boolean} exact
 */
function removeDupProperties(selector, exact) {
  // Remove duplicated properties from bottom to top ()
  for (let actIndex = selector.nodes.length - 1; actIndex >= 1; actIndex--) {
    for (let befIndex = actIndex - 1; befIndex >= 0; befIndex--) {
      if (selector.nodes[actIndex].prop === selector.nodes[befIndex].prop) {
        if (
          !exact ||
          (exact &&
            selector.nodes[actIndex].value === selector.nodes[befIndex].value)
        ) {
          selector.nodes[befIndex].remove();
          actIndex--;
        }
      }
    }
  }
}

// Normalize each selector in a list, so selectors that match the same
// elements read the same
const getSelectorKeys = parser((selectors) => {
  normalizeAttributes(selectors);
  sortPseudoArguments(selectors);
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
          ? `@${node.name.toLowerCase()} ${normalizeParams(node.params)}`
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

const plugin = (options) => {
  options = Object.assign({}, defaultOptions, options);
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

            // on removal of the node, the parent atrule could have no
            // declarations associated. This is an issue for @keyframes that
            // interpret @keyframes <name> {} as overwriting existing keyframe
            // transitions. Nested wrappers can empty in turn, so walk up.
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
