import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import postcssScss from 'postcss-scss';
import testFactory from './_test-factory.js';
import plugin from '../src/index.js';

/**
 * These tests check which rules combine when keepCascade is on.
 */

const keepCascade = testFactory([plugin({ keepCascade: true })]);

describe('Keep cascade - combined', () => {
  const cases = [
    {
      label: 'rules next to each other',
      input: '.a{color:red}.a{width:1px}',
      expected: '.a{color:red;width:1px}',
    },
    {
      label: 'rules around a rule that sets other properties',
      input: '.a{x:1}.b{y:2}.a{z:3}',
      expected: '.a{x:1;z:3}.b{y:2}',
    },
    {
      label: 'rules around a rule that sets another custom property',
      input: '.a{color:red}.b{--x:1}.a{--y:2}',
      expected: '.a{color:red;--y:2}.b{--x:1}',
    },
    {
      label: 'a rule into the nearest earlier one it can join',
      input: '.a{x:1}.b{y:1}.a{y:2}.a{z:3}',
      expected: '.a{x:1}.b{y:1}.a{y:2;z:3}',
    },
    {
      label: 'rules in separate blocks of the same media query',
      input: '@media (w){.a{x:1} .b{x:2}} @media (w){.a{y:2}}',
      expected: '@media (w){.a{x:1;y:2} .b{x:2}}',
    },
    {
      label: 'rules of two selectors that alternate without sharing a property',
      input: '.a{x:1}.b{y:1}.a{z:1}.b{v:2}.a{w:1}',
      expected: '.a{x:1;z:1;w:1}.b{y:1;v:2}',
    },
    {
      label: 'only the rules that a joined property does not sit between',
      input: '.a{x:1}.b{y:1}.b{g:1}.a{g:2}',
      expected: '.a{x:1}.b{y:1;g:1}.a{g:2}',
    },
    {
      label: 'nested rules around a declaration of another property',
      input: '.p{&{x:1} color:red;&{width:1px}}',
      expected: '.p{&{x:1;width:1px} color:red}',
    },
    {
      label: 'a later rule that repeats a property of the first',
      input: '.a{color:red}.b{x:1}.a{color:green}',
      expected: '.a{color:red;color:green}.b{x:1}',
    },
  ];

  for (const { label, input, expected } of cases) {
    it(label, () => {
      keepCascade(input, expected);
    });
  }
});

describe('Keep cascade - kept apart', () => {
  const cases = [
    {
      label: 'rules around a rule that sets a moved property',
      input: '.a{color:red}.b{color:blue}.a{color:green}',
    },
    {
      label: 'rules around a longhand of a moved shorthand',
      input: '.a{color:red}.b{margin-top:1px}.a{margin:0}',
    },
    {
      label: 'rules around a shorthand of a moved longhand',
      input: '.a{color:red}.b{margin:0}.a{margin-top:1px}',
    },
    {
      label: 'rules around a longhand with another name than its shorthand',
      input: '.a{color:red}.b{top:1px}.a{inset:0}',
    },
    {
      label: 'rules around a moved property with a vendor prefix',
      input: '.a{x:1}.b{-webkit-transition:none}.a{transition:all}',
    },
    {
      label: 'rules around the same custom property',
      input: '.a{color:red}.b{--x:1}.a{--x:2}',
    },
    {
      label: 'nested rules around a declaration of a moved property',
      input: '.p{&{x:1} color:red;&{color:blue}}',
    },
    {
      label: 'nested at-rules around a declaration of a moved property',
      input: '.p{@media (w){&{x:1}} color:red;@media (w){&{color:blue}}}',
    },
    {
      label: 'rules around a moved property written with an escape',
      input: '.a{x:1}.b{c\\6f lor:blue}.a{color:green}',
    },
    {
      label: 'rules around an at-rule without a block inside a rule',
      input: '.a{color:red}.b{@apply text-blue}.a{color:green}',
    },
    {
      label: 'rules around an at-rule without a block',
      input: '.a{color:red}@include m;.a{color:green}',
    },
    {
      label: 'a rule that sets all',
      input: '.a{x:1}.b{color:blue}.a{all:unset}',
    },
    {
      label: 'rules around a rule that sets all',
      input: '.a{x:1}.b{all:unset}.a{y:2}',
    },
    {
      label: 'rules around an at-rule that sets all',
      input: '.a{x:1}.b{@media (w){all:unset}}.a{y:2}',
    },
    {
      label: 'rules around a declaration nested in an at-rule',
      input: '.a{x:1}.b{@media (w){color:blue}}.a{color:red}',
    },
    {
      label: 'a rule with nested rules',
      input: '.a{x:1}.b{y:1}.a{.c{z:1}}',
    },
    {
      label: 'rules around a moved property set in another media query',
      input: '.a{x:1}@media (w){.b{y:1}}.a{y:2}',
    },
  ];

  for (const { label, input } of cases) {
    it(label, () => {
      keepCascade(input, input);
    });
  }
});

