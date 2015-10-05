var _ = require('lodash');
var through = require('through2');
var path = require('path');
var cssPrefix = require('css-prefix');
var template = require('gulp-template');
var gutil = require('gulp-util');

module.exports = {
  prefixDemoCss: prefixDemoCss,
  parseDemoFiles: parseDemoFiles
};

/**
 * Prefixes a demo CSS file with the demo ID as the parent class.
 */
function prefixDemoCss() {
  return through.obj(function(file, enc, cb) {
    var css = file.contents.toString('utf8');
    css = cssPrefix({parentClass: getDemoId(file.path), prefix: ''}, css);
    file.contents = new Buffer(css);
    this.push(file);
    cb();
  });
}

/**
 * Parses demo data from files, organizing the demos by module, demo, and files.
 * @param {string} modulePrefix prefix used when automatically determining module id from folder structure
 * @returns {*}
 */
function parseDemoFiles(modulePrefix) {

  var modules = [];
  return through.obj(transform, flush);

  function transform(file, enc, cb) {

    var pathParts = file.path.split(path.sep);
    var filename = pathParts.pop();
    var demoName = pathParts.pop();
    var componentName = pathParts.pop();
    var demoId = getDemoId(file.path);

    var relativePathParts = path.relative(file.base, file.path).split(path.sep);
    var moduleName = modulePrefix + '.' + relativePathParts.slice(0, -2).join('.');

    // Add module data if necessary
    var module = _.find(modules, {name: moduleName});
    if (!module) {
      module = {
        name: moduleName,
        label: humanizeCamelCase(componentName),
        url: 'demo/' + moduleName,
        demos: []
      };
      modules.push(module);
    }

    // Add demo data if necessary
    var demo = _.find(module.demos, {id: demoId});
    if (!demo) {
      demo = {
        id: componentName + demoName,
        label: humanizeCamelCase(demoName.replace(/^demo/, '')),
        ngModule: null,
        html: [],
        js: [],
        css: []
      };
      module.demos.push(demo);
    }

    // Add demo file data
    var demoFile = {
      name: filename,
      outputPath: 'demo-partials/' + relativePathParts.join('/')
    };

    if (filename == 'index.html') {
      demo.index = demoFile;
    } else {
      var fileType = path.extname(filename).substring(1);
      if (fileType == 'js' && !demo.ngModule) {
        demo.ngModule = findModule(file.contents.toString());
      }
      demo[fileType].push(demoFile);
    }

    cb();
  }

  function flush(cb) {
    // Push as file so it can be used by ngConstant
    this.push(new gutil.File({
      path: 'demo-data.json',
      contents: new Buffer(JSON.stringify({DEMOS: modules}))
    }));
    cb();
  }
}

/**
 * Returns the ID for a demo file.
 * @private
 * @param {string} filePath
 * @returns {string}
 */
function getDemoId(filePath) {
  var pathParts = filePath.split(path.sep).slice(-3);
  return pathParts[0] + pathParts[1];
}

/**
 * Converts camel case notation to a more human format.
 * @private
 * @param {string} str
 * @returns {string}
 */
function humanizeCamelCase(str) {
  return str.charAt(0).toUpperCase() + str.substring(1).replace(/[A-Z]/g, function($1) {
      return ' ' + $1.toUpperCase();
    });
}

/**
 * Finds the AngularJS module from file content.
 * @private
 * @returns {object}
 */
function findModule(content) {
  var dependencies;
  var match = /\.module\(('[^']*'|"[^"]*")\s*,(?:\s*\[([^\]]+)\])?/.exec(content || '');
  var moduleName = match ? match[1].replace(/\'/gi,'') : null;
  var depsMatch = match && match[2] && match[2].trim();

  if (depsMatch) {
    dependencies = depsMatch.split(/\s*,\s*/).map(function(dep) {
      dep = dep.trim().slice(1, -1); //remove quotes
      return dep;
    });
  }

  return match ? {
    name: moduleName || '',
    module: moduleName || '',
    dependencies: dependencies || []
  } : null;
}