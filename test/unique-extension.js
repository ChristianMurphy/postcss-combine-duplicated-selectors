import { describe, it } from 'node:test';
import testFactory from './_test-factory.js';
import postcssNested from 'postcss-nested';
import postcssScss from 'postcss-scss';
import plugin from '../src/index.js';

const nestedCSS = testFactory([postcssNested, plugin]);
const scss = testFactory([postcssNested, plugin], postcssScss);

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
  for (const { label, input, expected } of cases) {
    it(label, () => {
      nestedCSS(input, expected);
      scss(input, expected);
    });
  }
});
