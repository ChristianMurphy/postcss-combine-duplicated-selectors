import postcss from "postcss";

// root export
import * as postcssCombineDuplicatedSelectors from "postcss-combine-duplicated-selectors";

postcss([postcssCombineDuplicatedSelectors()]);
postcss([
  postcssCombineDuplicatedSelectors({ removeDuplicatedProperties: true }),
]);
postcss([
  postcssCombineDuplicatedSelectors({ removeDuplicatedProperties: false }),
]);
postcss([postcssCombineDuplicatedSelectors({ removeDuplicatedValues: true })]);
postcss([
  postcssCombineDuplicatedSelectors({ removeDuplicatedValues: false }),
]);
postcss([
  postcssCombineDuplicatedSelectors({
    removeDuplicatedValues: true,
    removeDuplicatedProperties: true, // $ExpectError
  }),
]);
