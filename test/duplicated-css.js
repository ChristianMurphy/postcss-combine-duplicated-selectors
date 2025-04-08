const {describe, it} = require('node:test');
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

const cases = [
  {label: 'class', input: '.module {} .module {}', expected: '.module {}'},
  {label: 'id', input: '#one {} #one {}', expected: '#one {}'},
  {label: 'tag', input: 'a {} a {}', expected: 'a {}'},
  {label: 'universal', input: '* {} * {}', expected: '* {}'},
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
    // eslint-disable-next-line max-len
    input: '.a {color: black; height: 10px} .a {background-color: red; width: 20px}',
    // eslint-disable-next-line max-len
    expected: '.a {color: black; height: 10px;background-color: red; width: 20px}',
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
];

describe('Duplicated CSS Tests', () => {
  for (const {label, input, expected} of cases) {
    it(label, () => {
      css({}, input, expected);
    });
  }
});
