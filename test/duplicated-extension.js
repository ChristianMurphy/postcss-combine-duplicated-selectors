const {describe, it} = require('node:test');
const testFactory = require('./_test-factory');
const postcssNested = require('postcss-nested');
const postcssScss = require('postcss-scss');
const plugin = require('../src');

/**
 * These tests check selectors that the plugin CAN combine together.
 * Meaning selectors provided are logically the same.
 * These tests check against css super set languages:
 * less, sass, and postcss-nested.
 */

const nestedCSS = testFactory('nested css', [postcssNested, plugin]);
const scss = testFactory('scss', [postcssNested, plugin], postcssScss);

const cases = [
  {
    label: 'nested class selectors',
    input: '.one.two {color: green} .one {&.two {background: red}}',
    expected: '.one.two {color: green;background: red}',
  },
  {
    label: 'nested class selectors with " " combinator',
    input: '.one .two {color: green} .one {.two {background: red}}',
    expected: '.one .two {color: green;background: red}',
  },
  {
    label: 'reordered nested selectors',
    input: '.one.two {} .two { .one& {} }',
    expected: '.one.two {}',
  },
  {
    label: 'multi-level nested selectors',
    input: '.one .two .three {} .one { .two { .three {} } }',
    expected: '.one .two .three {}',
  },
  {
    label: 'nested selectors with different order',
    input: '.one {&.two {}} .two{&.one {}}',
    expected: '.one.two {}',
  },
  {
    label: 'nested and un-nested selectors with different order',
    input: '.one.two {} .two{&.one {}}',
    expected: '.one.two {}',
  },
  {
    label: 'nested selector grouping',
    input: '.one {&.two, .two& {}} .one {.two&, &.two {}}',
    expected: '.one.two, .two.one {}',
  },
];

describe('Duplicated Extension Tests', () => {
  for (const {label, input, expected} of cases) {
    it(label, () => {
      nestedCSS({}, input, expected);
      scss({}, input, expected);
    });
  }
});
