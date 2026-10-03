/**
 * @import {AcceptedPlugin, Syntax} from 'postcss'
 */

import postcss from 'postcss';
import assert from 'node:assert/strict';

/**
 * Creates a checker that runs CSS through a fixed set of PostCSS plugins
 *
 * @param {Array<AcceptedPlugin>} plugins - postcss plugins to use with tests
 * @param {Syntax} [syntax] - optional alternative syntax parser
 * @return {(input: string, expected: string) => undefined} asserts input
 *   becomes expected
 */
export default function testFactory(plugins, syntax) {
  const options = syntax === undefined ? {} : { syntax };
  return (input, expected) => {
    const actual = postcss(plugins).process(input, options).css;
    assert.strictEqual(actual, expected);
  };
}
