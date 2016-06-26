import test from 'ava';
import postcss from 'postcss';
import postcssNested from 'postcss-nested';
import postcssLess from 'postcss-less';
import postcssScss from 'postcss-scss';
import plugin from '../dist';

/**
 * These tests check selectors that the plugin CAN combine together.
 * Meaning selectors provided are logically the same.
 * These tests check against css super set languages: less, sass, and postcss-nested.
 */

function testFactory(plugins, syntax) {
  if (syntax) {
    return (t, input, expected) => {
      const actual = postcss(plugins).process(input, {syntax}).css;
      t.is(actual, expected);
    };
  }
  return (t, input, expected) => {
    const actual = postcss(plugins).process(input).css;
    t.is(actual, expected);
  };
}

function titleFactory(version) {
  return (providedTitle, input, expected) => providedTitle ?
    `${providedTitle} in ${version}` :
    `"${input}" becomes "${expected}" in ${version}`;
}

const nestedCSS = testFactory([postcssNested, plugin]);
const less = testFactory([postcssNested, plugin], postcssLess);
const scss = testFactory([postcssNested, plugin], postcssScss);

nestedCSS.title = titleFactory('nested css');
less.title = titleFactory('less');
scss.title = titleFactory('scss');

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
