const test = require('ava');
const testFactory = require('./_test-factory');
const plugin = require('../src');

/**
 * These tests check css selectors that the plugin CAN combine together.
 * Meaning selectors provided are logically the same.
 * These tests check only standard css syntax.
 */

/**
 * Take string literals are remove newlines and extra spacing so results print
 * as expected in logs
 * @return {string} string without newlines and tabs
 */
function minify([string]) {
  return string.replace(/\s+/gm, ' ');
}

const css = testFactory('css', [plugin]);

test('class', css, '.module {} .module {}', '.module {}');

test('id', css, '#one {} #one {}', '#one {}');

test('tag', css, 'a {} a {}', 'a {}');

test('universal', css, '* {} * {}', '* {}');

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

test('tags with " " combinator', css, 'a b {} a  b {}', 'a b {}');

test('tags with ">" combinator', css, 'a>b {} a > b {}', 'a>b {}');

test('tags with "+" combinator', css, 'a+b {} a + b {}', 'a+b {}');

test('tags with "~" combinator', css, 'a~b {} a ~ b {}', 'a~b {}');

test('universals with " " combinator', css, '* * {} *  * {}', '* * {}');

test('universals with ">" combinator', css, '*>* {} * > * {}', '*>* {}');

test('universals with "+" combinator', css, '*+* {} * + * {}', '*+* {}');

test('universals with "~" combinator', css, '*~* {} * ~ * {}', '*~* {}');

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
    '.a {color: black; height: 10px;background-color: red; width: 20px}'
);

test('attribute selectors', css, '.a[href] {} .a[href] {}', '.a[href] {}');

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

test('pseudo classes', css, 'a:link {} a:link {}', 'a:link {}');

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
    'selector groups',
    css,
    '.one .two, .one .three {} .one .two, .one .three {}',
    '.one .two, .one .three {}'
);

test(
    'selector groups with different order',
    css,
    '.one .two, .one .three {} .one .three, .one .two {}',
    '.one .two, .one .three {}'
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
    minify`
@media print {
  a {
    color: blue;
  }
}
@media print {
  a {
    background: green;
  }
}
`,
    minify`
@media print {
  a {
    color: blue;
    background: green;
  }
}
@media print { }
`
);

test(
    'keyframe selectors with same percentage',
    css,
    '@keyframes a {0% { color: blue; } 0% { background: green; }}',
    '@keyframes a {0% { color: blue; background: green; }}'
);

test(
    'multiple print media queries with different case',
    css,
    minify`
@media print {
  a {
    color: blue;
  }
}
@MEDIA print {
  a {
    background: green;
  }
}
`,
    minify`
@media print {
  a {
    color: blue;
    background: green;
  }
}
@MEDIA print { }
`
);

test(
    'example from issue #219',
    css,
    minify`
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  font: 24px/1 Arial, Helvetica, sans-serif;
}

.bg-gold {
  background-color: #ffd700;
}

.i {
  font-style: italic;
}

.fw4 {
  font-weight: 400;
}

.home-ac {
  height: 100%;
}

.home-ac {
  position: fixed;
}

.bg-black-80 {
  background-color: rgba(0, 0, 0, 0.8);
}

.white-80 {
  color: rgba(255, 255, 255, 0.8);
}

.home-ac {
  width: 100%;
}
`,
    minify`
* {
box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  font: 24px/1 Arial, Helvetica, sans-serif;
}

.bg-gold {
  background-color: #ffd700;
}

.i {
  font-style: italic;
}

.fw4 {
  font-weight: 400;
}

.home-ac {
  height: 100%;
  position: fixed;
  width: 100%;
}

.bg-black-80 {
  background-color: rgba(0, 0, 0, 0.8);
}

.white-80 {
  color: rgba(255, 255, 255, 0.8);
}
`
);
