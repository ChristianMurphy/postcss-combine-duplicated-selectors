import test from 'ava';
import testFactory from './_test-factory';
import postcssNested from 'postcss-nested';
import postcssLess from 'postcss-less';
import postcssScss from 'postcss-scss';
import plugin from '../dist';

/**
 * These tests check css selectors that the plugin CAN combine together.
 * Meaning selectors provided are logically the same.
 * These tests check only standard css syntax.
 */

const css = testFactory('css', [plugin]);
const nestedCSS = testFactory('nested css', [postcssNested, plugin]);
const less = testFactory('less', [plugin], postcssLess);
const scss = testFactory('scss', [plugin], postcssScss);

test(
  'class',
  [css, nestedCSS, less, scss],
  '.module {} .module {}',
  '.module {}'
);

test(
  'id',
  [css, nestedCSS, less, scss],
  '#one {} #one {}',
  '#one {}'
);

test(
  'tag',
  [css, nestedCSS, less, scss],
  'a {} a {}',
  'a {}'
);

test(
  'universal',
  [css, nestedCSS, less, scss],
  '* {} * {}',
  '* {}'
);

test(
  'classes with " " combinator',
  [css, nestedCSS, less, scss],
  '.one .two {} .one .two {}',
  '.one .two {}'
);

test(
  'classes with ">" combinator',
  [css, nestedCSS, less, scss],
  '.one>.two {} .one > .two {}',
  '.one>.two {}'
);

test(
  'classes with "+" combinator',
  [css, nestedCSS, less, scss],
  '.one+.two {} .one + .two {}',
  '.one+.two {}'
);

test(
  'classes with "~" combinator',
  [css, nestedCSS, less, scss],
  '.one~.two {} .one ~ .two {}',
  '.one~.two {}'
);

test(
  'ids with " " combinator',
  [css, nestedCSS, less, scss],
  '#one #two {} #one #two {}',
  '#one #two {}'
);

test(
  'ids with ">" combinator',
  [css, nestedCSS, less, scss],
  '#one>#two {} #one > #two {}',
  '#one>#two {}'
);

test(
  'ids with "+" combinator',
  [css, nestedCSS, less, scss],
  '#one+#two {} #one + #two {}',
  '#one+#two {}'
);

test(
  'ids with "~" combinator',
  [css, nestedCSS, less, scss],
  '#one~#two {} #one ~ #two {}',
  '#one~#two {}'
);

test(
  'tags with " " combinator',
  [css, nestedCSS, less, scss],
  'a b {} a  b {}',
  'a b {}'
);

test(
  'tags with ">" combinator',
  [css, nestedCSS, less, scss],
  'a>b {} a > b {}',
  'a>b {}'
);

test(
  'tags with "+" combinator',
  [css, nestedCSS, less, scss],
  'a+b {} a + b {}',
  'a+b {}'
);

test(
  'tags with "~" combinator',
  [css, nestedCSS, less, scss],
  'a~b {} a ~ b {}',
  'a~b {}'
);

test(
  'universals with " " combinator',
  [css, nestedCSS, less, scss],
  '* * {} *  * {}',
  '* * {}'
);

test(
  'universals with ">" combinator',
  [css, nestedCSS, less, scss],
  '*>* {} * > * {}',
  '*>* {}'
);

test(
  'universals with "+" combinator',
  [css, nestedCSS, less, scss],
  '*+* {} * + * {}',
  '*+* {}'
);

test(
  'universals with "~" combinator',
  [css, nestedCSS, less, scss],
  '*~* {} * ~ * {}',
  '*~* {}'
);

test(
  'class with declarations',
  [css, nestedCSS, less, scss],
  '.module {color: green} .module {background: red}',
  '.module {color: green;background: red}'
);

test(
  'id with declarations',
  [css, nestedCSS, less, scss],
  '#one {color: green} #one {background: red}',
  '#one {color: green;background: red}'
);

test(
  'tag with declarations',
  [css, nestedCSS, less, scss],
  'a {color: green} a {background: red}',
  'a {color: green;background: red}'
);

test(
  'universal with declarations',
  [css, nestedCSS, less, scss],
  '* {color: green} * {background: red}',
  '* {color: green;background: red}'
);

test(
  'classes with different spacing and declarations',
  [css, nestedCSS, less, scss],
  '.one .two {color: green} .one  .two {background: red}',
  '.one .two {color: green;background: red}'
);

test(
  'ids with different spacing and declarations',
  [css, nestedCSS, less, scss],
  '#one #two {color: green} #one  #two {background: red}',
  '#one #two {color: green;background: red}'
);

test(
  'tags with different spacing and declarations',
  [css, nestedCSS, less, scss],
  'a b {color: green} a  b {background: red}',
  'a b {color: green;background: red}'
);

test(
  'universals with different spacing and declarations',
  [css, nestedCSS, less, scss],
  '* * {color: green} *  * {background: red}',
  '* * {color: green;background: red}'
);

test(
  'selectors with multiple properties',
  [css, nestedCSS, less, scss],
  '.a {color: black; height: 10px} .a {background-color: red; width: 20px}',
  '.a {color: black; height: 10px; background-color: red; width: 20px}'
);

test(
  'attribute selectors',
  [css, nestedCSS, less, scss],
  '.a[href] {} .a[href] {}',
  '.a[href] {}'
);

test(
  'attribute property selectors with different spacing',
  [css, nestedCSS, less, scss],
  '.a[href="a"] {} .a[href = "a"] {}',
  '.a[href="a"] {}'
);

test(
  'attribute property selectors with different quoting',
  [css, nestedCSS, less, scss],
  '.a[href="a"] {} .a[href=a] {}',
  '.a[href="a"] {}'
);

test(
  'attribute property selectors with different quote marks',
  [css, nestedCSS, less, scss],
  '.a[href="a"] {} .a[href=\'a\'] {}',
  '.a[href="a"] {}'
);

test(
  'attribute selectors with different spacing',
  [css, nestedCSS, less, scss],
  '.a[href] {} .a[ href ] {}',
  '.a[href] {}'
);

test(
  'pseudo classes',
  [css, nestedCSS, less, scss],
  'a:link {} a:link {}',
  'a:link {}'
);

test(
  'pseudo elements',
  [css, nestedCSS, less, scss],
  'p::first-line {} p::first-line {}',
  'p::first-line {}'
);

test(
  'selectors with different order',
  [css, nestedCSS, less, scss],
  '.one.two {} .two.one {}',
  '.one.two {}'
);
