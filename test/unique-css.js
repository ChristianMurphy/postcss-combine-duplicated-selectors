import { describe, it } from 'node:test';
import testFactory from './_test-factory.js';
import plugin from '../src/index.js';

/**
 * These tests check css selectors that the plugin CANNOT combined together.
 * Meaning that the selectors provided are unique.
 * These tests check only standard css syntax.
 */

const css = testFactory([plugin]);

const cases = [
  { label: 'class', input: '.module {}', expected: '.module {}' },
  { label: 'id', input: '#one {}', expected: '#one {}' },
  { label: 'tag', input: 'a {}', expected: 'a {}' },
  { label: 'universal', input: '* {}', expected: '* {}' },
  { label: 'classes', input: '.one {} .two {}', expected: '.one {} .two {}' },
  { label: 'ids', input: '#one {} #two {}', expected: '#one {} #two {}' },
  { label: 'tags', input: 'a {} b {}', expected: 'a {} b {}' },
  { label: 'universals', input: '* a {} * b {}', expected: '* a {} * b {}' },
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
    label: 'selectors whose classes swap across a combinator',
    input: '.c.a .b {x:1} .c.b .a {y:2}',
    expected: '.c.a .b {x:1} .c.b .a {y:2}',
  },
  {
    label: 'selectors within a group whose classes swap across a combinator',
    input: '.c.a .b, .c.b .a {}',
    expected: '.c.a .b, .c.b .a {}',
  },
  {
    label: 'type selector and class whose names run together',
    input: '.adiv {x:1} div.a {y:2}',
    expected: '.adiv {x:1} div.a {y:2}',
  },
  {
    label: 'type selector and class within a group whose names run together',
    input: '.ba, a.b {}',
    expected: '.ba, a.b {}',
  },
  {
    label: 'id and type selector whose names run together',
    input: '#xdiv {x:1} div#x {y:2}',
    expected: '#xdiv {x:1} div#x {y:2}',
  },
  {
    label: 'pseudo class arguments with different selectors',
    input: ':is(.a.b) {x:1} :is(.a .b) {y:2}',
    expected: ':is(.a.b) {x:1} :is(.a .b) {y:2}',
  },
  {
    label: 'pseudo class before and after a pseudo element',
    input: 'a:hover::before, a::before:hover {}',
    expected: 'a:hover::before, a::before:hover {}',
  },
  {
    label: 'pseudo class before and after a legacy pseudo element',
    input: 'a:hover:before {x:1} a:before:hover {y:2}',
    expected: 'a:hover:before {x:1} a:before:hover {y:2}',
  },
  {
    label: 'attribute values that differ by a quote inside the value',
    input: '[x="a\'"] {x:1} [x=a] {y:2}',
    expected: '[x="a\'"] {x:1} [x=a] {y:2}',
  },
  {
    label: 'attribute values within a group that differ by a quote',
    input: '[x="a\'"], [x=a] {}',
    expected: '[x="a\'"], [x=a] {}',
  },
  {
    label: 'selector groups partially overlapping',
    input: '.one, .two {} .one, .two, .three {}',
    expected: '.one, .two {} .one, .two, .three {}',
  },
  {
    label: 'media query',
    input:
      '@media (prefers-color-scheme: light) {:root {--text-color: oklch(0% 0 0);}} @media (prefers-color-scheme: dark) {:root {--text-color: oklch(100% 0 0);}}',
    expected:
      '@media (prefers-color-scheme: light) {:root {--text-color: oklch(0% 0 0);}} @media (prefers-color-scheme: dark) {:root {--text-color: oklch(100% 0 0);}}',
  },
  {
    label:
      'selectors in the same inner at-rule within different outer at-rules',
    input:
      '@media screen{@supports (x:y){div{a:1}}}@media print{@supports (x:y){div{b:2}}}',
    expected:
      '@media screen{@supports (x:y){div{a:1}}}@media print{@supports (x:y){div{b:2}}}',
  },
  {
    label: 'selectors in at-rule chains of different depth',
    input: '@supports (x:y){div{a:1}}@media screen{@supports (x:y){div{b:2}}}',
    expected:
      '@supports (x:y){div{a:1}}@media screen{@supports (x:y){div{b:2}}}',
  },
  {
    label: 'keyframes within different media queries',
    input:
      '@media screen{@keyframes x{from{a:1}}}@media print{@keyframes x{from{b:2}}}',
    expected:
      '@media screen{@keyframes x{from{a:1}}}@media print{@keyframes x{from{b:2}}}',
  },
  {
    label: 'nesting selectors in different parent selectors',
    input: '.a{&:hover{x:1}}.c{&:hover{y:2}}',
    expected: '.a{&:hover{x:1}}.c{&:hover{y:2}}',
  },
  {
    label: 'nested selector and top level selector',
    input: '.a{.b{color:red}}.b{color:blue}',
    expected: '.a{.b{color:red}}.b{color:blue}',
  },
  {
    label: 'selectors in the same at-rule nested in different selectors',
    input: '.a{@media screen{.b{x:1}}}.c{@media screen{.b{y:2}}}',
    expected: '.a{@media screen{.b{x:1}}}.c{@media screen{.b{y:2}}}',
  },
  {
    label: 'at-rule and selector that read the same without the at sign',
    input: '@media screen{a{x:1}}mediascreen{a{y:2}}',
    expected: '@media screen{a{x:1}}mediascreen{a{y:2}}',
  },
  {
    label: 'at-rule params that differ only by a descendant combinator',
    input: '@supports selector(.a .b){x{a:1}}@supports selector(.a.b){x{b:2}}',
    expected:
      '@supports selector(.a .b){x{a:1}}@supports selector(.a.b){x{b:2}}',
  },
  {
    label: 'selector() params that differ by a descendant combinator',
    input:
      '@supports selector(a :hover){x{a:1}}@supports selector(a:hover){x{b:2}}',
    expected:
      '@supports selector(a :hover){x{a:1}}@supports selector(a:hover){x{b:2}}',
  },
  {
    // value-parser reads 400px<=width<=700px as one word, so these stay apart
    label: 'media range params with different spacing around operators',
    input:
      '@media (400px <= width <= 700px){a{x:1}}@media (400px<=width<=700px){a{y:2}}',
    expected:
      '@media (400px <= width <= 700px){a{x:1}}@media (400px<=width<=700px){a{y:2}}',
  },
  {
    label: 'at-rule params that differ only by spaces inside a string',
    input: '@supports (content:"a b"){x{a:1}}@supports (content:"ab"){x{b:2}}',
    expected:
      '@supports (content:"a b"){x{a:1}}@supports (content:"ab"){x{b:2}}',
  },
  {
    label: 'selectors in different control flow at-rules',
    input: '@if $x {.a{a:1}} @else {.a{b:2}}',
    expected: '@if $x {.a{a:1}} @else {.a{b:2}}',
  },
];

describe('Unique CSS Tests', () => {
  for (const { label, input, expected } of cases) {
    it(label, () => {
      css(input, expected);
    });
  }
});
