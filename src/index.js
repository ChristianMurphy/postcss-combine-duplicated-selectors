import postcss from 'postcss';

export default postcss.plugin('postcss-combine-duplicated-selectors', () => {
  return css => {
    const selectors = new Map();

    // selector set
    css.walkRules(rule => {
      if (!selectors.has(rule.selector)) {
        selectors.set(rule.selector, rule);
      }
    });

    // remove duplicates
    css.walkRules(rule => {
      if (selectors.get(rule.selector) !== rule) {
        rule.nodes.forEach(decl => decl.moveTo(selectors.get(rule.selector)));
        rule.remove();
      }
    });
  };
});
