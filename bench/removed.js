import postcss from 'postcss';
import plugin from '../src/index.js';
import { frameworks, modes } from './_frameworks.js';

/** Rules and bytes each mode removes from each framework */

/**
 * @param {string} css - stylesheet
 * @return {number} rules in the stylesheet, at any depth
 */
function countRules(css) {
  let count = 0;
  postcss.parse(css).walkRules(() => {
    count++;
  });
  return count;
}

/** @type {Array<Record<string, string | number>>} */
const removed = [];
for (const [framework, css] of Object.entries(frameworks)) {
  const rules = countRules(css);
  const bytes = Buffer.byteLength(css);
  for (const [mode, options] of Object.entries(modes)) {
    const output = postcss([plugin(options)]).process(css, {
      from: undefined,
    }).css;
    const saved = bytes - Buffer.byteLength(output);
    removed.push({
      framework,
      mode,
      'rules removed': rules - countRules(output),
      'bytes removed': saved,
      'bytes removed (%)': Number(((saved / bytes) * 100).toFixed(2)),
    });
  }
}
console.table(removed);
