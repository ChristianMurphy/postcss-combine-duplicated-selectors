import test from 'ava';
import postcss from 'postcss';
import plugin from '../dist';

test('non duplicated class', t => {
  const actual = postcss([plugin]).process('.module {}').css;
  const expected = '.module {}';
  t.is(actual, expected);
});

test('non duplicated id', t => {
  const actual = postcss([plugin]).process('#one {}').css;
  const expected = '#one {}';
  t.is(actual, expected);
});

test('non duplicated tag', t => {
  const actual = postcss([plugin]).process('a {}').css;
  const expected = 'a {}';
  t.is(actual, expected);
});

test('non duplicated universal', t => {
  const actual = postcss([plugin]).process('* {}').css;
  const expected = '* {}';
  t.is(actual, expected);
});

test('unique classes', t => {
  const actual = postcss([plugin]).process('.one {} .two {}').css;
  const expected = '.one {} .two {}';
  t.is(actual, expected);
});

test('unique ids', t => {
  const actual = postcss([plugin]).process('#one {} #two {}').css;
  const expected = '#one {} #two {}';
  t.is(actual, expected);
});

test('unique tags', t => {
  const actual = postcss([plugin]).process('a {} b {}').css;
  const expected = 'a {} b {}';
  t.is(actual, expected);
});

test('unique universals', t => {
  const actual = postcss([plugin]).process('* a {} * b {}').css;
  const expected = '* a {} * b {}';
  t.is(actual, expected);
});

test('duplicated class', t => {
  const actual = postcss([plugin]).process('.module {} .module {}').css;
  const expected = '.module {}';
  t.is(actual, expected);
});

test('duplicated id', t => {
  const actual = postcss([plugin]).process('#one {} #one {}').css;
  const expected = '#one {}';
  t.is(actual, expected);
});

test('duplicated tag', t => {
  const actual = postcss([plugin]).process('a {} a {}').css;
  const expected = 'a {}';
  t.is(actual, expected);
});

test('duplicated universal', t => {
  const actual = postcss([plugin]).process('* {} * {}').css;
  const expected = '* {}';
  t.is(actual, expected);
});

test('duplicated classes with different spacing', t => {
  const actual = postcss([plugin]).process('.one .two {} .one  .two {}').css;
  const expected = '.one .two {}';
  t.is(actual, expected);
});

test('duplicated ids with different spacing', t => {
  const actual = postcss([plugin]).process('#one #two {} #one  #two {}').css;
  const expected = '#one #two {}';
  t.is(actual, expected);
});

test('duplicated tags with different spacing', t => {
  const actual = postcss([plugin]).process('a b {} a  b {}').css;
  const expected = 'a b {}';
  t.is(actual, expected);
});

test('duplicated universals with different spacing', t => {
  const actual = postcss([plugin]).process('* * {} *  * {}').css;
  const expected = '* * {}';
  t.is(actual, expected);
});

test('duplicated class with declarations', t => {
  const actual = postcss([plugin])
    .process('.module {color: green} .module {background: red}').css;
  const expected = '.module {color: green;background: red}';
  t.is(actual, expected);
});

test('duplicated id with declarations', t => {
  const actual = postcss([plugin])
    .process('#one {color: green} #one {background: red}').css;
  const expected = '#one {color: green;background: red}';
  t.is(actual, expected);
});

test('duplicated tag with declarations', t => {
  const actual = postcss([plugin])
    .process('a {color: green} a {background: red}').css;
  const expected = 'a {color: green;background: red}';
  t.is(actual, expected);
});

test('duplicated universal with declarations', t => {
  const actual = postcss([plugin])
    .process('* {color: green} * {background: red}').css;
  const expected = '* {color: green;background: red}';
  t.is(actual, expected);
});

test('duplicated classes with different spacing and declarations', t => {
  const actual = postcss([plugin]).process('.one .two {color: green} .one  .two {background: red}').css;
  const expected = '.one .two {color: green;background: red}';
  t.is(actual, expected);
});

test('duplicated ids with different spacing and declarations', t => {
  const actual = postcss([plugin]).process('#one #two {color: green} #one  #two {background: red}').css;
  const expected = '#one #two {color: green;background: red}';
  t.is(actual, expected);
});

test('duplicated tags with different spacing and declarations', t => {
  const actual = postcss([plugin]).process('a b {color: green} a  b {background: red}').css;
  const expected = 'a b {color: green;background: red}';
  t.is(actual, expected);
});

test('duplicated universals with different spacing and declarations', t => {
  const actual = postcss([plugin]).process('* * {color: green} *  * {background: red}').css;
  const expected = '* * {color: green;background: red}';
  t.is(actual, expected);
});
