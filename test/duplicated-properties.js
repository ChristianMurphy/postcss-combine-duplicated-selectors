const {describe, it} = require('node:test');
const testFactory = require('./_test-factory');
const plugin = require('../src');

/**
 * These tests check if duplicated properties are deleted or maintained
 * according configuration settings.
 */

/**
 * Take string literals and remove newlines and extra spacing so results print
 * as expected in logs
 * @return {string} string without newlines and tabs
 */
function minify([string]) {
  return string.replace(/\s+/gm, ' ');
}

// Duplicated properties should be removed
const removeDuplicates = testFactory('css', [
  plugin({removeDuplicatedProperties: true}),
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
  ];

  for (const {label, input, expected} of cases) {
    it(label, () => {
      removeDuplicates({}, input, expected);
    });
  }
});

// Duplicated properties should be maintained
const keepDuplicates = testFactory('css', [
  plugin({removeDuplicatedProperties: false}),
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

  for (const {label, input, expected} of cases) {
    it(label, () => {
      keepDuplicates({}, input, expected);
    });
  }
});

// Only duplicated properties with matching values should be removed
const removeExactDuplicates = testFactory('css', [
  plugin({removeDuplicatedValues: true}),
]);

describe('Duplicated Properties - Remove Exact Duplicates', () => {
  const cases = [
    {
      label:
        // eslint-disable-next-line max-len
        'remove duplicated properties with matching values (combined selectors)',
      input:
        // eslint-disable-next-line max-len
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
  ];

  for (const {label, input, expected} of cases) {
    it(label, () => {
      removeExactDuplicates({}, input, expected);
    });
  }
});
