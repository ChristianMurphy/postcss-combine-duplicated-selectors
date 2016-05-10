import postcss from 'postcss';
import parser from 'postcss-selector-parser';

export default postcss.plugin('postcss-combine-duplicated-selectors', (options = {}) => {
  return css => {
    // generate symbol table
    css.walkRules(rule => {
      parser(selectorSet).process(rule.selector);
    });
  };
});

function selectorSet (selector) {
  console.dir(selector.nodes);
}
