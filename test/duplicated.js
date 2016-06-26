import test from 'ava';
import postcss from 'postcss';
import postcssNested from 'postcss-nested';
import plugin from '../dist';

/**
 * These tests check css selectors that the plugin CAN combine together
 * Meaning selectors provided are logically the same.
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
  '.module {} .module {}',
  '.module {}'
);

test(
  'id',
  [processCSS, processNestedCSS],
  '#one {} #one {}',
  '#one {}'
);

test(
  'tag',
  [processCSS, processNestedCSS],
  'a {} a {}',
  'a {}'
);

test(
  'universal',
  [processCSS, processNestedCSS],
  '* {} * {}',
  '* {}'
);

test(
  'classes with " " combinator',
  [processCSS, processNestedCSS],
  '.one .two {} .one .two {}',
  '.one .two {}'
);

test(
  'classes with ">" combinator',
  [processCSS, processNestedCSS],
  '.one>.two {} .one > .two {}',
  '.one>.two {}'
);

test(
  'classes with "+" combinator',
  [processCSS, processNestedCSS],
  '.one+.two {} .one + .two {}',
  '.one+.two {}'
);

test(
  'classes with "~" combinator',
  [processCSS, processNestedCSS],
  '.one~.two {} .one ~ .two {}',
  '.one~.two {}'
);

test(
  'ids with " " combinator',
  [processCSS, processNestedCSS],
  '#one #two {} #one #two {}',
  '#one #two {}'
);

test(
  'ids with ">" combinator',
  [processCSS, processNestedCSS],
  '#one>#two {} #one > #two {}',
  '#one>#two {}'
);

test(
  'ids with "+" combinator',
  [processCSS, processNestedCSS],
  '#one+#two {} #one + #two {}',
  '#one+#two {}'
);

test(
  'ids with "~" combinator',
  [processCSS, processNestedCSS],
  '#one~#two {} #one ~ #two {}',
  '#one~#two {}'
);

test(
  'tags with " " combinator',
  [processCSS, processNestedCSS],
  'a b {} a  b {}',
  'a b {}'
);

test(
  'tags with ">" combinator',
  [processCSS, processNestedCSS],
  'a>b {} a > b {}',
  'a>b {}'
);

test(
  'tags with "+" combinator',
  [processCSS, processNestedCSS],
  'a+b {} a + b {}',
  'a+b {}'
);

test(
  'tags with "~" combinator',
  [processCSS, processNestedCSS],
  'a~b {} a ~ b {}',
  'a~b {}'
);

test(
  'universals with " " combinator',
  [processCSS, processNestedCSS],
  '* * {} *  * {}',
  '* * {}'
);

test(
  'universals with ">" combinator',
  [processCSS, processNestedCSS],
  '*>* {} * > * {}',
  '*>* {}'
);

test(
  'universals with "+" combinator',
  [processCSS, processNestedCSS],
  '*+* {} * + * {}',
  '*+* {}'
);

test(
  'universals with "~" combinator',
  [processCSS, processNestedCSS],
  '*~* {} * ~ * {}',
  '*~* {}'
);

test(
  'class with declarations',
  [processCSS, processNestedCSS],
  '.module {color: green} .module {background: red}',
  '.module {color: green;background: red}'
);

test(
  'id with declarations',
  [processCSS, processNestedCSS],
  '#one {color: green} #one {background: red}',
  '#one {color: green;background: red}'
);

test(
  'tag with declarations',
  [processCSS, processNestedCSS],
  'a {color: green} a {background: red}',
  'a {color: green;background: red}'
);

test(
  'universal with declarations',
  [processCSS, processNestedCSS],
  '* {color: green} * {background: red}',
  '* {color: green;background: red}'
);

test(
  'classes with different spacing and declarations',
  [processCSS, processNestedCSS],
  '.one .two {color: green} .one  .two {background: red}',
  '.one .two {color: green;background: red}'
);

test(
  'ids with different spacing and declarations',
  [processCSS, processNestedCSS],
  '#one #two {color: green} #one  #two {background: red}',
  '#one #two {color: green;background: red}'
);

test(
  'tags with different spacing and declarations',
  [processCSS, processNestedCSS],
  'a b {color: green} a  b {background: red}',
  'a b {color: green;background: red}'
);

test(
  'universals with different spacing and declarations',
  [processCSS, processNestedCSS],
  '* * {color: green} *  * {background: red}',
  '* * {color: green;background: red}'
);

test(
  'nested class selectors',
  processNestedCSS,
  '.one.two {color: green} .one {&.two {background: red}}',
  '.one.two {color: green;background: red}'
);

test(
  'nested class selectors with  " " combinator',
  processNestedCSS,
  '.one .two {color: green} .one {.two {background: red}}',
  '.one .two {color: green;background: red}'
);

test(
  'reordered nested selectors',
  processNestedCSS,
  '.one.two {} .two { .one& {} }',
  '.one.two {}'
);

test(
  'multi-level nested selectors',
  processNestedCSS,
  '.one .two .three {} .one { .two { .three {} } }',
  '.one .two .three {}'
);

test(
  'selectors with multiple properties',
  [processCSS, processNestedCSS],
  '.a {color: black; height: 10px} .a {background-color: red; width: 20px}',
  '.a {color: black; height: 10px; background-color: red; width: 20px}'
);

test(
  'attribute selectors',
  [processCSS, processNestedCSS],
  '.a[href] {} .a[href] {}',
  '.a[href] {}'
);

test(
  'attribute property selectors with different spacing',
  [processCSS, processNestedCSS],
  '.a[href="a"] {} .a[href = "a"] {}',
  '.a[href="a"] {}'
);

test(
  'attribute property selectors with different quoting',
  [processCSS, processNestedCSS],
  '.a[href="a"] {} .a[href=a] {}',
  '.a[href="a"] {}'
);

test(
  'attribute property selectors with different quote marks',
  [processCSS, processNestedCSS],
  '.a[href="a"] {} .a[href=\'a\'] {}',
  '.a[href="a"] {}'
);

test(
  'attribute selectors with different spacing',
  [processCSS, processNestedCSS],
  '.a[href] {} .a[ href ] {}',
  '.a[href] {}'
);

test(
  'pseudo classes',
  [processCSS, processNestedCSS],
  'a:link {} a:link {}',
  'a:link {}'
);

test(
  'pseudo elements',
  [processCSS, processNestedCSS],
  'p::first-line {} p::first-line {}',
  'p::first-line {}'
);

test(
  'selectors with different order',
  [processCSS, processNestedCSS],
  '.one.two {} .two.one {}',
  '.one.two {}'
);

test(
  'nested selectors with different order',
  processNestedCSS,
  '.one {&.two {}} .two{&.one {}}',
  '.one.two {}'
);

test(
  'nested and un-nested selectors with different order',
  processNestedCSS,
  '.one.two {} .two{&.one {}}',
  '.one.two {}'
);
