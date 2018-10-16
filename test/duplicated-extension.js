const test = require('ava');
const testFactory = require('./_test-factory');
const postcssNested = require('postcss-nested');
const postcssScss = require('postcss-scss');
const plugin = require('../src');

/**
 * These tests check selectors that the plugin CAN combine together.
 * Meaning selectors provided are logically the same.
 * These tests check against css super set languages:
 * less, sass, and postcss-nested.
 */

const nestedCSS = testFactory('nested css', [postcssNested, plugin]);
const scss = testFactory('scss', [postcssNested, plugin], postcssScss);

test(
    'nested class selectors',
    [nestedCSS, scss],
    '.one.two {color: green} .one {&.two {background: red}}',
    '.one.two {color: green;background: red}'
);

test(
    'nested class selectors with  " " combinator',
    [nestedCSS, scss],
    '.one .two {color: green} .one {.two {background: red}}',
    '.one .two {color: green;background: red}'
);

test(
    'reordered nested selectors',
    [nestedCSS, scss],
    '.one.two {} .two { .one& {} }',
    '.one.two {}'
);

test(
    'multi-level nested selectors',
    [nestedCSS, scss],
    '.one .two .three {} .one { .two { .three {} } }',
    '.one .two .three {}'
);

test(
    'nested selectors with different order',
    [nestedCSS, scss],
    '.one {&.two {}} .two{&.one {}}',
    '.one.two {}'
);

test(
    'nested and un-nested selectors with different order',
    [nestedCSS, scss],
    '.one.two {} .two{&.one {}}',
    '.one.two {}'
);

test(
    'nested selector grouping',
    [nestedCSS, scss],
    '.one {&.two, .two& {}} .one {.two&, &.two {}}',
    '.one.two, .two.one {}'
);
