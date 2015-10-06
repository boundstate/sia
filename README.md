# sia - doc generator for AngularJS modules

_sia_ is a documentation generator built on [dgeni] that uses [Angular Material] and is heavily inspired by it's docs.

## Usage

```sh
npm install sia --save-dev
```

```js
// gulpfile.js
var gulp = require('gulp');
var pkg = require('./package.json');

require('sia')(gulp, {
  basePath: __dirname,
  moduleTitle: 'My Module',
  modulePrefix: 'myModule',
  ngVersion: '1.4.6',
  moduleJs: ['../my-module.js'],
  moduleCss: ['../my-module.css'],
  repositoryUrl: pkg.repository && pkg.repository.url.replace(/^git/, 'https').replace(/(\.git)?\/?$/,'')
});
```

Generate docs:

```sh
gulp docs
```

Serve docs with local webserver:

```sh
gulp docs:serve
```

### Options

- **basePath** `string` - Base path where `src` and `docs` folders are located.
- **moduleTitle** `string` - Title displayed in docs.
- **modulePrefix** `string` - Module prefix used when determining module ids from folder structure.
- **ngVersion** `string`  - AngularJS version to load.
  (*angular*, *angular-animate*, *angular-route*, *angular-aria*, and *angular-messages* are automatically loaded)
- **moduleJs** `Array` - JavaScript files to load.
- **moduleCss** `Array` - CSS files to load.
- repositoryUrl `string` - Repository base URL.
- debug `boolean` - Debug mode. Default `false`.

### Content

Markdown files in `{basePath}/docs` that have `@ngdoc content` are included in the generated docs. Create the
documentation homepage at `docs/index.md`:

```html
<!-- docs/index.md -->
@ngdoc content
@name Introduction
@description
...
```

To display a file in the docs sidenav use `@area nav`.

### Components

Components in `{basePath}/src}` that have `@ngdoc service`, `@ngdoc directive`, or `@ngdoc filter` are included in the
docs if they belong to a documented module.

For example:

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