describe('Keep cascade - properties that set each other', () => {
  const pairs = [
    ['top', 'inset'],
    ['right', 'inset-inline'],
    ['bottom', 'inset-block'],
    ['left', 'inset'],
    ['line-height', 'font'],
    ['gap', 'grid-gap'],
    ['row-gap', 'gap'],
    ['column-gap', 'gap'],
    ['columns', 'column-width'],
    ['align-items', 'place-items'],
    ['justify-content', 'place-content'],
    ['width', 'inline-size'],
    ['height', 'block-size'],
    ['inline-size', 'width'],
    ['block-size', 'height'],
    ['white-space', 'text-wrap'],
    ['word-wrap', 'overflow-wrap'],
    ['page-break-after', 'break-after'],
    ['-webkit-logical-width', 'width'],
    ['vertical-align', 'baseline-shift'],
    ['alignment-baseline', 'vertical-align'],
    ['rule-color', 'column-rule-color'],
    ['-webkit-column-break-before', 'break-before'],
    ['-webkit-column-break-after', 'break-after'],
    ['-webkit-column-break-inside', 'break-inside'],
    ['color-adjust', 'print-color-adjust'],
    ['-webkit-line-clamp', 'max-lines'],
    ['line-clamp', 'block-ellipsis'],
    ['continue', 'line-clamp'],
    ['glyph-orientation-vertical', 'text-orientation'],
    ['-webkit-box-flex', 'flex-grow'],
    ['-webkit-box-orient', 'flex-direction'],
    ['-webkit-box-direction', 'flex-direction'],
    ['-webkit-box-ordinal-group', 'order'],
    ['-webkit-box-align', 'align-items'],
    ['-webkit-box-pack', 'justify-content'],
    ['MARGIN-TOP', 'margin'],
    ['-moz-transition', 'transition-duration'],
  ];

  for (const [between, moved] of pairs) {
    it(`keeps ${moved} after ${between}`, () => {
      const input = `.a{x:1}.b{${between}:1}.a{${moved}:2}`;
      keepCascade(input, input);
    });
  }
});

describe('Keep cascade - option', () => {
  it('combines around a conflicting rule when the option is off', () => {
    const input = '.a{color:red}.b{color:blue}.a{color:green}';
    const expected = '.a{color:red;color:green}.b{color:blue}';
    testFactory([plugin({ keepCascade: false })])(input, expected);
    // @ts-expect-error plain JavaScript callers can pass null
    testFactory([plugin({ keepCascade: null })])(input, expected);
    testFactory([plugin()])(input, expected);
  });

  it('removes duplicated properties in the rules it combines', () => {
    testFactory([
      plugin({ keepCascade: true, removeDuplicatedProperties: true }),
    ])('.a{color:red}.b{x:1}.a{color:green}', '.a{color:green}.b{x:1}');
  });

  it('keeps rules apart around a property name with an interpolation', () => {
    const input = '.a{x:1}.b{#{$p}-top:1px}.a{margin:0}';
    testFactory([plugin({ keepCascade: true })], postcssScss)(input, input);
  });

  it('throws on a value that is not a boolean', () => {
    assert.throws(
      // @ts-expect-error the type accepts only booleans
      () => plugin({ keepCascade: 'yes' }),
      {
        name: 'TypeError',
        message:
          'postcss-combine-duplicated-selectors: keepCascade must be false or true, not "yes"',
      },
    );
  });
});
