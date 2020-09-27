import postcss from "postcss";

// default export
import postcssCombineDuplicatedSelectors from "postcss-combine-duplicated-selectors";

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
    removeDuplicatedProperties: true, // $ExpectError
  }),
]);

// root export
import * as postcssCombineDuplicatedSelectors2 from "postcss-combine-duplicated-selectors";

postcss([postcssCombineDuplicatedSelectors2()]);
postcss([
  postcssCombineDuplicatedSelectors2({ removeDuplicatedProperties: true }),
]);
postcss([
  postcssCombineDuplicatedSelectors2({ removeDuplicatedProperties: false }),
]);
postcss([postcssCombineDuplicatedSelectors2({ removeDuplicatedValues: true })]);
postcss([
  postcssCombineDuplicatedSelectors2({ removeDuplicatedValues: false }),
]);
postcss([
  postcssCombineDuplicatedSelectors2({
    removeDuplicatedValues: true,
    removeDuplicatedProperties: true, // $ExpectError
  }),
]);
