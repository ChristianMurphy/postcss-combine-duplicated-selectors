# postcss combine duplicated selectors

[![Build Status](https://travis-ci.org/ChristianMurphy/postcss-combine-duplicated-selectors.svg?branch=master)](https://travis-ci.org/ChristianMurphy/postcss-combine-duplicated-selectors)
[![Dependency Status](https://david-dm.org/ChristianMurphy/postcss-combine-duplicated-selectors.svg)](https://david-dm.org/ChristianMurphy/postcss-combine-duplicated-selectors)
[![devDependency Status](https://david-dm.org/ChristianMurphy/postcss-combine-duplicated-selectors/dev-status.svg)](https://david-dm.org/ChristianMurphy/postcss-combine-duplicated-selectors?type=dev)

Automatically detects and combines duplicated css selectors so you don't have to
:smile:

## Usage

### Using PostCSS JS API

``` js
const fs = require('fs');
const postcss = require('postcss');
const css = fs.readFileSync('src/app.css');

postcss([require('postcss-combine-duplicated-selectors')])
  .process(css, {from: 'src/app.css', to: 'app.css'})
  .then(result => {
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

## Limitations

Currently the plugin does not merge media blocks.

so this code

``` css
.module {
  color: green
}
.another-module {
  color: blue
}
@media (max-width: 600px) {
  .module {
    background: red
  }
  .module {
    color: white
  }
}
@media (max-width: 600px) {
  .another-module {
    background: yellow
  }
  .another-module {
    color: red
  }
}
```

produces this output

``` css
.module {
  color: green;
}
.another-module {
  color: blue;
}
@media (max-width: 600px) {
  .module {
    background: red
    color: white
  }
}
@media (max-width: 600px) {
  .another-module {
    background: yellow
    color: red
  }
 ```
## Recommendation
[mq-packer is an excellent plugin for combining media queries.](https://github.com/hail2u/node-css-mqpacker)
