import test from 'ava';
import testFactory from './_test-factory';
import plugin from '../dist';

/**
 * These tests check css selectors that the plugin CANNOT combined together.
 * Meaning that the selectors provided are unique.
 * These tests check only standard css syntax.
 */

const css = testFactory('css', [plugin]);

test(
  'class',
  css,
  '.module {}',
  '.module {}'
);

test(
  'id',
  css,
  '#one {}',
  '#one {}'
);

test(
  'tag',
  css,
  'a {}',
  'a {}'
);

test(
  'universal',
  css,
  '* {}',
  '* {}'
);

test(
  'classes',
  css,
  '.one {} .two {}',
  '.one {} .two {}'
);

test(
  'ids',
  css,
  '#one {} #two {}',
  '#one {} #two {}'
);

test(
  'tags',
  css,
  'a {} b {}',
  'a {} b {}'
);

test(
  'universals',
  css,
  '* a {} * b {}',
  '* a {} * b {}'
);

test(
  'combinations of classes',
  css,
  '.one.two {} .one .two {}',
  '.one.two {} .one .two {}'
);

test(
  'combinations of ids',
  css,
  '#one#two {} #one #two {}',
  '#one#two {} #one #two {}'
);

test(
  'attribute selectors',
  css,
  '.a[href] {} .a[title] {}',
  '.a[href] {} .a[title] {}'
);

test(
  'selectors with same attribute property and unique values',
  css,
  '.a[href="a"] {} .a[href="b"] {}',
  '.a[href="a"] {} .a[href="b"] {}'
);

test(
  'selectors with same attribute',
  css,
  '.a [href] {} .a[href] {}',
  '.a [href] {} .a[href] {}'
);

test(
  'pseudo classes',
  css,
  'a:link {} a:visited {}',
  'a:link {} a:visited {}'
);

test(
  'pseudo class and non pseudo class',
  css,
  'a:link {} a {}',
  'a:link {} a {}'
);

test(
  'pseudo elements',
  css,
  'p::first-line {} p::last-line {}',
  'p::first-line {} p::last-line {}'
);

test(
  'pseudo element and non pseudo element',
  css,
  'p::first-line {} p {}',
  'p::first-line {} p {}'
);

test(
  'pseudo class and pseudo element',
  css,
  'p::first-line {} p:hover {}',
  'p::first-line {} p:hover {}'
);

test(
  'selectors same classes',
  css,
  '.one .two {} .one.two {}',
  '.one .two {} .one.two {}'
);

test(
  'selectors with partial class selector match',
  css,
  '.one.two {} .one.two.three {}',
  '.one.two {} .one.two.three {}'
);

test(
  'selectors within media queries',
  css,
  '@media print { .one{} } @media print { .one{} }',
  '@media print { .one{} } @media print { .one{} }'
);
