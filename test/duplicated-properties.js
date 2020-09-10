const test = require('ava');
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
const removeDuplicates = testFactory(
    'css',
    [plugin({removeDuplicatedProperties: true})],
);

test(
    'remove duplicated properties when combining selectors',
    removeDuplicates,
    '.a {height: 10px; color: black;} .a {color: blue; width: 20px;}',
    '.a {height: 10px;color: blue; width: 20px;}',
);

test(
    'remove duplicated properties in a selector',
    removeDuplicates,
    minify`
.a {
  height: 10px;
  background: orange;
  background: rgba(255, 165, 0, 0.5);
}
`,
    minify`
.a {
  height: 10px;
  background: rgba(255, 165, 0, 0.5);
}
`,
);

// Duplicated properties should be maintained
const keepDuplicates = testFactory(
    'css',
    [plugin({removeDuplicatedProperties: false})],
);

test(
    'maintain duplicated properties when combining selectors',
    keepDuplicates,
    '.a {height: 10px; color: black;} .a {color: blue; width: 20px;}',
    '.a {height: 10px; color: black;color: blue; width: 20px;}',
);

test(
    'maintain duplicated properties in a selector',
    keepDuplicates,
    minify`
.a {
  height: 10px;
  background: orange;
  background: rgba(255, 165, 0, 0.5);
}
`,
    minify`
.a {
  height: 10px;
  background: orange;
  background: rgba(255, 165, 0, 0.5);
}
`,
);

// Only duplicated properties with matching values should be removed
const removeExactDuplicates = testFactory(
    'css',
    [plugin({removeDuplicatedValues: true})],
);

test(
    'remove duplicated properties with matching values with combined selectors',
    removeExactDuplicates,
    '.a {height: 10px; color: red;} .a {color: red; color: blue; width: 20px;}',
    '.a {height: 10px;color: red; color: blue; width: 20px;}',
);

test(
    'remove duplicated properties with matching values in a selector',
    removeExactDuplicates,
    minify`
.a {
  height: 10px;
  background: orange;
  background: orange;
  background: rgba(255, 165, 0, 0.5);
}
`,
    minify`
.a {
  height: 10px;
  background: orange;
  background: rgba(255, 165, 0, 0.5);
}
`,
);

test(
    'remove duplicate property with matching value, allow fallback',
    removeExactDuplicates,
    minify`
.a {
  height: 10px;
}
.a {
  height: 10px;
  height: var(--linkHeight);
}
`,
    minify`
.a {
  height: 10px;
  height: var(--linkHeight);
}
`,
);
