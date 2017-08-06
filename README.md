# postcss combine duplicated selectors

<!-- current project status -->
[![npm](https://img.shields.io/npm/v/postcss-combine-duplicated-selectors.svg)](https://www.npmjs.com/package/postcss-combine-duplicated-selectors)
[![Linux Build Status](https://travis-ci.org/ChristianMurphy/postcss-combine-duplicated-selectors.svg?branch=master)](https://travis-ci.org/ChristianMurphy/postcss-combine-duplicated-selectors)
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/2dq6frg0c72il8v5/branch/master?svg=true)](https://ci.appveyor.com/project/ChristianMurphy/postcss-combine-duplicated-selectors/branch/master)
[![Greenkeeper badge](https://badges.greenkeeper.io/ChristianMurphy/postcss-combine-duplicated-selectors.svg)](https://greenkeeper.io/)
[![Dependency Status](https://david-dm.org/ChristianMurphy/postcss-combine-duplicated-selectors.svg)](https://david-dm.org/ChristianMurphy/postcss-combine-duplicated-selectors)
[![devDependency Status](https://david-dm.org/ChristianMurphy/postcss-combine-duplicated-selectors/dev-status.svg)](https://david-dm.org/ChristianMurphy/postcss-combine-duplicated-selectors?type=dev)

<!-- standards and technologies used in project -->
[![Built with PostCSS](https://img.shields.io/badge/built_with-postcss-blue.svg)](http://postcss.org/)
[![Semver](http://img.shields.io/SemVer/2.0.0.png)](http://semver.org/spec/v2.0.0.html)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Google code style](https://img.shields.io/badge/code_style-Google-brightgreen.svg?style=flat)](https://google.github.io/styleguide/jsguide.html)

Automatically detects and combines duplicated css selectors so you don't have to
:smile:

## Usage

### Using PostCSS JS API

``` js
'use strict';

const fs = require('fs');
const postcss = require('postcss');
const css = fs.readFileSync('src/app.css');

postcss([require('postcss-combine-duplicated-selectors')])
  .process(css, {from: 'src/app.css', to: 'app.css'})
  .then((result) => {
    fs.writeFileSync('app.css', result.css);
    if (result.map) fs.writeFileSync('app.css.map', result.map);
  });
```

### Using PostCSS CLI

``` sh
postcss --use postcss-combine-duplicated-selectors *.css
```

## Example

Input

``` css
.module {
  color: green
}
.another-module {
  color: blue
}
.module {
  background: red
}
.another-module {
  background: yellow
}
```

Output

``` css
.module {
  color: green;
  background: red
}
.another-module {
  color: blue;
  background: yellow
}
```

### Duplicated Properties

Duplicated properties can optionally be combined.

Set the `removeDuplicatedProperties` option to `true` to enable.

``` js
const postcss = require('postcss');
const combineSelectors = require('postcss-combine-duplicated-selectors');

postcss([combineSelectors({removeDuplicatedProperties: true})]);
```

When enabled the following css

``` css
.a {
  height: 10px;
  background: orange;
  background: rgba(255, 165, 0, 0.5);
}
```

will combine into

```css
.a {
  height: 10px;
  background: rgba(255, 165, 0, 0.5);
}
```

### Media Queries

If you have code with media queries, pass code through [*mq-packer*](https://github.com/hail2u/node-css-mqpacker) before *postcss-combine-duplicated-selectors* to ensure optimal results.
