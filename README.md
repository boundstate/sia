# sia - doc generator for AngularJS modules

_sia_ is a documentation generator built on [dgeni] that uses [Angular Material] and is heavily inspired by it's docs.

## Usage

```sh
npm install sia
```

```js
// gulpfile.js
var gulp = require('gulp');
var pkg = require('./package.json');

require('sia')(gulp, {
  moduleTitle: 'My App',
  modulePrefix: 'myApp',
  version: pkg.version,
  ngVersion: '1.4.6',
  repositoryUrl: pkg.repository && pkg.repository.url.replace(/^git/, 'https').replace(/(\.git)?\/?$/,'')
});
```

[dgeni]: https://github.com/angular/dgeni
[Angular Material]: https://material.angularjs.org/