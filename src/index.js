import postcss from 'postcss';
import parser from 'postcss-selector-parser';

const uniformStyle = parser(selector => {
  selector.walk(node => {
    if (node.type === 'combinator') {
      node.value = node.value.trim().concat(' ');
      node.spaces = {};
    }
  });
});

export default postcss.plugin('postcss-combine-duplicated-selectors', () => {
  return css => {
    const symbolTable = new Map();

    css.walkRules(rule => {
      const selector = uniformStyle.process(rule.selector).result;
      if (symbolTable.has(selector)) {
        // move declarations to original rule
        rule.nodes.forEach(decl => decl.moveTo(symbolTable.get(selector)));
        // remove duplicated rule
        rule.remove();
      } else {
        // add new selector to symbol table
        symbolTable.set(selector, rule);
      }
    });
  };
});
