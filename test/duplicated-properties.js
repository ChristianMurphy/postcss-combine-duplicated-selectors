const test = require('ava');
const testFactory = require('./_test-factory');
const plugin = require('../src');

/**
 * These tests check if duplicated properties are deleted or maintained
 * according configuration settings.
 */

// Duplicated properties should be removed
const removeDuplicates = testFactory(
  'css',
  [plugin({removeDuplicatedProperties: true})]
);

test(
  'remove duplicated properties when combine selectors',
  removeDuplicates,
  '.a {height: 10px; color: black;} .a {color: blue; width: 20px;}',
  '.a {height: 10px; color: blue; width: 20px;}'
);

test(
  'remove duplicated properties in a selector',
  removeDuplicates,
  '.a {height: 10px; background: orange; background: rgba(255, 165, 0, 0.5);}',
  '.a {height: 10px; background: rgba(255, 165, 0, 0.5);}'
);

// Duplicated properties should be maintained
const keepDuplicates = testFactory(
  'css',
  [plugin({removeDuplicatedProperties: false})]
);

test(
  'maintain duplicated properties when combine selectors',
  keepDuplicates,
  '.a {height: 10px; color: black;} .a {color: blue; width: 20px;}',
  '.a {height: 10px; color: black; color: blue; width: 20px;}'
);

test(
  'maintain duplicated properties in a selector',
  keepDuplicates,
  '.a {height: 10px; background: orange; background: rgba(255, 165, 0, 0.5);}',
  '.a {height: 10px; background: orange; background: rgba(255, 165, 0, 0.5);}'
);
