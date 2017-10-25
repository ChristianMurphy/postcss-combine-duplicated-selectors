const postcss = require('postcss');

/**
 * Generates test functions and test titles
 *
 * @param {string} version - string description of parser version
 * @param {Array<Object>} plugins - postcss plugins to use with tests
 * @param {Object} [syntax] - optional alternative syntax parser
 * @return {function} test function
 *
 * NOTE: this is an ".es" file because ava does not compile helpers,
 * instead "_factories.js" is built in the "pretest" step in "package.json"
 */
module.exports = function testFactory(version, plugins, syntax) {
  let tester = null;

  // setup test macro
  if (syntax) {
    tester = (t, input, expected) => {
      const actual = postcss(plugins).process(input, {syntax}).css;
      t.is(expected, actual);
    };
  } else {
    tester = (t, input, expected) => {
      const actual = postcss(plugins).process(input).css;
      t.is(expected, actual);
    };
  }

  // setup test macro title
  tester.title = (providedTitle, input, expected) => providedTitle ?
    `${providedTitle} in ${version}` :
    `"${input}" becomes "${expected}" in ${version}`;

  return tester;
};
