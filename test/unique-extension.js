const test = require('ava');
const testFactory = require('./_test-factory');
const postcssNested = require('postcss-nested');
const postcssScss = require('postcss-scss');
const plugin = require('../src');

/**
 * These tests check css selectors that the plugin CANNOT combined together.
 * Meaning that the selectors provided are unique.
 * These tests check against css super set languages:
 * less, sass, and postcss-nested.
 */

const nestedCSS = testFactory('nested css', [postcssNested, plugin]);
const scss = testFactory('scss', [postcssNested, plugin], postcssScss);

test(
    'nested selectors same with classes',
    [nestedCSS, scss],
    '.one {.two {}} .one{&.two {}}',
    '.one .two {} .one.two {}',
);

test(
    'selectors with different specifity',
    [nestedCSS, scss],
    '.one {.two {}} .one {.two {.three {}}}',
    '.one .two {} .one .two .three {}',
);
