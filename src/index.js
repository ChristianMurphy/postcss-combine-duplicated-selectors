import * as postcss from 'postcss';

export default postcss.plugin('create-nested-groups', (options = {}) => {
    return css => {
        // generate symbol table
        css.walkRules(rule => {
            // TODO generate table
        });
    };
});
