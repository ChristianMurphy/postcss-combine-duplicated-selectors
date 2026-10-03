import { describe, it } from 'node:test';
import testFactory from './_test-factory.js';
import postcssNested from 'postcss-nested';
import postcssScss from 'postcss-scss';
import plugin from '../src/index.js';

const nestedCSS = testFactory([postcssNested, plugin]);
const scss = testFactory([postcssNested, plugin], postcssScss);
const scssWithoutNesting = testFactory([plugin], postcssScss);

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

  it('selectors in if blocks around a variable change', () => {
    scssWithoutNesting(
      '$b: true; @if $b {.y{a:1}} $b: false; @if $b {.y{b:2}}',
      '$b: true; @if $b {.y{a:1}} $b: false; @if $b {.y{b:2}}',
    );
  });

  it('interpolated values with different units in syntax mode', () => {
    testFactory([plugin({ removeDuplicatedValues: 'syntax' })], postcssScss)(
      '.a{width:#{$a}px;width:#{$b}rem;color:#fff;color:#{$c}}',
      '.a{width:#{$a}px;width:#{$b}rem;color:#fff;color:#{$c}}',
    );
  });

  it('pseudo classes built from variables with different case', () => {
    scssWithoutNesting(
      '.a:#{$State}{x:1} .a:#{$state}{y:2}',
      '.a:#{$State}{x:1} .a:#{$state}{y:2}',
    );
  });

  it('repeated selectors in a group with an inline comment', () => {
    scssWithoutNesting('.a, // c\n.b, .a{x:1}', '.a, // c\n.b, .a{x:1}');
  });

  it('nesting selectors whose suffix and class run together', () => {
    scssWithoutNesting(
      '.p{ &.is-active__el, &__el.is-active{x:1} }',
      '.p{ &.is-active__el, &__el.is-active{x:1} }',
    );
  });
});
