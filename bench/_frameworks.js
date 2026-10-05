import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as tailwind from 'tailwindcss';

/**
 * @param {string} specifier - package path of a stylesheet
 * @return {string} the stylesheet's text
 */
function readCss(specifier) {
  return readFileSync(fileURLToPath(import.meta.resolve(specifier)), 'utf8');
}

/**
 * Builds every utility Tailwind lists, since the package ships no built CSS.
 * The class list comes from `__unstable__loadDesignSystem`, which a Tailwind
 * update can rename or remove.
 *
 * @return {Promise<string>} the built stylesheet
 */
async function buildTailwind() {
  const source = '@import "tailwindcss";';
  const options = {
    base: import.meta.dirname,
    loadStylesheet: async (/** @type {string} */ id) => {
      const path = fileURLToPath(
        import.meta.resolve(
          id === 'tailwindcss' ? 'tailwindcss/index.css' : id,
        ),
      );
      return { path, base: dirname(path), content: readFileSync(path, 'utf8') };
    },
  };
  const designSystem = await tailwind.__unstable__loadDesignSystem(
    source,
    options,
  );
  const compiler = await tailwind.compile(source, options);
  return compiler.build(designSystem.getClassList().map(([name]) => name));
}

/** Stylesheets of popular frameworks, by package name */
export const frameworks = {
  tailwindcss: await buildTailwind(),
  bootstrap: readCss('bootstrap/dist/css/bootstrap.css'),
  daisyui: readCss('daisyui/daisyui.css'),
  '@mantine/core': readCss('@mantine/core/styles.css'),
  '@radix-ui/themes': readCss('@radix-ui/themes/styles.css'),
  bulma: readCss('bulma/css/bulma.css'),
  // #1064 reported a hang on this stylesheet with removeDuplicatedProperties
  'open-props': readCss('open-props/open-props.min.css'),
  // Bootstrap's Sass compiled together with each project's own partials
  '@tabler/core': readCss('@tabler/core/dist/css/tabler.css'),
  'bootswatch/brite': readCss('bootswatch/dist/brite/bootstrap.css'),
  'bootswatch/zephyr': readCss('bootswatch/dist/zephyr/bootstrap.css'),
};

/** Each way to configure the plugin, by a label */
export const modes = {
  default: {},
  'removeDuplicatedValues: true': { removeDuplicatedValues: true },
  "removeDuplicatedValues: 'syntax'": { removeDuplicatedValues: 'syntax' },
  'removeDuplicatedProperties: true': { removeDuplicatedProperties: true },
};
