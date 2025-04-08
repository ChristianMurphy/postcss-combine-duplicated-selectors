const postcss = require('postcss');
const assert = require('node:assert/strict');

/**
 * Generates test functions and test titles
 *
 * @param {string} version - string description of parser version
 * @param {Array<Object>} plugins - postcss plugins to use with tests
 * @param {Object} [syntax] - optional alternative syntax parser
 * @return {function} test function
 */
module.exports = function testFactory(version, plugins, syntax) {
  let tester;
  if (syntax) {
    tester = (_t, input, expected) => {
      const actual = postcss(plugins).process(input, { syntax }).css;
      assert.strictEqual(actual, expected);
    };
  } else {
    tester = (_t, input, expected) => {
      const actual = postcss(plugins).process(input).css;
      assert.strictEqual(actual, expected);
    };
  }
  // Setup test macro title generator
  tester.title = (providedTitle, input, expected) =>
    providedTitle
      ? `${providedTitle} in ${version}`
      : `"${input}" becomes "${expected}" in ${version}`;
  return tester;
};
