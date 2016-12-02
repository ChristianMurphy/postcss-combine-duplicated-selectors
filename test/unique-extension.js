import test from 'ava';
import testFactory from './_test-factory';
import postcssNested from 'postcss-nested';
import postcssLess from 'postcss-less';
import postcssScss from 'postcss-scss';
import plugin from '../dist';

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
