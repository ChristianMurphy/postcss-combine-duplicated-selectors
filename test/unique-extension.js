const test = require('ava');
const testFactory = require('./_test-factory');
const postcssNested = require('postcss-nested');
const postcssLess = require('postcss-less');
const postcssScss = require('postcss-scss');
const plugin = require('../src');

/**
 * These tests check css selectors that the plugin CANNOT combined together.
 * Meaning that the selectors provided are unique.
 * These tests check against css super set languages:
 * less, sass, and postcss-nested.
 */

const nestedCSS = testFactory('nested css', [postcssNested, plugin]);
const less = testFactory('less', [postcssNested, plugin], postcssLess);
const scss = testFactory('scss', [postcssNested, plugin], postcssScss);

test(
  'nested selectors same with classes',
  [nestedCSS, less, scss],
  '.one {.two {}} .one{&.two {}}',
  '.one .two {} .one.two {}'
);

test(
  'selectors with different specifity',
  [nestedCSS, less, scss],
  '.one {.two {}} .one {.two {.three {}}}',
  '.one .two {} .one .two .three {}'
);
