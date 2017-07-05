const postcss = require('postcss');
const parser = require('postcss-selector-parser');

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
}

/**
 * Remove duplicated properties
 * @param {Object} selector - postcss selector node
 */
function removeDupProperties(selector) {
  // Remove duplicated properties from bottom to top
  for (let actualNodeIndex = selector.nodes.length - 1; actualNodeIndex >= 1; actualNodeIndex--) {
    for (let beforeNodeIndex = actualNodeIndex - 1; beforeNodeIndex >= 0; beforeNodeIndex--) {
      if (selector.nodes[actualNodeIndex].prop === selector.nodes[beforeNodeIndex].prop) {
        selector.nodes[beforeNodeIndex].remove();
        actualNodeIndex--;
      }
    }
  }
}

const uniformStyle = parser(
  (selector) => {
    normalizeAttributes(selector);
    sortGroups(selector);
  }
);

module.exports = postcss.plugin('postcss-combine-duplicated-selectors', ({
  removeDuplicatedProperties = true
}) => {

  return (css) => {
    // Create a map to store maps
    const mapTable = new Map();
    // root map to store root selectors
    mapTable.set('root', new Map());

    css.walkRules((rule) => {
      let map;
      // Check selector parent for any at rule
      if (rule.parent.type === 'atrule') {
        // Use the query params as the key
        const query = rule.parent.params.replace(/\s+/g, '');
        // See if this query key is already in the map table
        map = mapTable.has(query) ?
          // If it is use it
          mapTable.get(query) :
          // if not set it and get it
          mapTable.set(query, new Map()).get(query);
      } else {
        // Otherwise we are dealing with a selector in the root
        map = mapTable.get('root');
      }

      const selector = uniformStyle.process(
        rule.selector, {
          lossless: false
        }
      ).result;

      if (map.has(selector)) {
        // store original rule as destination
        const destination = map.get(selector);
        // move declarations to original rule
        while (rule.nodes.length > 0) {
          rule.nodes[0].moveTo(destination);
        }
        // remove duplicated rule
        rule.remove();

        if (removeDuplicatedProperties) {
          removeDupProperties(destination);
        }
      } else {
        if (removeDuplicatedProperties) {
          removeDupProperties(rule);
        }
        // add new selector to symbol table
        map.set(selector, rule);
      }
    });
  };
});
