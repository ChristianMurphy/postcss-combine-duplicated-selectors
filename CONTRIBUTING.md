# Contributing Guide

## Requesting a feature

1.  [Open an issue on GitHub](https://github.com/ChristianMurphy/postcss-combine-duplicated-selectors/issues/new)
2.  Include a description of the desired feature
3.  Include an example input and output
4.  Consider opening a [Pull Request](https://github.com/Roshanjossey/first-contributions#readme)

## Reporting an Issue

1.  [Open an issue on GitHub](https://github.com/ChristianMurphy/postcss-combine-duplicated-selectors/issues/new)
2.  Include any logs or stacktraces in a [Markdown fenced block](https://help.github.com/articles/creating-and-highlighting-code-blocks/)
3.  Consider opening a [Pull Request](https://github.com/Roshanjossey/first-contributions#readme) resolving the issue.

## Contributing Code

1.  First time opening a Pull Request? [Checkout this Pull Request guide!](https://github.com/Roshanjossey/first-contributions#readme)
2.  Create a fork of the repository
3.  Clone the fork
4.  Install npm dependencies `npm install`
5.  Make changes
6.  Ensure changes pass tests `npm test`
7.  Commit changes `npm run-script commit`
8.  Push changes to GitHub
9.  Open a Pull Request

## Benchmarking

`npm run bench` times the plugin on the CSS of popular frameworks with each option.
It needs Node.js 26.9 or later.

1.  Install the frameworks: `npm ci --prefix bench --omit=peer`
2.  Run the benchmark: `npm run bench`
3.  Save results as JSON to compare later: `node --experimental-bench --bench --bench-reporter=json bench/frameworks.js > before.ndjson`
4.  Check how many rules and bytes each mode removes: `npm run bench:removed`. A faster run that removes less is not a win.

## Additional Resources

- [PostCSS API](http://api.postcss.org)
- [PostCSS Selector Parser API](https://github.com/postcss/postcss-selector-parser/blob/master/API.md)
