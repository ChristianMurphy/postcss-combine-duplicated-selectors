const test = require('ava');
const testFactory = require('./_test-factory');
const plugin = require('../src')({removeDuplicatedProperties: true});

/**
 * These tests remove dutplicated css properties.
 */

const css = testFactory('css', [plugin]);

test(
  'remove duplicated properties when combine selectors',
  css,
  '.a {height: 10px; color: black;} .a {color: blue; width: 20px;}',
  '.a {height: 10px; color: blue; width: 20px;}'
);

test(
  'remove duplicated properties in a selector',
  css,
  '.a {height: 10px; color: black; background: orange; background: rgba(255, 165, 0, 0.5);}',
  '.a {height: 10px; color: black; background: rgba(255, 165, 0, 0.5);}'
);
