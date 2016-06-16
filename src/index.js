import postcss from 'postcss';
import parser from 'postcss-selector-parser';

const uniformStyle = parser(selector => {
  selector.walkCombinators(node => {
    node.value = node.value.trim().concat(' ');
    node.spaces = {};
  });
});

export default postcss.plugin('postcss-combine-duplicated-selectors', () => {
  return css => {
    const symbolTable = new Map();

    css.walkRules(rule => {
      const selector = uniformStyle.process(rule.selector).result;
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
