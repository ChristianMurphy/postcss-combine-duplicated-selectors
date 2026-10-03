/**
 * @import {Arbitrary, Parameters} from 'fast-check'
 */

import fc from 'fast-check';
import { Document, Element } from 'domhandler';

/**
 * A compound selector, with simple selectors as indexes into `spellings`
 * @typedef {{tag: string, simples: Array<number>}} Compound
 */

/**
 * A random element for css-select to match against
 * @typedef {{
 *   tag: 'div' | 'a',
 *   classes: Array<string>,
 *   hasId: boolean,
 *   attribute: '' | '1' | '2',
 *   isHovered: boolean,
 *   children: Array<ElementShape>,
 * }} ElementShape
 */

// `npm run fuzz` sets npm_lifecycle_event, and the test runner passes it on to
// each test file
const isFuzzing = process.env['npm_lifecycle_event'] === 'fuzz';

/**
 * A fixed seed keeps `npm test` reproducible. Fuzzing uses a random seed, which
 * fast-check prints on failure.
 *
 * @param {number} numRuns - runs in `npm test`
 * @return {Parameters<unknown>} fast-check parameters
 */
export function getParameters(numRuns) {
  return isFuzzing ? { numRuns: numRuns * 100 } : { numRuns, seed: 1 };
}

// Every spelling in a row matches the same elements in HTML, where attribute
// names ignore case. Short names collide on purpose: `a.b` against `.ba`,
// `.b.a` against `.ba`
const spellings = [
  ['.a'],
  ['.b'],
  ['.ba'],
  ['#x'],
  ['[a="1"]', "[a='1']", '[a=1]', '[A="1"]'],
  [':hover', ':HOVER'],
  [':is(.a,.b)', ':is(.b, .a)', ':is(.a,.b,.a)'],
  [':not(.b.a)', ':not(.a.b)'],
  [':where(.a)'],
];

/**
 * @param {number} simple - index into `spellings`
 * @param {number} variant - which spelling to use
 * @return {string} selector text
 */
function spell(simple, variant) {
  const row = spellings[simple] ?? [];
  return row[variant % row.length] ?? '';
}

/** @type {Arbitrary<Compound>} */
const compound = fc
  .record({
    tag: fc.constantFrom('', 'div', 'a', '*'),
    simples: fc.array(fc.nat(spellings.length - 1), { maxLength: 3 }),
  })
  .filter(({ tag, simples }) => tag !== '' || simples.length > 0);

/**
 * @param {Array<Compound>} compounds - compounds to join
 * @param {Array<string>} combinators - one fewer than the compounds
 * @param {Array<Array<number>>} variants - spelling of each simple selector
 * @return {string} selector text
 */
function render(compounds, combinators, variants) {
  return compounds
    .map(
      ({ tag, simples }, index) =>
        (index === 0 ? '' : combinators[index - 1]) +
        tag +
        simples
          .map((simple, position) =>
            spell(simple, variants[index]?.[position] ?? 0),
          )
          .join(''),
    )
    .join('');
}

/**
 * Swaps one simple selector between the first two compounds, or moves it
 * when the second has none. This usually changes what the selector matches.
 *
 * @param {Array<Compound>} compounds - compounds of a selector
 * @param {[number, number]} positions - positions to swap
 * @return {Array<Compound>} compounds after the swap
 */
function swapSimples(compounds, [from, to]) {
  const [first, second, ...rest] = compounds;
  // A first compound left empty would start the selector with a combinator
  if (!first || !second || first.simples.length <= (first.tag ? 0 : 1)) {
    return compounds;
  }
  const fromIndex = from % first.simples.length;
  const toIndex = to % (second.simples.length + 1);
  const moved = first.simples[fromIndex] ?? 0;
  const replacement = second.simples[toIndex];
  return [
    {
      ...first,
      simples:
        replacement === undefined
          ? first.simples.toSpliced(fromIndex, 1)
          : first.simples.with(fromIndex, replacement),
    },
    { ...second, simples: second.simples.toSpliced(toIndex, 1, moved) },
    ...rest,
  ];
}

/**
 * Two selectors, where the second reorders and respells the first, and
 * sometimes swaps a simple selector across a combinator. Independent random
 * selectors almost never merge, so they would rarely reach the plugin's
 * comparison.
 *
 * @type {Arbitrary<{first: string, second: string}>}
 */
export const selectorPair = fc
  .array(compound, { minLength: 1, maxLength: 3 })
  .chain((compounds) =>
    fc.record({
      compounds: fc.constant(compounds),
      combinators: fc.array(fc.constantFrom(' ', ' > ', '+', ' ~ '), {
        minLength: compounds.length - 1,
        maxLength: compounds.length - 1,
      }),
      shuffled: fc.tuple(
        ...compounds.map(({ simples }) =>
          fc.shuffledSubarray(simples, { minLength: simples.length }),
        ),
      ),
      variants: fc.tuple(
        ...compounds.map(({ simples }) =>
          fc.array(fc.nat(), {
            minLength: simples.length,
            maxLength: simples.length,
          }),
        ),
      ),
      swap: fc.option(fc.tuple(fc.nat(), fc.nat())),
    }),
  )
  .map(({ compounds, combinators, shuffled, variants, swap }) => {
    const reordered = compounds.map((item, index) => ({
      ...item,
      simples: shuffled[index] ?? item.simples,
    }));
    return {
      first: render(compounds, combinators, []),
      second: render(
        swap ? swapSimples(reordered, swap) : reordered,
        combinators,
        variants,
      ),
    };
  });

