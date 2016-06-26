import test from 'ava';
import postcss from 'postcss';
import postcssNested from 'postcss-nested';
import plugin from '../dist';

/**
 * These tests check css selectors that the plugin CANNOT combined together.
 * Meaning that the selectors provided are unique.
 * These tests check only standard css syntax.
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

const css = testFactory([plugin]);
const nestedCSS = testFactory([postcssNested, plugin]);

css.title = titleFactory('css');
nestedCSS.title = titleFactory('nested css');

test(
  'class',
  [css, nestedCSS],
  '.module {}',
  '.module {}'
);

test(
  'id',
  [css, nestedCSS],
  '#one {}',
  '#one {}'
);

test(
  'tag',
  [css, nestedCSS],
  'a {}',
  'a {}'
);

test(
  'universal',
  [css, nestedCSS],
  '* {}',
  '* {}'
);

test(
  'classes',
  [css, nestedCSS],
  '.one {} .two {}',
  '.one {} .two {}'
);

test(
  'ids',
  [css, nestedCSS],
  '#one {} #two {}',
  '#one {} #two {}'
);

test(
  'tags',
  [css, nestedCSS],
  'a {} b {}',
  'a {} b {}'
);

test(
  'universals',
  [css, nestedCSS],
  '* a {} * b {}',
  '* a {} * b {}'
);

test(
  'combinations of classes',
  [css, nestedCSS],
  '.one.two {} .one .two {}',
  '.one.two {} .one .two {}'
);

test(
  'combinations of ids',
  [css, nestedCSS],
  '#one#two {} #one #two {}',
  '#one#two {} #one #two {}'
);

test(
  'attribute selectors',
  [css, nestedCSS],
  '.a[href] {} .a[title] {}',
  '.a[href] {} .a[title] {}'
);

test(
  'selectors with same attribute property and unique values',
  [css, nestedCSS],
  '.a[href="a"] {} .a[href="b"] {}',
  '.a[href="a"] {} .a[href="b"] {}'
);

test(
  'selectors with same attribute',
  [css, nestedCSS],
  '.a [href] {} .a[href] {}',
  '.a [href] {} .a[href] {}'
);

test(
  'pseudo classes',
  [css, nestedCSS],
  'a:link {} a:visited {}',
  'a:link {} a:visited {}'
);

test(
  'pseudo elements',
  [css, nestedCSS],
  'p::first-line {} p::last-line {}',
  'p::first-line {} p::last-line {}'
);

test(
  'selectors same classes',
  [css, nestedCSS],
  '.one .two {} .one.two {}',
  '.one .two {} .one.two {}'
);

test(
  'selectors with partial class selector match',
  [css, nestedCSS],
  '.one.two {} .one.two.three {}',
  '.one.two {} .one.two.three {}'
);
