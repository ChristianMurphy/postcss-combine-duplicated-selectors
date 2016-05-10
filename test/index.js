import test from 'ava';
import postcss from 'postcss';
import plugin from '../dist';

test('non duplicated css', t => {
  const actual = postcss([plugin]).process('.module {}').css;
  const expected = '.module {}';
  t.is(actual, expected);
});

test('duplicated class', t => {
  const actual = postcss([plugin]).process('.module {} .module {}').css;
  const expected = '.module {}';
  t.is(actual, expected);
});

test('duplicated class with declarations', t => {
  const actual = postcss([plugin])
    .process('.module {color: green} .module {background: red}').css;
  const expected = '.module {color: green;background: red}';
  t.is(actual, expected);
});