/**
 * @param {number} depth - levels of children below this element
 * @return {Arbitrary<ElementShape>} an element and its children
 */
function getElementShape(depth) {
  return fc.record({
    tag: fc.constantFrom('div', 'a'),
    classes: fc.subarray(['a', 'b', 'ba']),
    hasId: fc.boolean(),
    attribute: fc.constantFrom('', '1', '2'),
    isHovered: fc.boolean(),
    children:
      depth === 0
        ? fc.constant([])
        : fc.array(getElementShape(depth - 1), { maxLength: 3 }),
  });
}

/** @type {Arbitrary<Array<ElementShape>>} */
export const elementShapes = fc.array(getElementShape(3), {
  minLength: 1,
  maxLength: 3,
});

/**
 * @param {ElementShape} shape - element to build
 * @return {Element} a domhandler element with its children
 */
function buildElement({ tag, classes, hasId, attribute, isHovered, children }) {
  /** @type {Record<string, string>} */
  const attributes = { class: classes.join(' ') };
  if (hasId) attributes['id'] = 'x';
  if (attribute) attributes['a'] = attribute;
  if (isHovered) attributes['data-hover'] = '';
  const built = new Element(tag, attributes, children.map(buildElement));
  for (const child of built.children) child.parent = built;
  return built;
}

/**
 * @param {Array<ElementShape>} shapes - top-level elements
 * @return {Document} a document css-select can query
 */
export function buildDocument(shapes) {
  const document = new Document(shapes.map(buildElement));
  for (const child of document.children) child.parent = document;
  return document;
}

/** css-select options that match `:hover` against the `data-hover` attribute */
export const selectOptions = { pseudos: { hover: '[data-hover]' } };

const declaration = fc
  .record({
    property: fc.constantFrom('margin', 'color'),
    value: fc.constantFrom(
      '10px',
      '5px',
      '1rem',
      'red',
      'RED',
      '#fff',
      'var(--a)',
      '1px 2px',
    ),
    isImportant: fc.boolean(),
  })
  .map(
    ({ property, value, isImportant }) =>
      `${property}: ${value}${isImportant ? ' !important' : ''}`,
  );

const declarations = fc
  .array(declaration, { minLength: 1, maxLength: 3 })
  .map((items) => items.join('; '));

/**
 * @param {Array<string>} selectors - selectors rules can use
 * @param {number} depth - levels of at-rules allowed
 * @return {Arbitrary<string>} a rule, or an at-rule with rules inside
 */
function getBlock(selectors, depth) {
  const list = fc
    .array(fc.constantFrom(...selectors), { minLength: 1, maxLength: 3 })
    .map((items) => items.join(', '));
  const rule = fc
    .tuple(list, declarations)
    .map(([selector, body]) => `${selector} { ${body} }`);
  const keyframes = fc
    .array(
      fc
        .tuple(fc.constantFrom('from', 'to', '50%'), declarations)
        .map(([selector, body]) => `${selector} { ${body} }`),
      { minLength: 1, maxLength: 3 },
    )
    .map((rules) => `@keyframes k { ${rules.join(' ')} }`);
  if (depth === 0) return fc.oneof(rule, keyframes);
  const media = fc
    .tuple(
      fc.constantFrom('(width: 1px)', '(width: 2px)'),
      fc.array(getBlock(selectors, depth - 1), { minLength: 1, maxLength: 3 }),
    )
    .map(([query, blocks]) => `@media ${query} { ${blocks.join(' ')} }`);
  return fc.oneof(
    { arbitrary: rule, weight: 3 },
    { arbitrary: keyframes, weight: 1 },
    { arbitrary: media, weight: 1 },
  );
}

/**
 * A stylesheet whose rules draw from a few selector pairs, so many of its
 * rules merge
 *
 * @type {Arbitrary<string>}
 */
export const stylesheet = fc
  .array(selectorPair, { minLength: 1, maxLength: 3 })
  .chain((pairs) =>
    fc.array(
      getBlock(
        pairs.flatMap(({ first, second }) => [first, second]),
        1,
      ),
      { minLength: 1, maxLength: 6 },
    ),
  )
  .map((blocks) => blocks.join('\n'));

const space = fc.constantFrom('', ' ', '\n  ', ' /* c */ ');

/**
 * A stylesheet with no repeated selector in any context and no repeated
 * property in any rule, written with varied spacing and comments
 *
 * @type {Arbitrary<string>}
 */
export const uniqueStylesheet = fc
  .array(
    fc.record({
      media: fc.constantFrom('', '(width: 1px)', '(width: 2px)'),
      suffix: fc.constantFrom('', ':HOVER', "[a='1']", ' > .b', '.b.a'),
      isList: fc.boolean(),
      propertyCount: fc.integer({ min: 1, max: 3 }),
      before: space,
      after: space,
    }),
    { minLength: 1, maxLength: 6 },
  )
  .map((rules) =>
    rules
      .map(({ media, suffix, isList, propertyCount, before, after }, index) => {
        const body = Array.from(
          Array(propertyCount).keys(),
          (property) => `${before}p${property}: ${index}`,
        ).join(';');
        const selector = `.u${index}${suffix}${isList ? `,${before}.w${index}` : ''}`;
        const rule = `${selector}${after}{${body}${after}}`;
        return media ? `@media ${media}${before}{${rule}}` : rule;
      })
      .join(''),
  );
