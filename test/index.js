import test from 'ava';
import postcss from 'postcss';
import plugin from '../dist';

function processCSS(t, input, expected) {
  const actual = postcss([plugin]).process(input).css;
  t.is(actual, expected);
}

test(
  'unique class',
  processCSS,
  '.module {}',
  '.module {}'
);

test(
  'unique id',
  processCSS,
  '#one {}',
  '#one {}'
);

test(
  'unique tag',
  processCSS,
  'a {}',
  'a {}'
);

test(
  'unique universal',
  processCSS,
  '* {}',
  '* {}'
);

test(
  'unique classes',
  processCSS,
  '.one {} .two {}',
  '.one {} .two {}'
);

test(
  'unique ids',
  processCSS,
  '#one {} #two {}',
  '#one {} #two {}'
);

test(
  'unique tags',
  processCSS,
  'a {} b {}',
  'a {} b {}'
);

test(
  'unique universals',
  processCSS,
  '* a {} * b {}',
  '* a {} * b {}'
);

test(
  'unique combinations of classes',
  processCSS,
  '.one.two {} .one .two {}',
  '.one.two {} .one .two {}'
);

test(
  'unique combinations of ids',
  processCSS,
  '#one#two {} #one #two {}',
  '#one#two {} #one #two {}'
);

test(
  'duplicated class',
  processCSS,
  '.module {} .module {}',
  '.module {}'
);

test(
  'duplicated id',
  processCSS,
  '#one {} #one {}',
  '#one {}'
);

test(
  'duplicated tag',
  processCSS,
  'a {} a {}',
  'a {}'
);

test(
  'duplicated universal',
  processCSS,
  '* {} * {}',
  '* {}'
);

test(
  'duplicated classes with " " combinator',
  processCSS,
  '.one .two {} .one .two {}',
  '.one .two {}'
);

test(
  'duplicated classes with ">" combinator',
  processCSS,
  '.one>.two {} .one > .two {}',
  '.one>.two {}'
);

test(
  'duplicated classes with "+" combinator',
  processCSS,
  '.one+.two {} .one + .two {}',
  '.one+.two {}'
);

test(
  'duplicated ids with " " combinator',
  processCSS,
  '#one #two {} #one #two {}',
  '#one #two {}'
);

test(
  'duplicated ids with ">" combinator',
  processCSS,
  '#one>#two {} #one > #two {}',
  '#one>#two {}'
);

test(
  'duplicated ids with "+" combinator',
  processCSS,
  '#one+#two {} #one + #two {}',
  '#one+#two {}'
);

test(
  'duplicated tags with " " combinator',
  processCSS,
  'a b {} a  b {}',
  'a b {}'
);

test(
  'duplicated tags with ">" combinator',
  processCSS,
  'a>b {} a > b {}',
  'a>b {}'
);

test(
  'duplicated tags with "+" combinator',
  processCSS,
  'a+b {} a + b {}',
  'a+b {}'
);

test(
  'duplicated universals with " " combinator',
  processCSS,
  '* * {} *  * {}',
  '* * {}'
);

test(
  'duplicated universals with ">" combinator',
  processCSS,
  '*>* {} * > * {}',
  '*>* {}'
);

test(
  'duplicated universals with "+" combinator',
  processCSS,
  '*+* {} * + * {}',
  '*+* {}'
);

test(
  'duplicated class with declarations',
  processCSS,
  '.module {color: green} .module {background: red}',
  '.module {color: green;background: red}'
);

test(
  'duplicated id with declarations',
  processCSS,
  '#one {color: green} #one {background: red}',
  '#one {color: green;background: red}'
);

test(
  'duplicated tag with declarations',
  processCSS,
  'a {color: green} a {background: red}',
  'a {color: green;background: red}'
);

test(
  'duplicated universal with declarations',
  processCSS,
  '* {color: green} * {background: red}',
  '* {color: green;background: red}'
);

test(
  'duplicated classes with different spacing and declarations',
  processCSS,
  '.one .two {color: green} .one  .two {background: red}',
  '.one .two {color: green;background: red}'
);

test(
  'duplicated ids with different spacing and declarations',
  processCSS,
  '#one #two {color: green} #one  #two {background: red}',
  '#one #two {color: green;background: red}'
);

test(
  'duplicated tags with different spacing and declarations',
  processCSS,
  'a b {color: green} a  b {background: red}',
  'a b {color: green;background: red}'
);

test(
  'duplicated universals with different spacing and declarations',
  processCSS,
  '* * {color: green} *  * {background: red}',
  '* * {color: green;background: red}'
);
