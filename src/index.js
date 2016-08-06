import postcss from 'postcss';
import parser from 'postcss-selector-parser';

function normalizeAttributes(selector) {
  selector.walkAttributes(node => {
    if (node.value) {
      // remove quotes
      node.value = node.value.replace(/'|\\'|"|\\"/g, '');
    }
  });
}

function sortGroups(selector) {
  selector.each(subSelector => {
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

const uniformStyle = parser(
  selector => {
    normalizeAttributes(selector);
    sortGroups(selector);
  }
);

export default postcss.plugin('postcss-combine-duplicated-selectors', () => {
  return css => {
    const symbolTable = new Map();

    css.walkRules(rule => {
      const selector = uniformStyle.process(rule.selector, {lossless: false}).result;
      if (symbolTable.has(selector)) {
        // store original rule as destination
        const destination = symbolTable.get(selector);
        // move declarations to original rule
        while (rule.nodes.length > 0) {
          rule.nodes[0].moveTo(destination);
        }
        // remove duplicated rule
        rule.remove();
      } else {
        // add new selector to symbol table
        symbolTable.set(selector, rule);
      }
    });
  };
});
