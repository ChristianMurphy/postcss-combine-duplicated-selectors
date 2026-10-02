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
      // remove quotes
      node.value = node.value.replace(/'|\\'|"|\\"/g, '');
    }
  });
}

/**
 * Sort class and id groups alphabetically
 * @param {Object} selector - postcss selector node
 */
function sortGroups(selector) {
  selector.each((subSelector) => {
    subSelector.nodes.sort((a, b) => {
      // different types cannot be sorted
      if (a.type !== b.type) {
        return 0;
      }

      // sort alphabetically
      return a.value < b.value ? -1 : 1;
    });
  });

  selector.sort((a, b) => (a.nodes.join('') < b.nodes.join('') ? -1 : 1));
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

const uniformStyle = parser((selector) => {
  normalizeAttributes(selector);
  sortGroups(selector);
});

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
      const selector = uniformStyle.processSync(
        valueParser.stringify(node.nodes),
        {
          lossless: false,
        },
      );
      node.nodes = [{ type: 'word', value: selector }];
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
          : uniformStyle.processSync(node.selector, { lossless: false }),
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
          // Rules only combine when every ancestor at-rule and rule matches
          const context = getContextKey(rule, stepCache);
          const map = mapTable.has(context)
            ? mapTable.get(context)
            : mapTable.set(context, new Map()).get(context);

          // create a uniform selector
          const selector = uniformStyle.processSync(rule.selector, {
            lossless: false,
          });

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
