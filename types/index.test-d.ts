import postcss from 'postcss';

// root export
import postcssCombineDuplicatedSelectors from 'postcss-combine-duplicated-selectors';

postcss([postcssCombineDuplicatedSelectors()]);
postcss([
  postcssCombineDuplicatedSelectors({ removeDuplicatedProperties: true }),
]);
postcss([
  postcssCombineDuplicatedSelectors({ removeDuplicatedProperties: false }),
]);
postcss([postcssCombineDuplicatedSelectors({ removeDuplicatedValues: true })]);
postcss([postcssCombineDuplicatedSelectors({ removeDuplicatedValues: false })]);
postcss([
  postcssCombineDuplicatedSelectors({ removeDuplicatedValues: 'syntax' }),
]);
postcss([
  postcssCombineDuplicatedSelectors({
    // @ts-expect-error only 'syntax' is a known mode
    removeDuplicatedValues: 'units',
  }),
]);
postcss([
  postcssCombineDuplicatedSelectors({
    // @ts-expect-error a mode is not a number
    removeDuplicatedValues: 1,
  }),
]);
postcss([
  postcssCombineDuplicatedSelectors({
    // @ts-expect-error removeDuplicatedProperties has no syntax mode
    removeDuplicatedProperties: 'syntax',
  }),
]);
postcss([
  postcssCombineDuplicatedSelectors({
    removeDuplicatedValues: 'syntax',
    // @ts-expect-error both options cannot be enabled together
    removeDuplicatedProperties: true,
  }),
]);
postcss([
  postcssCombineDuplicatedSelectors({
    removeDuplicatedValues: true,
    // @ts-expect-error both options cannot be enabled together
    removeDuplicatedProperties: true,
  }),
]);
