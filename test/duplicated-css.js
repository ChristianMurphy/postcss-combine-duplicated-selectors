import { describe, it } from 'node:test';
import testFactory from './_test-factory.js';
import plugin from '../src/index.js';

/**
 * These tests check css selectors that the plugin CAN combine together.
 * Meaning selectors provided are logically the same.
 * These tests check only standard css syntax.
 */

/**
 * Take string literals are remove newlines and extra spacing so results print
 * as expected in logs
 * @param {TemplateStringsArray} strings - template literal parts
 * @return {string} string without newlines and tabs
 */
function minify([string]) {
  return string.replace(/\s+/gm, ' ');
}

const css = testFactory([plugin]);

const cases = [
  { label: 'class', input: '.module {} .module {}', expected: '.module {}' },
  { label: 'id', input: '#one {} #one {}', expected: '#one {}' },
  { label: 'tag', input: 'a {} a {}', expected: 'a {}' },
  { label: 'universal', input: '* {} * {}', expected: '* {}' },
  {
    label: 'classes with " " combinator',
    input: '.one .two {} .one .two {}',
    expected: '.one .two {}',
  },
  {
    label: 'classes with ">" combinator',
    input: '.one>.two {} .one > .two {}',
    expected: '.one>.two {}',
  },
  {
    label: 'classes with "+" combinator',
    input: '.one+.two {} .one + .two {}',
    expected: '.one+.two {}',
  },
  {
    label: 'classes with "~" combinator',
    input: '.one~.two {} .one ~ .two {}',
    expected: '.one~.two {}',
  },
  {
    label: 'ids with " " combinator',
    input: '#one #two {} #one #two {}',
    expected: '#one #two {}',
  },
  {
    label: 'ids with ">" combinator',
    input: '#one>#two {} #one > #two {}',
    expected: '#one>#two {}',
  },
  {
    label: 'ids with "+" combinator',
    input: '#one+#two {} #one + #two {}',
    expected: '#one+#two {}',
  },
  {
    label: 'ids with "~" combinator',
    input: '#one~#two {} #one ~ #two {}',
    expected: '#one~#two {}',
  },
  {
    label: 'tags with " " combinator',
    input: 'a b {} a  b {}',
    expected: 'a b {}',
  },
  {
    label: 'tags with ">" combinator',
    input: 'a>b {} a > b {}',
    expected: 'a>b {}',
  },
  {
    label: 'tags with "+" combinator',
    input: 'a+b {} a + b {}',
    expected: 'a+b {}',
  },
  {
    label: 'tags with "~" combinator',
    input: 'a~b {} a ~ b {}',
    expected: 'a~b {}',
  },
  {
    label: 'universals with " " combinator',
    input: '* * {} *  * {}',
    expected: '* * {}',
  },
  {
    label: 'universals with ">" combinator',
    input: '*>* {} * > * {}',
    expected: '*>* {}',
  },
  {
    label: 'universals with "+" combinator',
    input: '*+* {} * + * {}',
    expected: '*+* {}',
  },
  {
    label: 'universals with "~" combinator',
    input: '*~* {} * ~ * {}',
    expected: '*~* {}',
  },
  {
    label: 'class with declarations',
    input: '.module {color: green} .module {background: red}',
    expected: '.module {color: green;background: red}',
  },
  {
    label: 'id with declarations',
    input: '#one {color: green} #one {background: red}',
    expected: '#one {color: green;background: red}',
  },
  {
    label: 'tag with declarations',
    input: 'a {color: green} a {background: red}',
    expected: 'a {color: green;background: red}',
  },
  {
    label: 'universal with declarations',
    input: '* {color: green} * {background: red}',
    expected: '* {color: green;background: red}',
  },
  {
    label: 'classes with different spacing and declarations',
    input: '.one .two {color: green} .one  .two {background: red}',
    expected: '.one .two {color: green;background: red}',
  },
  {
    label: 'ids with different spacing and declarations',
    input: '#one #two {color: green} #one  #two {background: red}',
    expected: '#one #two {color: green;background: red}',
  },
  {
    label: 'tags with different spacing and declarations',
    input: 'a b {color: green} a  b {background: red}',
    expected: 'a b {color: green;background: red}',
  },
  {
    label: 'universals with different spacing and declarations',
    input: '* * {color: green} *  * {background: red}',
    expected: '* * {color: green;background: red}',
  },
  {
    label: 'selectors with multiple properties',
    input:
      '.a {color: black; height: 10px} .a {background-color: red; width: 20px}',
    expected:
      '.a {color: black; height: 10px;background-color: red; width: 20px}',
  },
  {
    label: 'attribute selectors',
    input: '.a[href] {} .a[href] {}',
    expected: '.a[href] {}',
  },
  {
    label: 'attribute property selectors with different spacing',
    input: '.a[href="a"] {} .a[href = "a"] {}',
    expected: '.a[href="a"] {}',
  },
  {
    label: 'attribute property selectors with different quoting',
    input: '.a[href="a"] {} .a[href=a] {}',
    expected: '.a[href="a"] {}',
  },
  {
    label: 'attribute property selectors with different quote marks',
    input: '.a[href="a"] {} .a[href=\'a\'] {}',
    expected: '.a[href="a"] {}',
  },
  {
    label: 'attribute selectors with different spacing',
    input: '.a[href] {} .a[ href ] {}',
    expected: '.a[href] {}',
  },
  {
    label: 'pseudo classes',
    input: 'a:link {} a:link {}',
    expected: 'a:link {}',
  },
  {
    label: 'pseudo elements',
    input: 'p::first-line {} p::first-line {}',
    expected: 'p::first-line {}',
  },
  {
    label: 'selectors with different order',
    input: '.one.two {} .two.one {}',
    expected: '.one.two {}',
  },
  {
    label: 'selector groups',
    input: '.one .two, .one .three {} .one .two, .one .three {}',
    expected: '.one .two, .one .three {}',
  },
  {
    label: 'selector groups with different order',
    input: '.one .two, .one .three {} .one .three, .one .two {}',
    expected: '.one .two, .one .three {}',
  },
  {
    label: 'repeated selectors within a group',
    input: '.a, .a {}',
    expected: '.a {}',
  },
  {
    label: 'selectors within a group that differ in spacing',
    input: '.a .b, .a  .b, .a>.b, .a > .b {}',
    expected: '.a .b, .a>.b {}',
  },
  {
    label: 'selectors within a group with different class order',
    input: '.one.two, .two.one {}',
    expected: '.one.two {}',
  },
  {
    label: 'selectors within a group with different order before a combinator',
    input: '.three.two .one, .two.three .one {}',
    expected: '.three.two .one {}',
  },
  {
    label: 'selectors with different order before a combinator',
    input: '.three.two .one {x:1} .two.three .one {y:2}',
    expected: '.three.two .one {x:1;y:2}',
  },
  {
    label: 'pseudo classes in different order',
    input: 'a:hover:focus {x:1} a:focus:hover {y:2}',
    expected: 'a:hover:focus {x:1;y:2}',
  },
  {
    label: 'attribute selectors within a group with different quote marks',
    input: '[x="a"], [x=\'a\'], [x=a] {}',
    expected: '[x="a"] {}',
  },
  {
    label: 'repeated selectors on separate lines within a group',
    input: '.a,\n  .b,\n  .a {}',
    expected: '.a,\n  .b {}',
  },
  {
    label: 'comments kept when a repeated selector is removed',
    input: '.a /* keep */, .b, .a {}',
    expected: '.a /* keep */, .b {}',
  },
  {
    label: 'comment removed with the repeated selector it sits in',
    input: '.a, /* gone */ .a, .b {}',
    expected: '.a, .b {}',
  },
  {
    label: 'selector with a comment and a repeat, then a later rule',
    input: '.a /* keep */, .a {x:1} .a {y:2}',
    expected: '.a /* keep */ {x:1;y:2}',
  },
  {
    label: 'selectors within :is() with different class order',
    input: ':is(.b.a) {x:1} :is(.a.b) {y:2}',
    expected: ':is(.b.a) {x:1;y:2}',
  },
  {
    label: 'selector lists within :where() and :not() in different order',
    input:
      ':where(.a, .b) :not(.c, .d, .c) {x:1} :where(.b,.a) :not(.d,.c) {y:2}',
    expected: ':where(.a, .b) :not(.c, .d, .c) {x:1;y:2}',
  },
  {
    label: 'relative selectors within :has() with different class order',
    input: 'a:has(> .b.c, + .d) {x:1} a:has(+ .d, > .c.b) {y:2}',
    expected: 'a:has(> .b.c, + .d) {x:1;y:2}',
  },
  {
    label: 'repeated :is() within :not() with different class order',
    input: ':not(:is(.b.a), :is(.a.b)) {x:1} :not(:is(.a.b)) {y:2}',
    expected: ':not(:is(.b.a), :is(.a.b)) {x:1;y:2}',
  },
  {
    label: 'selectors within :is() in a group',
    input: ':is(.b.a), :is(.a.b) {}',
    expected: ':is(.b.a) {}',
  },
  {
    label: 'group with a repeated selector and a later rule',
    input: '.a, .a {x:1} .a {y:2}',
    expected: '.a {x:1;y:2}',
  },
  {
    label: 'selectors and separately selectors within media query',
    input: '.one{} .one{} @media print { .one{} .one{} }',
    expected: '.one{} @media print { .one{} }',
  },
  {
    label: 'multiple print media queries',
    input: minify`
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
    expected: minify`
@media print {
  a {
    color: blue;
    background: green;
  }
}
`,
  },
  {
    label: 'keyframe selectors with same percentage',
    input: '@keyframes a {0% { color: blue; } 0% { background: green; }}',
    expected: '@keyframes a {0% { color: blue; background: green; }}',
  },
  {
    label: 'keyframe selectors with duplicate animation properties',
    input: minify`
@keyframes ping {
  75%,
  to {
      transform: scale(2);
  }
}
@keyframes ping {
  75%,
  to {
      opacity: 0;
  }
}
`,
    expected: minify`
@keyframes ping {
    75%,
    to {
      transform: scale(2);
      opacity: 0;
    }
  }
`,
  },
  {
    label: 'multiple print media queries with different case',
    input: minify`
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
    expected: minify`
@media print {
  a {
    color: blue;
    background: green;
  }
}
`,
  },
  {
    label: 'example from issue #219',
    input: minify`
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
    expected: minify`
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
`,
  },
  {
    label: 'selectors within the same nested at-rules',
    input:
      '@media screen{@supports (display:grid){div{display:grid}}}@media screen{@supports (display:grid){div{color:red}}}',
    expected:
      '@media screen{@supports (display:grid){div{display:grid;color:red}}}',
  },
  {
    label: 'selectors within the same deeply nested at-rules',
    input:
      '@media screen{@supports (x:y){@layer a{div{a:1}}}}@media screen{@supports (x:y){@layer a{div{b:2}}}}',
    expected: '@media screen{@supports (x:y){@layer a{div{a:1;b:2}}}}',
  },
  {
    label: 'selectors within nested at-rules that differ only in whitespace',
    input:
      '@media (min-width:1px){@supports (x:y){a{b:1}}}@media ( min-width: 1px ){@supports (x:y){a{c:2}}}',
    expected: '@media (min-width:1px){@supports (x:y){a{b:1;c:2}}}',
  },
  {
    label: 'selectors within at-rules whose params differ in spacing',
    input: '@media screen   and  (x){a{b:1}}@media screen and (x){a{c:2}}',
    expected: '@media screen   and  (x){a{b:1;c:2}}',
  },
  {
    label: 'selectors within selector() params that differ in spacing',
    input: '@supports selector(a>b){x{a:1}}@supports selector( a > b ){x{b:2}}',
    expected: '@supports selector(a>b){x{a:1;b:2}}',
  },
  {
    label: 'selectors nested in the same parent selector',
    input: '.a{.b{x:1}}.a{.b{y:2}}',
    expected: '.a{.b{x:1;y:2}}',
  },
  {
    label: 'nesting selectors in the same parent selector',
    input: '.a{&:hover{x:1}}.a{&:hover{y:2}}',
    expected: '.a{&:hover{x:1;y:2}}',
  },
  {
    label: 'selectors in the same at-rule nested in the same selector',
    input: '.a{@media screen{.b{x:1}}}.a{@media screen{.b{y:2}}}',
    expected: '.a{@media screen{.b{x:1;y:2}}}',
  },
  {
    label: 'selectors next to an at-rule that was empty in the input',
    input: '@media s{a{x:1}}@media s{@supports (x){}a{y:1}}',
    expected: '@media s{a{x:1;y:1}}@media s{@supports (x){}}',
  },
];

describe('Duplicated CSS Tests', () => {
  for (const { label, input, expected } of cases) {
    it(label, () => {
      css(input, expected);
    });
  }
});
