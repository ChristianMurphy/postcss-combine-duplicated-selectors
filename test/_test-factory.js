import postcss from 'postcss';
import assert from 'node:assert/strict';

/**
 * Creates a checker that runs CSS through a fixed set of PostCSS plugins
 *
 * @param {Array<Object>} plugins - postcss plugins to use with tests
 * @param {Object} [syntax] - optional alternative syntax parser
 * @return {function(string, string): void} asserts input becomes expected
 */
export default function testFactory(plugins, syntax) {
  return (input, expected) => {
    const actual = postcss(plugins).process(input, { syntax }).css;
    assert.strictEqual(actual, expected);
  };
}
