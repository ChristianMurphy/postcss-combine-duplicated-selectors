import test from 'ava';
import testFactory from './_test-factory';
import postcssNested from 'postcss-nested';
import postcssLess from 'postcss-less';
import postcssScss from 'postcss-scss';
import plugin from '../dist';

/**
 * These tests check selectors that the plugin CAN combine together.
 * Meaning selectors provided are logically the same.
 * These tests check against css super set languages: less, sass, and postcss-nested.
 */

const nestedCSS = testFactory('nested css', [postcssNested, plugin]);
const less = testFactory('less', [postcssNested, plugin], postcssLess);
const scss = testFactory('scss', [postcssNested, plugin], postcssScss);

test(
  'nested class selectors',
  [nestedCSS, less, scss],
  '.one.two {color: green} .one {&.two {background: red}}',
  '.one.two {color: green;background: red}'
);

test(
  'nested class selectors with  " " combinator',
  [nestedCSS, less, scss],
  '.one .two {color: green} .one {.two {background: red}}',
  '.one .two {color: green;background: red}'
);

test(
  'reordered nested selectors',
  [nestedCSS, less, scss],
  '.one.two {} .two { .one& {} }',
  '.one.two {}'
);

test(
  'multi-level nested selectors',
  [nestedCSS, less, scss],
  '.one .two .three {} .one { .two { .three {} } }',
  '.one .two .three {}'
);

test(
  'nested selectors with different order',
  [nestedCSS, less, scss],
  '.one {&.two {}} .two{&.one {}}',
  '.one.two {}'
);

test(
  'nested and un-nested selectors with different order',
  [nestedCSS, less, scss],
  '.one.two {} .two{&.one {}}',
  '.one.two {}'
);
