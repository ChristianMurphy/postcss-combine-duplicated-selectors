import postcss from 'postcss';

export default postcss.plugin('postcss-combine-duplicated-selectors', () => {
  return css => {
    const selectorSet = new Set();

    // selector set
    css.walkRules(rule => {
      selectorSet.add(rule.selector);
    });

    // remove duplicates
    css.walkRules(rule => {
      if (selectorSet.has(rule.selector)) {
        selectorSet.delete(rule.selector);
      } else {
        rule.remove();
      }
    });
  };
});
