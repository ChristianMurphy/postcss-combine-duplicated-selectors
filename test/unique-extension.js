import test from 'ava';
import postcss from 'postcss';
import postcssNested from 'postcss-nested';
import postcssLess from 'postcss-less';
import postcssScss from 'postcss-scss';
import plugin from '../dist';

/**
 * These tests check css selectors that the plugin CANNOT combined together.
 * Meaning that the selectors provided are unique.
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
  'nested selectors same with classes',
  [nestedCSS, less, scss],
  '.one {.two {}} .one{&.two {}}',
  '.one .two {} .one.two {}'
);
