import { bench } from 'node:bench';
import postcss from 'postcss';
import plugin from '../src/index.js';
import { frameworks, modes } from './_frameworks.js';

const benchOptions = { samples: 30, warmup: 3 };

for (const [framework, css] of Object.entries(frameworks)) {
  // Subtract this baseline from a mode's time to get the plugin's own cost.
  // It parses directly, since PostCSS skips parsing when no plugin runs.
  bench(`${framework}, parse and stringify only`, benchOptions, (context) => {
    context.start();
    postcss.parse(css).toString();
    context.end(1);
  });
  for (const [mode, options] of Object.entries(modes)) {
    const processor = postcss([plugin(options)]);
    bench(`${framework}, ${mode}`, benchOptions, (context) => {
      context.start();
      processor.process(css, { from: undefined }).toString();
      context.end(1);
    });
  }
}
