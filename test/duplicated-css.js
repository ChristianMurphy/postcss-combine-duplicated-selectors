const test = require('ava');
const testFactory = require('./_test-factory');
const plugin = require('../src');

/**
 * These tests check css selectors that the plugin CAN combine together.
 * Meaning selectors provided are logically the same.
 * These tests check only standard css syntax.
 */

const css = testFactory('css', [plugin]);

test(
  'class',
  css,
  '.module {} .module {}',
  '.module {}'
);

test(
  'id',
  css,
  '#one {} #one {}',
  '#one {}'
);

test(
  'tag',
  css,
  'a {} a {}',
  'a {}'
);

test(
  'universal',
  css,
  '* {} * {}',
  '* {}'
);

test(
  'classes with " " combinator',
  css,
  '.one .two {} .one .two {}',
  '.one .two {}'
);

test(
  'classes with ">" combinator',
  css,
  '.one>.two {} .one > .two {}',
  '.one>.two {}'
);

test(
  'classes with "+" combinator',
  css,
  '.one+.two {} .one + .two {}',
  '.one+.two {}'
);

test(
  'classes with "~" combinator',
  css,
  '.one~.two {} .one ~ .two {}',
  '.one~.two {}'
);

test(
  'ids with " " combinator',
  css,
  '#one #two {} #one #two {}',
  '#one #two {}'
);

test(
  'ids with ">" combinator',
  css,
  '#one>#two {} #one > #two {}',
  '#one>#two {}'
);

test(
  'ids with "+" combinator',
  css,
  '#one+#two {} #one + #two {}',
  '#one+#two {}'
);

test(
  'ids with "~" combinator',
  css,
  '#one~#two {} #one ~ #two {}',
  '#one~#two {}'
);

test(
  'tags with " " combinator',
  css,
  'a b {} a  b {}',
  'a b {}'
);

test(
  'tags with ">" combinator',
  css,
  'a>b {} a > b {}',
  'a>b {}'
);

test(
  'tags with "+" combinator',
  css,
  'a+b {} a + b {}',
  'a+b {}'
);

test(
  'tags with "~" combinator',
  css,
  'a~b {} a ~ b {}',
  'a~b {}'
);

test(
  'universals with " " combinator',
  css,
  '* * {} *  * {}',
  '* * {}'
);

test(
  'universals with ">" combinator',
  css,
  '*>* {} * > * {}',
  '*>* {}'
);

test(
  'universals with "+" combinator',
  css,
  '*+* {} * + * {}',
  '*+* {}'
);

test(
  'universals with "~" combinator',
  css,
  '*~* {} * ~ * {}',
  '*~* {}'
);

test(
  'class with declarations',
  css,
  '.module {color: green} .module {background: red}',
  '.module {color: green;background: red}'
);

test(
  'id with declarations',
  css,
  '#one {color: green} #one {background: red}',
  '#one {color: green;background: red}'
);

test(
  'tag with declarations',
  css,
  'a {color: green} a {background: red}',
  'a {color: green;background: red}'
);

test(
  'universal with declarations',
  css,
  '* {color: green} * {background: red}',
  '* {color: green;background: red}'
);

test(
  'classes with different spacing and declarations',
  css,
  '.one .two {color: green} .one  .two {background: red}',
  '.one .two {color: green;background: red}'
);

test(
  'ids with different spacing and declarations',
  css,
  '#one #two {color: green} #one  #two {background: red}',
  '#one #two {color: green;background: red}'
);

test(
  'tags with different spacing and declarations',
  css,
  'a b {color: green} a  b {background: red}',
  'a b {color: green;background: red}'
);

test(
  'universals with different spacing and declarations',
  css,
  '* * {color: green} *  * {background: red}',
  '* * {color: green;background: red}'
);

test(
  'selectors with multiple properties',
  css,
  '.a {color: black; height: 10px} .a {background-color: red; width: 20px}',
  '.a {color: black; height: 10px; background-color: red; width: 20px}'
);

test(
  'attribute selectors',
  css,
  '.a[href] {} .a[href] {}',
  '.a[href] {}'
);

test(
  'attribute property selectors with different spacing',
  css,
  '.a[href="a"] {} .a[href = "a"] {}',
  '.a[href="a"] {}'
);

test(
  'attribute property selectors with different quoting',
  css,
  '.a[href="a"] {} .a[href=a] {}',
  '.a[href="a"] {}'
);

test(
  'attribute property selectors with different quote marks',
  css,
  '.a[href="a"] {} .a[href=\'a\'] {}',
  '.a[href="a"] {}'
);

test(
  'attribute selectors with different spacing',
  css,
  '.a[href] {} .a[ href ] {}',
  '.a[href] {}'
);

test(
  'pseudo classes',
  css,
  'a:link {} a:link {}',
  'a:link {}'
);

test(
  'pseudo elements',
  css,
  'p::first-line {} p::first-line {}',
  'p::first-line {}'
);

test(
  'selectors with different order',
  css,
  '.one.two {} .two.one {}',
  '.one.two {}'
);

test(
  'selectors and seperately selectors within media query',
  css,
  '.one{} .one{} @media print { .one{} .one{} }',
  '.one{} @media print { .one{} }'
);

test(
  'multiple print media queries',
  css,
  '@media print { a{ color: blue; } } @media print { a{ background: green; } }',
  '@media print { a{ color: blue; background: green; } } @media print { }'
);

test(
  'keyframe selectors with same percentage',
  css,
  '@keyframes a {0% { color: blue; } 0% { background: green; }}',
  '@keyframes a {0% { color: blue; background: green; }}'
);
