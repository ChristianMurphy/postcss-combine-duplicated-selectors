import postcss from 'postcss';

export default postcss.plugin('postcss-combine-duplicated-selectors', () => {
  return css => {
    const symbolTable = new Map();

    css.walkRules(rule => {
      if (symbolTable.has(rule.selector)) {
        // move declarations to original rule
        rule.nodes.forEach(decl => decl.moveTo(symbolTable.get(rule.selector)));
        // remove duplicated rule
        rule.remove();
      } else {
        // add new selector to symbol table
        symbolTable.set(rule.selector, rule);
      }
    });
  };
});
