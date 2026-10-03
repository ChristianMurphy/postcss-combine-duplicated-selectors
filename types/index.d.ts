// TypeScript Version: 4.0
import { PluginCreator } from 'postcss';

declare namespace postcssCombineDuplicatedSelectors {
  /**
   * How to remove duplicated declarations from each rule.
   *
   * - `true`: remove a declaration when a later declaration of the same
   *   property has an equal value.
   * - `'syntax'`: also remove it when the later value has the same units,
   *   functions and keywords in the same positions. `margin: 10px` followed
   *   by `margin: 5px` is removed, but stays when followed by
   *   `margin: 1rem`. This follows stylelint's same-syntax rule for
   *   duplicated properties.
   *
   * In every mode, an `!important` declaration stays when the later
   * declaration does not have the flag.
   */
  type DuplicatedValuesMode = true | 'syntax';

  /**
   * Options for postcss-combine-duplicated-selectors. Set at most one of
   * `removeDuplicatedProperties` and `removeDuplicatedValues`.
   */
  type Options =
    | {
        /** Keep every duplicated declaration. */
        removeDuplicatedValues?: false;
        /** Keep every duplicated declaration. */
        removeDuplicatedProperties?: false;
      }
    | {
        /**
         * Keep only the last declaration of each property, or the last
         * `!important` one when an earlier declaration has the flag.
         */
        removeDuplicatedProperties: true;
        removeDuplicatedValues?: false;
      }
    | {
        removeDuplicatedProperties?: false;
        /** Remove duplicated declarations; see {@link DuplicatedValuesMode}. */
        removeDuplicatedValues: DuplicatedValuesMode;
      };

  /**
   * Plugin provides a creator with specific options supported
   */
  type Plugin = PluginCreator<Options>;
}

/**
 * Automatically detects and combines duplicated css selectors
 *
 * @example
 * ```typescript
 * postcss([postcssCombineDuplicatedSelectors()]);
 * ```
 */
declare const postcssCombineDuplicatedSelectors: postcssCombineDuplicatedSelectors.Plugin;

export default postcssCombineDuplicatedSelectors;
