// TypeScript Version: 4.0
import { PluginCreator } from "postcss";

declare namespace postcssCombineDuplicatedSelectors {
  /**
   * Options for postcss-combine-duplicated selectors
   */
  type Options =
    | {
        removeDuplicatedValues?: false;
        removeDuplicatedProperties?: false;
      }
    | {
        removeDuplicatedProperties: true;
        removeDuplicatedValues?: false;
      }
    | {
        removeDuplicatedProperties?: false;
        removeDuplicatedValues: true;
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

export = postcssCombineDuplicatedSelectors;
