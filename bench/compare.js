import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import postcss from 'postcss';
import lite from 'cssnano-preset-lite';
import mergeRules from 'postcss-merge-rules';
import { transform } from 'lightningcss';
import plugin from '../src/index.js';
import { frameworks } from './_frameworks.js';

/** Markdown table of the bytes each tool removes, for the README */

const repository = new URL('..', import.meta.url);

/**
 * @param {Array<string>} parameters - arguments to git
 * @return {string} what git printed, trimmed
 */
function runGit(parameters) {
  return execFileSync('git', parameters, {
    cwd: repository,
    encoding: 'utf8',
  }).trim();
}

if (runGit(['status', '--porcelain', '--', 'src'])) {
  throw new Error(
    'Commit the changes in src/ first, so the commit is the code measured',
  );
}

// Removes comments, whitespace and empty rules, so formatting is not a saving
const stripFormatting = postcss(
  lite().plugins.map(([create, options]) => create(options)),
);

/**
 * @typedef {{bytes: number, gzip: number}} Size
 */

/**
 * @param {string} css - stylesheet
 * @return {Size} bytes once formatting is stripped, plain and gzipped
 */
function getSize(css) {
  const text = stripFormatting.process(css, { from: undefined }).css;
  return { bytes: Buffer.byteLength(text), gzip: gzipSync(text).length };
}

/**
 * @param {string} css - stylesheet
 * @return {string} the stylesheet minified by Lightning CSS
 */
function minify(css) {
  const { code, warnings } = transform({
    filename: 'input.css',
    code: Buffer.from(css),
    minify: true,
    errorRecovery: true,
  });
  // A rule dropped to recover from an error would count as a saving
  if (warnings.length > 0) {
    throw new Error(`Lightning CSS: ${warnings[0]?.message}`);
  }
  return code.toString();
}

/**
 * @param {number} before - bytes before
 * @param {number} after - bytes after
 * @return {string} the share removed, as a percentage
 */
function formatPercent(before, after) {
  const share = ((before - after) / before) * 100;
  return `${Math.abs(share) < 0.005 ? '0.00' : share.toFixed(2)}%`;
}

/**
 * @param {Size} before - size of the input
 * @param {Size} after - size of the output
 * @return {string} the share of bytes removed, plain and gzipped
 */
function getShare(before, after) {
  return `${formatPercent(before.bytes, after.bytes)} / ${formatPercent(before.gzip, after.gzip)}`;
}

const combine = postcss([plugin()]);
const combineProperties = postcss([
  plugin({ removeDuplicatedProperties: true }),
]);
const merge = postcss([mergeRules()]);

const rows = [
  '| Stylesheet | This plugin | `removeDuplicatedProperties` | postcss-merge-rules | Lightning CSS | Bytes this plugin adds to postcss-merge-rules | Bytes this plugin adds to Lightning CSS |',
  '| --- | --- | --- | --- | --- | --- | --- |',
];
for (const [framework, css] of Object.entries(frameworks)) {
  const input = getSize(css);
  const combined = combine.process(css, { from: undefined }).css;
  const merged = getSize(merge.process(css, { from: undefined }).css);
  const minified = getSize(minify(css));
  const cells = [
    getShare(input, getSize(combined)),
    getShare(
      input,
      getSize(combineProperties.process(css, { from: undefined }).css),
    ),
    getShare(input, merged),
    getShare(input, minified),
    merged.bytes -
      getSize(merge.process(combined, { from: undefined }).css).bytes,
    minified.bytes - getSize(minify(combined)).bytes,
  ];
  rows.push(`| ${framework} | ${cells.join(' | ')} |`);
}

/**
 * @param {URL} folder - folder holding node_modules
 * @param {string} name - package name
 * @return {string} the installed version
 */
function getVersion(folder, name) {
  const path = new URL(`node_modules/${name}/package.json`, folder);
  return JSON.parse(readFileSync(path, 'utf8')).version;
}

const benchFolder = new URL('./', import.meta.url);
/** @type {{dependencies: Record<string, string>}} */
const benchManifest = JSON.parse(
  readFileSync(new URL('package.json', benchFolder), 'utf8'),
);
const versions = [
  `Node.js ${process.versions.node}`,
  `postcss ${getVersion(repository, 'postcss')}`,
  ...Object.keys(benchManifest.dependencies).map(
    (name) => `${name} ${getVersion(benchFolder, name)}`,
  ),
].join(', ');
const commit = runGit(['rev-parse', '--short', 'HEAD']);
const date = new Date().toISOString().slice(0, 10);

console.log(rows.join('\n'));
console.log(`\nMeasured on ${date} at commit \`${commit}\` with ${versions}.`);
