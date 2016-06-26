import test from 'ava';
import postcss from 'postcss';
import postcssNested from 'postcss-nested';
import plugin from '../dist';

/**
 * These tests check css selectors that the plugin CAN combine together.
 * Meaning selectors provided are logically the same.
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
  '.module {} .module {}',
  '.module {}'
);

test(
  'id',
  [css, nestedCSS],
  '#one {} #one {}',
  '#one {}'
);

test(
  'tag',
  [css, nestedCSS],
  'a {} a {}',
  'a {}'
);

test(
  'universal',
  [css, nestedCSS],
  '* {} * {}',
  '* {}'
);

test(
  'classes with " " combinator',
  [css, nestedCSS],
  '.one .two {} .one .two {}',
  '.one .two {}'
);

test(
  'classes with ">" combinator',
  [css, nestedCSS],
  '.one>.two {} .one > .two {}',
  '.one>.two {}'
);

test(
  'classes with "+" combinator',
  [css, nestedCSS],
  '.one+.two {} .one + .two {}',
  '.one+.two {}'
);

test(
  'classes with "~" combinator',
  [css, nestedCSS],
  '.one~.two {} .one ~ .two {}',
  '.one~.two {}'
);

test(
  'ids with " " combinator',
  [css, nestedCSS],
  '#one #two {} #one #two {}',
  '#one #two {}'
);

test(
  'ids with ">" combinator',
  [css, nestedCSS],
  '#one>#two {} #one > #two {}',
  '#one>#two {}'
);

test(
  'ids with "+" combinator',
  [css, nestedCSS],
  '#one+#two {} #one + #two {}',
  '#one+#two {}'
);

test(
  'ids with "~" combinator',
  [css, nestedCSS],
  '#one~#two {} #one ~ #two {}',
  '#one~#two {}'
);

test(
  'tags with " " combinator',
  [css, nestedCSS],
  'a b {} a  b {}',
  'a b {}'
);

test(
  'tags with ">" combinator',
  [css, nestedCSS],
  'a>b {} a > b {}',
  'a>b {}'
);

test(
  'tags with "+" combinator',
  [css, nestedCSS],
  'a+b {} a + b {}',
  'a+b {}'
);

test(
  'tags with "~" combinator',
  [css, nestedCSS],
  'a~b {} a ~ b {}',
  'a~b {}'
);

test(
  'universals with " " combinator',
  [css, nestedCSS],
  '* * {} *  * {}',
  '* * {}'
);

test(
  'universals with ">" combinator',
  [css, nestedCSS],
  '*>* {} * > * {}',
  '*>* {}'
);

test(
  'universals with "+" combinator',
  [css, nestedCSS],
  '*+* {} * + * {}',
  '*+* {}'
);

test(
  'universals with "~" combinator',
  [css, nestedCSS],
  '*~* {} * ~ * {}',
  '*~* {}'
);

test(
  'class with declarations',
  [css, nestedCSS],
  '.module {color: green} .module {background: red}',
  '.module {color: green;background: red}'
);

test(
  'id with declarations',
  [css, nestedCSS],
  '#one {color: green} #one {background: red}',
  '#one {color: green;background: red}'
);

test(
  'tag with declarations',
  [css, nestedCSS],
  'a {color: green} a {background: red}',
  'a {color: green;background: red}'
);

test(
  'universal with declarations',
  [css, nestedCSS],
  '* {color: green} * {background: red}',
  '* {color: green;background: red}'
);

test(
  'classes with different spacing and declarations',
  [css, nestedCSS],
  '.one .two {color: green} .one  .two {background: red}',
  '.one .two {color: green;background: red}'
);

test(
  'ids with different spacing and declarations',
  [css, nestedCSS],
  '#one #two {color: green} #one  #two {background: red}',
  '#one #two {color: green;background: red}'
);

test(
  'tags with different spacing and declarations',
  [css, nestedCSS],
  'a b {color: green} a  b {background: red}',
  'a b {color: green;background: red}'
);

test(
  'universals with different spacing and declarations',
  [css, nestedCSS],
  '* * {color: green} *  * {background: red}',
  '* * {color: green;background: red}'
);

test(
  'selectors with multiple properties',
  [css, nestedCSS],
  '.a {color: black; height: 10px} .a {background-color: red; width: 20px}',
  '.a {color: black; height: 10px; background-color: red; width: 20px}'
);

test(
  'attribute selectors',
  [css, nestedCSS],
  '.a[href] {} .a[href] {}',
  '.a[href] {}'
);

test(
  'attribute property selectors with different spacing',
  [css, nestedCSS],
  '.a[href="a"] {} .a[href = "a"] {}',
  '.a[href="a"] {}'
);

test(
  'attribute property selectors with different quoting',
  [css, nestedCSS],
  '.a[href="a"] {} .a[href=a] {}',
  '.a[href="a"] {}'
);

test(
  'attribute property selectors with different quote marks',
  [css, nestedCSS],
  '.a[href="a"] {} .a[href=\'a\'] {}',
  '.a[href="a"] {}'
);

test(
  'attribute selectors with different spacing',
  [css, nestedCSS],
  '.a[href] {} .a[ href ] {}',
  '.a[href] {}'
);

test(
  'pseudo classes',
  [css, nestedCSS],
  'a:link {} a:link {}',
  'a:link {}'
);

test(
  'pseudo elements',
  [css, nestedCSS],
  'p::first-line {} p::first-line {}',
  'p::first-line {}'
);

test(
  'selectors with different order',
  [css, nestedCSS],
  '.one.two {} .two.one {}',
  '.one.two {}'
);
