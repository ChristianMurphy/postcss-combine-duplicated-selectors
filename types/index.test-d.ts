import postcss from 'postcss';

// root export
import postcssCombineDuplicatedSelectors from './index';

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
  postcssCombineDuplicatedSelectors({
    removeDuplicatedValues: true,
    // @ts-expect-error both options cannot be enabled together
    removeDuplicatedProperties: true,
  }),
]);
