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

  /**
   * Either root export or default export can be used
   */
  type Exported = Plugin & { default: Plugin };
}

/**
 * Automatically detects and combines duplicated css selectors
 */
declare const postcssCombineDuplicatedSelectors: postcssCombineDuplicatedSelectors.Exported;

export = postcssCombineDuplicatedSelectors;
