# postcss combine duplicated selectors

Automatically detects and combines duplicated css selectors so you don't have to
:smile:

Input

``` css
.module {color: green} .module {background: red}
```

Output

``` css
.module {color: green;background: red}'
```
