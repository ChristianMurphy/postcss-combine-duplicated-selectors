const {describe, it} = require('node:test');
const testFactory = require('./_test-factory');
const postcssNested = require('postcss-nested');
const postcssScss = require('postcss-scss');
const plugin = require('../src');

const nestedCSS = testFactory('nested css', [postcssNested, plugin]);
const scss = testFactory('scss', [postcssNested, plugin], postcssScss);

const cases = [
  {
    label: 'nested selectors same with classes',
    input: '.one {.two {}} .one{&.two {}}',
    expected: '.one .two {} .one.two {}',
  },
  {
    label: 'selectors with different specifity',
    input: '.one {.two {}} .one {.two {.three {}}}',
    expected: '.one .two {} .one .two .three {}',
  },
];

describe('Unique Extension Tests', () => {
  for (const {label, input, expected} of cases) {
    it(label, () => {
      nestedCSS({}, input, expected);
      scss({}, input, expected);
    });
  }
});
