import plugin from '../src/index.js';

/**
 * Option combinations the types accept and reject. `tsc` checks this file and
 * fails when a `@ts-expect-error` line has no error. Invalid options throw at
 * run time, so the test runner never calls this function.
 * @return {undefined}
 */
export function checkOptionTypes() {
  plugin();
  plugin({});
  plugin({ removeDuplicatedProperties: true });
  plugin({ removeDuplicatedProperties: false });
  plugin({ removeDuplicatedValues: true });
  plugin({ removeDuplicatedValues: false });
  plugin({ removeDuplicatedValues: 'syntax' });
  // @ts-expect-error only 'syntax' is a known mode
  plugin({ removeDuplicatedValues: 'units' });
  // @ts-expect-error a mode is not a number
  plugin({ removeDuplicatedValues: 1 });
  // @ts-expect-error removeDuplicatedProperties has no syntax mode
  plugin({ removeDuplicatedProperties: 'syntax' });
  // @ts-expect-error both options cannot be enabled together
  plugin({ removeDuplicatedProperties: true, removeDuplicatedValues: true });
  plugin({
    removeDuplicatedProperties: true,
    // @ts-expect-error both options cannot be enabled together
    removeDuplicatedValues: 'syntax',
  });
  plugin({ keepCascade: true });
  plugin({ keepCascade: false, removeDuplicatedProperties: true });
  plugin({ keepCascade: true, removeDuplicatedValues: 'syntax' });
  // @ts-expect-error keepCascade is a boolean
  plugin({ keepCascade: 'yes' });
}
