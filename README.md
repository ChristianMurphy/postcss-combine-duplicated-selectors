# Postcss combine duplicated selectors

<!-- current project status -->

[![npm](https://img.shields.io/npm/v/postcss-combine-duplicated-selectors.svg)](https://www.npmjs.com/package/postcss-combine-duplicated-selectors)
[![build status](https://github.com/ChristianMurphy/postcss-combine-duplicated-selectors/workflows/CI/badge.svg)](https://github.com/ChristianMurphy/postcss-combine-duplicated-selectors/actions)

Automatically detects and combines duplicated css selectors so you don't have to
:smile:

## Usage

### Requirements

This plugin needs Node.js 24 or newer and [postcss](https://github.com/postcss/postcss) 8. To use the command line, also install [postcss-cli](https://github.com/postcss/postcss-cli).

```bash
npm install --save-dev postcss postcss-combine-duplicated-selectors
# or
yarn add --dev postcss postcss-combine-duplicated-selectors
```

### Using PostCSS JS API

```js
import fs from 'node:fs';
import postcss from 'postcss';
import combineSelectors from 'postcss-combine-duplicated-selectors';

const css = fs.readFileSync('src/app.css');

postcss([combineSelectors])
  .process(css, { from: 'src/app.css', to: 'app.css' })
  .then((result) => {
    fs.writeFileSync('app.css', result.css);
    if (result.map) fs.writeFileSync('app.css.map', result.map);
  });
```

The package ships as an ECMAScript module. CommonJS code loads it with
`require('postcss-combine-duplicated-selectors').default`.

### Using PostCSS CLI

```sh
postcss style.css --use postcss-combine-duplicated-selectors --output newcss.css
```

### Using Vite

In a `postcss.config.mjs` file:

```js
import combineSelectors from 'postcss-combine-duplicated-selectors';

export default {
  plugins: [combineSelectors],
};
```

## Example

Input

```css
.module {
  color: green;
}
.another-module {
  color: blue;
}
.module {
  background: red;
}
.another-module {
  background: yellow;
}
```

Output

```css
.module {
  color: green;
  background: red;
}
.another-module {
  color: blue;
  background: yellow;
}
```

Within one rule, a selector that repeats an earlier selector in the list is removed. For example, `.one.two, .two.one {}` becomes `.one.two {}`.

### Options

| Option                       | Values                      | Effect                                                                                                                                                                         |
| ---------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `removeDuplicatedProperties` | `false`, `true`             | `true` keeps only the last declaration of each property in each rule                                                                                                           |
| `removeDuplicatedValues`     | `false`, `true`, `'syntax'` | `true` removes a declaration only when a later one has the same property and value. `'syntax'` also removes it when the later value has the same units, functions and keywords |
| `keepCascade`                | `false`, `true`             | `true` combines a rule into an earlier one only when no rule between them sets a property it moves; see [rule order](#rule-order)                                              |

Every option defaults to `false`. Set at most one of `removeDuplicatedProperties` and `removeDuplicatedValues`. The TypeScript types reject both together. If both are set, the plugin uses `removeDuplicatedValues`.

The package includes TypeScript types. Import the options type with `import type { Options } from 'postcss-combine-duplicated-selectors'`.

### Duplicated Properties

Duplicated properties can optionally be combined.

Set the `removeDuplicatedProperties` option to `true` to enable.

```js
import postcss from 'postcss';
import combineSelectors from 'postcss-combine-duplicated-selectors';

postcss([combineSelectors({ removeDuplicatedProperties: true })]);
```

When enabled the following css

```css
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

In order to limit this to only combining properties when the values are equal, set the `removeDuplicatedValues` option to `true` instead. This could clean up duplicated properties, but allow for conscious duplicates such as fallbacks for custom properties.

```js
import postcss from 'postcss';
import combineSelectors from 'postcss-combine-duplicated-selectors';

postcss([combineSelectors({ removeDuplicatedValues: true })]);
```

This will transform the following css

```css
.a {
  height: 10px;
}

.a {
  width: 20px;
  background: var(--custom-color);
  background: rgba(255, 165, 0, 0.5);
}
```

into

```css
.a {
  height: 10px;
  width: 20px;
  background: var(--custom-color);
  background: rgba(255, 165, 0, 0.5);
}
```

Set `removeDuplicatedValues` to `'syntax'` to also remove a declaration that a later one overrides with the same kind of value. Two values match when they have the same units, functions and keywords in the same positions. The numbers can differ. A fallback with a different unit, a different function, or a different keyword stays. This follows the same-syntax rule of stylelint's [`declaration-block-no-duplicate-properties`](https://stylelint.io/user-guide/rules/declaration-block-no-duplicate-properties).

```css
.a {
  margin: 10px;
  margin: 5px;
  width: 10px;
  width: calc(100% - 1rem);
}
```

becomes

```css
.a {
  margin: 5px;
  width: 10px;
  width: calc(100% - 1rem);
}
```

In every mode, an `!important` declaration stays when a later declaration of the same property does not have the flag.

### Media Queries

For CSS with media queries, first combine the queries with [_postcss-combine-media-query_](https://github.com/SassNinja/postcss-combine-media-query) or [_postcss-merge-queries_](https://github.com/n19htz/postcss-merge-queries). Then run _postcss-combine-duplicated-selectors_ for the best results.

### Nested rules and at-rules

Selectors combine only when they sit in the same context. That means the same chain of at-rules, such as `@media` and `@supports`. With CSS nesting, it also means the same parent selectors.

```css
@media screen {
  @supports (display: grid) {
    div {
      display: grid;
    }
  }
}
@media screen {
  @supports (display: grid) {
    div {
      gap: 1rem;
    }
  }
}
@media print {
  @supports (display: grid) {
    div {
      display: block;
    }
  }
}
```

becomes

```css
@media screen {
  @supports (display: grid) {
    div {
      display: grid;
      gap: 1rem;
    }
  }
}
@media print {
  @supports (display: grid) {
    div {
      display: block;
    }
  }
}
```

Separate blocks combine only for `@media`, `@supports`, `@layer`, `@container`, `@scope` and `@starting-style`. Inside any other at-rule, such as `@keyframes`, Sass `@if` or `@mixin`, selectors combine only within the same block. A later block of those at-rules can replace an earlier one, or depend on what comes between them. Each `@layer` block without a name is a separate layer, so its selectors also combine only within the block.

### Rule order

The plugin moves the declarations of a later rule into the first rule with the same selector. When a different rule sits between them, the moved declarations come before it. That can change which declaration wins for elements that match both rules.

```css
.a {
  color: red;
}
.b {
  color: blue;
}
.a {
  color: green;
}
```

becomes

```css
.a {
  color: red;
  color: green;
}
.b {
  color: blue;
}
```

An element with both classes was green and is now blue. Check the output when your CSS depends on rule order, or set `keepCascade`.

With `keepCascade: true`, a rule combines into an earlier rule only when no rule between them sets a property it moves. The example above stays as it is, because `.b` sets `color`. The plugin treats properties that set the same value as one property, so `margin` does not move past `margin-top` or `margin-inline-start`. It takes shorthands, legacy aliases and logical properties from the CSS specifications, through [@webref/css](https://www.npmjs.com/package/@webref/css), plus a short list of browser aliases. A property it does not know joins the longest known property that its name extends. A rule that holds nested rules or at-rules, or that sets `all`, stays in place. An at-rule without a block, such as `@apply` or `@include`, counts as setting every property. When a rule cannot join the first rule with its selector, later rules join it instead.

```css
.a {
  color: red;
}
.b {
  width: 1px;
}
.a {
  height: 2px;
}
```

becomes

```css
.a {
  color: red;
  height: 2px;
}
.b {
  width: 1px;
}
```

The check compares property names, not selectors, layers or media queries. It keeps some rules apart that could combine safely.

### Plugin order

The plugin combines rules once, after every plugin's node visitors have run. Rules from other plugins, such as the rules _postcss-nested_ unwraps, combine too. A plugin listed later that runs on `OnceExit` gets the combined rules.

A PostCSS document with more than one root, such as the `<style>` elements that _postcss-html_ reads, combines rules within each root, not across them.

## Alternatives

CSS minifiers also reduce repeated rules:

- [cssnano](https://cssnano.github.io/cssnano/) does it with [postcss-merge-rules](https://www.npmjs.com/package/postcss-merge-rules). It merges rules with the same selector when it can move one rule's declarations past the rules between them. It also moves a declaration that more than one rule sets into a new rule with a selector list.
- [Lightning CSS](https://lightningcss.dev/) minifies the whole stylesheet. It rewrites values, merges adjacent rules and drops declarations that a later one overrides. Without browser targets, that includes fallbacks such as `display: flex` before `display: grid`.
