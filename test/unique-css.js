import test from 'ava';
import testFactory from './_test-factory';
import postcssNested from 'postcss-nested';
import postcssLess from 'postcss-less';
import postcssScss from 'postcss-scss';
import plugin from '../dist';

/**
 * These tests check css selectors that the plugin CANNOT combined together.
 * Meaning that the selectors provided are unique.
 * These tests check only standard css syntax.
 */

const css = testFactory('css', [plugin]);
const nestedCSS = testFactory('nested css', [postcssNested, plugin]);
const less = testFactory('less', [plugin], postcssLess);
const scss = testFactory('scss', [plugin], postcssScss);

test(
  'class',
  [css, nestedCSS, less, scss],
  '.module {}',
  '.module {}'
);

test(
  'id',
  [css, nestedCSS, less, scss],
  '#one {}',
  '#one {}'
);

test(
  'tag',
  [css, nestedCSS, less, scss],
  'a {}',
  'a {}'
);

test(
  'universal',
  [css, nestedCSS, less, scss],
  '* {}',
  '* {}'
);

test(
  'classes',
  [css, nestedCSS, less, scss],
  '.one {} .two {}',
  '.one {} .two {}'
);

test(
  'ids',
  [css, nestedCSS, less, scss],
  '#one {} #two {}',
  '#one {} #two {}'
);

test(
  'tags',
  [css, nestedCSS, less, scss],
  'a {} b {}',
  'a {} b {}'
);

test(
  'universals',
  [css, nestedCSS, less, scss],
  '* a {} * b {}',
  '* a {} * b {}'
);

test(
  'combinations of classes',
  [css, nestedCSS, less, scss],
  '.one.two {} .one .two {}',
  '.one.two {} .one .two {}'
);

test(
  'combinations of ids',
  [css, nestedCSS, less, scss],
  '#one#two {} #one #two {}',
  '#one#two {} #one #two {}'
);

test(
  'attribute selectors',
  [css, nestedCSS, less, scss],
  '.a[href] {} .a[title] {}',
  '.a[href] {} .a[title] {}'
);

test(
  'selectors with same attribute property and unique values',
  [css, nestedCSS, less, scss],
  '.a[href="a"] {} .a[href="b"] {}',
  '.a[href="a"] {} .a[href="b"] {}'
);

test(
  'selectors with same attribute',
  [css, nestedCSS, less, scss],
  '.a [href] {} .a[href] {}',
  '.a [href] {} .a[href] {}'
);

test(
  'pseudo classes',
  [css, nestedCSS, less, scss],
  'a:link {} a:visited {}',
  'a:link {} a:visited {}'
);

test(
  'pseudo elements',
  [css, nestedCSS, less, scss],
  'p::first-line {} p::last-line {}',
  'p::first-line {} p::last-line {}'
);

test(
  'selectors same classes',
  [css, nestedCSS, less, scss],
  '.one .two {} .one.two {}',
  '.one .two {} .one.two {}'
);

test(
  'selectors with partial class selector match',
  [css, nestedCSS, less, scss],
  '.one.two {} .one.two.three {}',
  '.one.two {} .one.two.three {}'
);
