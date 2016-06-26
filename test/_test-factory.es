import postcss from 'postcss';

/**
 * Generates test functions and test titles
 *
 * NOTE: this is an ".es" file because ava does not compile helpers,
 * instead "_factories.js" is built in the "pretest" step in "package.json"
 */

export default function testFactory(version, plugins, syntax) {
  let tester = null;

  // setup test macro
  if (syntax) {
    tester = (t, input, expected) => {
      const actual = postcss(plugins).process(input, {syntax}).css;
      t.is(actual, expected);
    };
  } else {
    tester = (t, input, expected) => {
      const actual = postcss(plugins).process(input).css;
      t.is(actual, expected);
    };
  }

  // setup test macro title
  tester.title = (providedTitle, input, expected) => providedTitle ?
    `${providedTitle} in ${version}` :
    `"${input}" becomes "${expected}" in ${version}`;

  return tester;
}
