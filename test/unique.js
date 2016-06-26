import test from 'ava';
import postcss from 'postcss';
import postcssNested from 'postcss-nested';
import plugin from '../dist';

/**
 * These tests check css selectors that the plugin CANNOT combined together.
 * Meaning that the selectors provided are unique.
 */

function processFactory(...plugins) {
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

const processCSS = processFactory(plugin);
const processNestedCSS = processFactory(postcssNested, plugin);

processCSS.title = titleFactory('css');
processNestedCSS.title = titleFactory('nested css');

test(
  'class',
  [processCSS, processNestedCSS],
  '.module {}',
  '.module {}'
);

test(
  'id',
  [processCSS, processNestedCSS],
  '#one {}',
  '#one {}'
);

test(
  'tag',
  [processCSS, processNestedCSS],
  'a {}',
  'a {}'
);

test(
  'universal',
  [processCSS, processNestedCSS],
  '* {}',
  '* {}'
);

test(
  'classes',
  [processCSS, processNestedCSS],
  '.one {} .two {}',
  '.one {} .two {}'
);

test(
  'ids',
  [processCSS, processNestedCSS],
  '#one {} #two {}',
  '#one {} #two {}'
);

test(
  'tags',
  [processCSS, processNestedCSS],
  'a {} b {}',
  'a {} b {}'
);

test(
  'universals',
  [processCSS, processNestedCSS],
  '* a {} * b {}',
  '* a {} * b {}'
);

test(
  'combinations of classes',
  [processCSS, processNestedCSS],
  '.one.two {} .one .two {}',
  '.one.two {} .one .two {}'
);

test(
  'combinations of ids',
  [processCSS, processNestedCSS],
  '#one#two {} #one #two {}',
  '#one#two {} #one #two {}'
);

test(
  'attribute selectors',
  [processCSS, processNestedCSS],
  '.a[href] {} .a[title] {}',
  '.a[href] {} .a[title] {}'
);

test(
  'selectors with same attribute property and unique values',
  [processCSS, processNestedCSS],
  '.a[href="a"] {} .a[href="b"] {}',
  '.a[href="a"] {} .a[href="b"] {}'
);

test(
  'selectors with same attribute',
  [processCSS, processNestedCSS],
  '.a [href] {} .a[href] {}',
  '.a [href] {} .a[href] {}'
);

test(
  'pseudo classes',
  [processCSS, processNestedCSS],
  'a:link {} a:visited {}',
  'a:link {} a:visited {}'
);

test(
  'pseudo elements',
  [processCSS, processNestedCSS],
  'p::first-line {} p::last-line {}',
  'p::first-line {} p::last-line {}'
);

test(
  'selectors same classes',
  [processCSS, processNestedCSS],
  '.one .two {} .one.two {}',
  '.one .two {} .one.two {}'
);

test(
  'nested selectors same with classes',
  processNestedCSS,
  '.one {.two {}} .one{&.two {}}',
  '.one .two {} .one.two {}'
);

test(
  'selectors with partial class selector match',
  [processCSS, processNestedCSS],
  '.one.two {} .one.two.three {}',
  '.one.two {} .one.two.three {}'
);
