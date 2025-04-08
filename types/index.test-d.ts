import {expectError} from 'tsd';
import postcss from "postcss";

// root export
import postcssCombineDuplicatedSelectors from "./index";

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
expectError(
  postcss([
    postcssCombineDuplicatedSelectors({
      removeDuplicatedValues: true,
      removeDuplicatedProperties: true, // $ExpectError
    }),
  ]) 
);
