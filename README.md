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
  basePath: __dirname,
  moduleTitle: 'My App',
  modulePrefix: 'myApp',
  version: pkg.version,
  ngVersion: '1.4.6',
  repositoryUrl: pkg.repository && pkg.repository.url.replace(/^git/, 'https').replace(/(\.git)?\/?$/,'')
});
```

```sh
gulp docs
```

Components are separated into two categories:
 
#### Core components

Services belonging to the `core` submodule (e.g. `myApp.core`)

#### Other components

Documentation is only generated for other components whose modules are also documented.  For example, if you have a directive 
belonging to `myApp.components.accordion` you must also add an `ngDoc` for that module:

```js
/**
 * @ngdoc module
 * @name myApp.components.accordion
 */
 
/**
 * @ngdoc directive
 * @name accordion
 * @module myApp.components.accordion
 * @description
 * Accordion
 */
 ```

[dgeni]: https://github.com/angular/dgeni
[Angular Material]: https://material.angularjs.org/