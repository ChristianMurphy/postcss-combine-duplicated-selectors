import test from 'ava';
import postcss from 'postcss';
import postcssNested from 'postcss-nested';
import plugin from '../dist';

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
  'unique class',
  [processCSS, processNestedCSS],
  '.module {}',
  '.module {}'
);

test(
  'unique id',
  [processCSS, processNestedCSS],
  '#one {}',
  '#one {}'
);

test(
  'unique tag',
  [processCSS, processNestedCSS],
  'a {}',
  'a {}'
);

test(
  'unique universal',
  [processCSS, processNestedCSS],
  '* {}',
  '* {}'
);

test(
  'unique classes',
  [processCSS, processNestedCSS],
  '.one {} .two {}',
  '.one {} .two {}'
);

test(
  'unique ids',
  [processCSS, processNestedCSS],
  '#one {} #two {}',
  '#one {} #two {}'
);

test(
  'unique tags',
  [processCSS, processNestedCSS],
  'a {} b {}',
  'a {} b {}'
);

test(
  'unique universals',
  [processCSS, processNestedCSS],
  '* a {} * b {}',
  '* a {} * b {}'
);

test(
  'unique combinations of classes',
  [processCSS, processNestedCSS],
  '.one.two {} .one .two {}',
  '.one.two {} .one .two {}'
);

test(
  'unique combinations of ids',
  [processCSS, processNestedCSS],
  '#one#two {} #one #two {}',
  '#one#two {} #one #two {}'
);

test(
  'unique attribute selectors',
  [processCSS, processNestedCSS],
  '.a[href] {} .a[title] {}',
  '.a[href] {} .a[title] {}'
);

test(
  'attribute property selectors with unique values',
  [processCSS, processNestedCSS],
  '.a[href="a"] {} .a[href="b"] {}',
  '.a[href="a"] {} .a[href="b"] {}'
);

test(
  'unique selectors with same attribute',
  [processCSS, processNestedCSS],
  '.a [href] {} .a[href] {}',
  '.a [href] {} .a[href] {}'
);

test(
  'unique pseudo classes',
  [processCSS, processNestedCSS],
  'a:link {} a:visited {}',
  'a:link {} a:visited {}'
);

test(
  'unique pseudo elements',
  [processCSS, processNestedCSS],
  'p::first-line {} p::last-line {}',
  'p::first-line {} p::last-line {}'
);

test(
  'unique selectors same classes',
  [processCSS, processNestedCSS],
  '.one .two {} .one.two {}',
  '.one .two {} .one.two {}'
);

test(
  'unique nested selectors same classes',
  processNestedCSS,
  '.one {.two {}} .one{&.two {}}',
  '.one .two {} .one.two {}'
);

test(
  'unique selectors with duplicated subselectors',
  [processCSS, processNestedCSS],
  '.one.two {} .one.two.three {}',
  '.one.two {} .one.two.three {}'
);
