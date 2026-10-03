import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import testFactory from './_test-factory.js';
import plugin from '../src/index.js';

/**
 * These tests check if duplicated properties are deleted or maintained
 * according configuration settings.
 */

/**
 * Take string literals and remove newlines and extra spacing so results print
 * as expected in logs
 * @param {TemplateStringsArray} strings - template literal parts
 * @return {string} string without newlines and tabs
 */
function minify(strings) {
  return strings.join('').replace(/\s+/gm, ' ');
}

// Duplicated properties should be removed
const removeDuplicates = testFactory([
  plugin({ removeDuplicatedProperties: true }),
]);

describe('Duplicated Properties - Removed', () => {
  const cases = [
    {
      label: 'remove duplicated properties when combining selectors',
      input: '.a {height: 10px; color: black;} .a {color: blue; width: 20px;}',
      expected: '.a {height: 10px;color: blue; width: 20px;}',
    },
    {
      label: 'remove duplicated properties in a selector',
      input: minify`
.a {
  height: 10px;
  background: orange;
  background: rgba(255, 165, 0, 0.5);
}
`,
      expected: minify`
.a {
  height: 10px;
  background: rgba(255, 165, 0, 0.5);
}
`,
    },
    {
      label: 'keep an !important declaration over a later one',
      input: '.a {color: red !important; color: blue}',
      expected: '.a {color: red !important}',
    },
    {
      label: 'keep a later !important declaration',
      input: '.a {color: red; color: blue !important}',
      expected: '.a { color: blue !important}',
    },
    {
      label: 'keep the last of several !important declarations',
      input: '.a {color: red !important; color: blue; color: green !important}',
      expected: '.a { color: green !important}',
    },
    {
      label: 'keep comments between duplicated properties',
      input: '.a {/* one */color: red;/* two */color: blue}',
      expected: '.a {/* one *//* two */color: blue}',
    },
    {
      label: 'keep nested rules',
      input: '.a {&:hover {x: 1} &:focus {x: 2}}',
      expected: '.a {&:hover {x: 1} &:focus {x: 2}}',
    },
  ];

  for (const { label, input, expected } of cases) {
    it(label, () => {
      removeDuplicates(input, expected);
    });
  }
});

// Duplicated properties should be maintained
const keepDuplicates = testFactory([
  plugin({ removeDuplicatedProperties: false }),
]);

describe('Duplicated Properties - Kept', () => {
  const cases = [
    {
      label: 'maintain duplicated properties when combining selectors',
      input: '.a {height: 10px; color: black;} .a {color: blue; width: 20px;}',
      expected: '.a {height: 10px; color: black;color: blue; width: 20px;}',
    },
    {
      label: 'maintain duplicated properties in a selector',
      input: minify`
.a {
  height: 10px;
  background: orange;
  background: rgba(255, 165, 0, 0.5);
}
`,
      expected: minify`
.a {
  height: 10px;
  background: orange;
  background: rgba(255, 165, 0, 0.5);
}
`,
    },
  ];

  for (const { label, input, expected } of cases) {
    it(label, () => {
      keepDuplicates(input, expected);
    });
  }
});

// Only duplicated properties with matching values should be removed
const removeExactDuplicates = testFactory([
  plugin({ removeDuplicatedValues: true }),
]);

describe('Duplicated Properties - Remove Exact Duplicates', () => {
  const cases = [
    {
      label:
        'remove duplicated properties with matching values (combined selectors)',
      input:
        '.a {height: 10px; color: red;} .a {color: red; color: blue; width: 20px;}',
      expected: '.a {height: 10px;color: red; color: blue; width: 20px;}',
    },
    {
      label: 'remove duplicated properties with matching values in a selector',
      input: minify`
.a {
  height: 10px;
  background: orange;
  background: orange;
  background: rgba(255, 165, 0, 0.5);
}
`,
      expected: minify`
.a {
  height: 10px;
  background: orange;
  background: rgba(255, 165, 0, 0.5);
}
`,
    },
    {
      label: 'remove duplicate property with matching value, allow fallback',
      input: minify`
.a {
  height: 10px;
}
.a {
  height: 10px;
  height: var(--linkHeight);
}
`,
      expected: minify`
.a {
  height: 10px;
  height: var(--linkHeight);
}
`,
    },
    {
      label: 'keep an !important declaration over a later equal one',
      input: '.a {color: red !important; color: red}',
      expected: '.a {color: red !important}',
    },
    {
      label: 'keep a later !important declaration with an equal value',
      input: '.a {color: red; color: red !important}',
      expected: '.a { color: red !important}',
    },
    {
      label: 'keep comments and nested rules with matching values',
      input: '.a {/* c */ x: 1; /* c */ x: 1; &:hover {y: 2} &:focus {y: 2}}',
      expected: '.a {/* c */ /* c */ x: 1; &:hover {y: 2} &:focus {y: 2}}',
    },
  ];

  for (const { label, input, expected } of cases) {
    it(label, () => {
      removeExactDuplicates(input, expected);
    });
  }
});

