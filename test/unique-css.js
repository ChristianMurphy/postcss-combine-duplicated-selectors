const {describe, it} = require('node:test');
const testFactory = require('./_test-factory');
const plugin = require('../src'); // Adjust path if needed

/**
 * These tests check css selectors that the plugin CANNOT combined together.
 * Meaning that the selectors provided are unique.
 * These tests check only standard css syntax.
 */

const css = testFactory('css', [plugin]);

const cases = [
  {label: 'class', input: '.module {}', expected: '.module {}'},
  {label: 'id', input: '#one {}', expected: '#one {}'},
  {label: 'tag', input: 'a {}', expected: 'a {}'},
  {label: 'universal', input: '* {}', expected: '* {}'},
  {label: 'classes', input: '.one {} .two {}', expected: '.one {} .two {}'},
  {label: 'ids', input: '#one {} #two {}', expected: '#one {} #two {}'},
  {label: 'tags', input: 'a {} b {}', expected: 'a {} b {}'},
  {label: 'universals', input: '* a {} * b {}', expected: '* a {} * b {}'},
  {
    label: 'combinations of classes',
    input: '.one.two {} .one .two {}',
    expected: '.one.two {} .one .two {}',
  },
  {
    label: 'combinations of ids',
    input: '#one#two {} #one #two {}',
    expected: '#one#two {} #one #two {}',
  },
  {
    label: 'attribute selectors',
    input: '.a[href] {} .a[title] {}',
    expected: '.a[href] {} .a[title] {}',
  },
  {
    label: 'selectors with same attribute property and unique values',
    input: '.a[href="a"] {} .a[href="b"] {}',
    expected: '.a[href="a"] {} .a[href="b"] {}',
  },
  {
    label: 'selectors with same attribute',
    input: '.a [href] {} .a[href] {}',
    expected: '.a [href] {} .a[href] {}',
  },
  {
    label: 'pseudo classes',
    input: 'a:link {} a:visited {}',
    expected: 'a:link {} a:visited {}',
  },
  {
    label: 'pseudo class and non pseudo class',
    input: 'a:link {} a {}',
    expected: 'a:link {} a {}',
  },
  {
    label: 'pseudo elements',
    input: 'p::first-line {} p::last-line {}',
    expected: 'p::first-line {} p::last-line {}',
  },
  {
    label: 'pseudo element and non pseudo element',
    input: 'p::first-line {} p {}',
    expected: 'p::first-line {} p {}',
  },
  {
    label: 'pseudo class and pseudo element',
    input: 'p::first-line {} p:hover {}',
    expected: 'p::first-line {} p:hover {}',
  },
  {
    label: 'selectors same classes',
    input: '.one .two {} .one.two {}',
    expected: '.one .two {} .one.two {}',
  },
  {
    label: 'selectors with partial class selector match',
    input: '.one.two {} .one.two.three {}',
    expected: '.one.two {} .one.two.three {}',
  },
  {
    label: 'keyframe selectors with different names',
    input: '@keyframes a {0% {} 100% {}} @keyframes b {0% {} 100% {}}',
    expected: '@keyframes a {0% {} 100% {}} @keyframes b {0% {} 100% {}}',
  },
  {
    label: 'keyframe selectors with different prefixes',
    input: '@keyframes a {0% {} 100% {}} @-webkit-keyframes a {0% {} 100% {}}',
    expected:
      '@keyframes a {0% {} 100% {}} @-webkit-keyframes a {0% {} 100% {}}',
  },
  {
    label: 'selector groups partially overlapping',
    input: '.one, .two {} .one, .two, .three {}',
    expected: '.one, .two {} .one, .two, .three {}',
  },
  {
    label: 'media query',
    input:
      // eslint-disable-next-line max-len
      '@media (prefers-color-scheme: light) {:root {--text-color: oklch(0% 0 0);}} @media (prefers-color-scheme: dark) {:root {--text-color: oklch(100% 0 0);}}',
    expected:
      // eslint-disable-next-line max-len
      '@media (prefers-color-scheme: light) {:root {--text-color: oklch(0% 0 0);}} @media (prefers-color-scheme: dark) {:root {--text-color: oklch(100% 0 0);}}',
  },
];

describe('Unique CSS Tests', () => {
  for (const {label, input, expected} of cases) {
    it(label, () => {
      css({}, input, expected);
    });
  }
});