describe('Duplicated Properties - Options', () => {
  it('accepts null and rejects an unknown removeDuplicatedValues mode', () => {
    // Plain JavaScript callers can pass values the types reject
    // @ts-expect-error null is not a mode
    assert.doesNotThrow(() => plugin({ removeDuplicatedValues: null }));
    // @ts-expect-error 'units' is not a mode
    assert.throws(() => plugin({ removeDuplicatedValues: 'units' }), {
      name: 'TypeError',
      message:
        'postcss-combine-duplicated-selectors: removeDuplicatedValues must be false, true or \'syntax\', not "units"',
    });
  });
});

// Remove an earlier declaration when a later one has the same value syntax
const removeSameSyntax = testFactory([
  plugin({ removeDuplicatedValues: 'syntax' }),
]);

describe('Duplicated Properties - Remove Same Syntax', () => {
  const cases = [
    {
      label: 'remove a declaration with the same unit',
      input: '.a {margin-right: 10px; margin-right: 5px}',
      expected: '.a { margin-right: 5px}',
    },
    {
      label: 'keep declarations with different units',
      input: '.a {margin-right: 1rem; margin-right: 5px}',
      expected: '.a {margin-right: 1rem; margin-right: 5px}',
    },
    {
      label: 'keep declarations with different keywords',
      input: '.a {display: inline; display: initial}',
      expected: '.a {display: inline; display: initial}',
    },
    {
      label: 'keep a vendor prefixed keyword fallback',
      input: '.a {display: -webkit-box; display: flex}',
      expected: '.a {display: -webkit-box; display: flex}',
    },
    {
      label: 'keep a unit before a unitless zero',
      input: '.a {margin: 10px; margin: 0}',
      expected: '.a {margin: 10px; margin: 0}',
    },
    {
      label: 'remove a declaration with the same units in each position',
      input: '.a {margin: 10px 5px; margin: 20px 8px}',
      expected: '.a { margin: 20px 8px}',
    },
    {
      label: 'keep declarations with a different number of values',
      input: '.a {margin: 10px 5px; margin: 10px}',
      expected: '.a {margin: 10px 5px; margin: 10px}',
    },
    {
      label: 'keep a fixed value before calc()',
      input: '.a {width: 10px; width: calc(100% - 10px)}',
      expected: '.a {width: 10px; width: calc(100% - 10px)}',
    },
    {
      label: 'remove a declaration with the same function',
      input:
        '.a {color: RGB(0 0 0); color: rgb(1 1 1); width: var(--a); width: var(--b)}',
      expected: '.a { color: rgb(1 1 1); width: var(--b)}',
    },
    {
      label: 'keep units that differ only by case',
      input: '.a {width: 10PX; width: 5px}',
      expected: '.a {width: 10PX; width: 5px}',
    },
    {
      label: 'remove declarations with hex colors, numbers or strings',
      input:
        '.a {color: #fff; color: #000; z-index: 1; z-index: 2; content: "a"; content: "b"}',
      expected: '.a { color: #000; z-index: 2; content: "b"}',
    },
    {
      label: 'remove a declaration with an equal value',
      input: '.a {font-family: a, b; font-family: a, b}',
      expected: '.a { font-family: a, b}',
    },
    {
      label: 'keep a Less escape before one with a different unit',
      input: '.a {width: ~"calc(1px)"; width: ~"calc(1rem)"}',
      expected: '.a {width: ~"calc(1px)"; width: ~"calc(1rem)"}',
    },
    {
      label: 'remove a Less escape before one with the same unit',
      input: '.a {width: ~"calc(1px)"; width: ~"calc(2px)"}',
      expected: '.a { width: ~"calc(2px)"}',
    },
    {
      label: 'remove a declaration with a unicode range',
      input: '.a {unicode-range: U+0025-00FF; unicode-range: U+0100}',
      expected: '.a { unicode-range: U+0100}',
    },
    {
      label: 'keep values with different separators',
      input: '.a {grid-area: a / b; grid-area: a, b}',
      expected: '.a {grid-area: a / b; grid-area: a, b}',
    },
    {
      label: 'keep lists with different keywords',
      input: '.a {font-family: a, b; font-family: c, d}',
      expected: '.a {font-family: a, b; font-family: c, d}',
    },
    {
      label:
        'keep an !important declaration over a later one with the same unit',
      input: '.a {width: 10px !important; width: 5px}',
      expected: '.a {width: 10px !important}',
    },
  ];

  for (const { label, input, expected } of cases) {
    it(label, () => {
      removeSameSyntax(input, expected);
    });
  }
});
