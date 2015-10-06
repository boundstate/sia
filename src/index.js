var args = require('argv').run();
var del = require('del');
var Dgeni = require('dgeni');
var path = require('path');
var runSequence = require('run-sequence');

var concat = require('gulp-concat');
var gulpif = require('gulp-if');
var ngAnnotate = require('gulp-ng-annotate');
var ngConstant = require('gulp-ng-constant');
var ngHtml2js = require('gulp-ng-html2js');
var rename = require('gulp-rename');
var server = require('gulp-webserver');
var template = require('gulp-template');
var uglify = require('gulp-uglify');

var util = require('./util');

var appDir = path.join(__dirname, 'app');

/**
 * Adds gulp documentation tasks.
 * @param {object} gulp
 * @param {object} config
 * @param {string} config.basePath Base path where `src` and `docs` folders are located
 * @param {string} config.moduleTitle Title displayed in docs.
 * @param {string} config.modulePrefix Module prefix (used when determining module ids from folder structure)
 * @param {string} config.ngVersion AngularJS version to load
 * (*angular*, *angular-animate*, *angular-route*, *angular-aria*, and *angular-messages* are automatically loaded)
 * @param {Array}  config.moduleJs Module JavaScript files
 * @param {Array}  config.moduleCss Module CSS files
 * @param {string} [config.repositoryUrl] Repository base URL
 * @param {boolean} [config.debug=false] Debug mode
 */
module.exports = function (gulp, config) {

  gulp = require('gulp-help')(gulp);

  gulp.task('docs', 'Generates docs', function (cb) {
    runSequence('docs:clean', [
      'docs:index',
      'docs:dgeni',
      'docs:js',
      'docs:css',
      'docs:demos:data',
      'docs:demos:copy',
      'docs:demos:scripts'
    ], cb);
  });

  gulp.task('docs:clean', false, function () {
    return del('dist/docs');
  });

  // Parses ngDocs
  gulp.task('docs:dgeni', false, function() {
    var dgeniPackage = require('./dgeni-package')
      .config(function(log, readFilesProcessor) {
        log.level = config.debug ? 'info' : 'error';
        readFilesProcessor.basePath = config.basePath;
      })
      .config(function (componentDataProcessor) {
        componentDataProcessor.repositoryUrl = config.repositoryUrl;
      });
    var dgeni = new Dgeni([dgeniPackage]);
    return dgeni.generate();
  });

  // Copies app files
  gulp.task('docs:app', false, function() {
    return gulp.src([
      appDir + '/**/*',
      '!' + appDir + '/partials/**/*.html',
      '!' + appDir + '/index.html'
    ])
      .pipe(gulp.dest('dist/docs'));
  });

  // Generates AngularJS config constants
  gulp.task('docs:config', false, function () {
    return ngConstant({
      name: 'docsApp.config-data',
      constants: {CONFIG: config},
      stream: true
    })
      .pipe(rename('config-data.js'))
      .pipe(gulp.dest('dist/docs/js'));
  });

  // Concatenates and uglifies JS
  gulp.task('docs:js', false, ['docs:app', 'docs:config', 'docs:html2js', 'docs:dgeni'], function() {
    return gulp.src('dist/docs/js/**/*.js')
      .pipe(ngAnnotate())
      .pipe(concat('docs.js'))
      .pipe(gulpif(!config.debug, uglify()))
      .pipe(gulp.dest('dist/docs'));
  });

  // Concatenates CSS
  gulp.task('docs:css', false, ['docs:app'], function() {
    return gulp.src(appDir + '/css/**/*.css')
      .pipe(concat('docs.css'))
      .pipe(gulp.dest('dist/docs'));
  });

  // Converts HTML to JS
  gulp.task('docs:html2js', false, function() {
    return gulp.src(appDir + '/partials/**/*.html')
      .pipe(ngHtml2js({
        moduleName: 'docsApp.templates',
        prefix: 'partials/'
      }))
      .pipe(concat('templates.js'))
      .pipe(gulp.dest('dist/docs/js'));
  });

  // Compiles index template
  gulp.task('docs:index', false, function() {
    return gulp.src(appDir + '/index.html')
      .pipe(template({config: config}))
      .pipe(gulp.dest('dist/docs'));
  });

  // Generates demo data
  gulp.task('docs:demos:data', false, function() {
    return gulp.src('src/**/demo*/**/*')
      .pipe(util.parseDemoFiles(config.modulePrefix))
      .pipe(ngConstant({name: 'docsApp.demo-data'}))
      .pipe(rename('demo-data.js'))
      .pipe(gulp.dest('dist/docs/js'));
  });

  // Copies demo files to `dist/docs/demo-partials` and prefixes CSS with demo ID as parent class.
  gulp.task('docs:demos:copy', false, function() {
    return gulp.src('src/**/demo*/**/*')
      .pipe(gulpif(/.css$/, util.prefixDemoCss()))
      .pipe(gulp.dest('dist/docs/demo-partials'));
  });

  // Concatenates demo scripts
  gulp.task('docs:demos:scripts', false, ['docs:demos:copy'], function() {
    return gulp.src('dist/docs/demo-partials/**/*.js')
      .pipe(concat('docs-demo-scripts.js'))
      .pipe(gulp.dest('dist/docs'));
  });

  gulp.task('docs:serve', 'Serves docs', function() {
    var port = args.port || 8000;
    gulp.src('dist')
      .pipe(server({
        port: port,
        fallback: 'docs/index.html',
        open: 'http://localhost:8000/docs'
      }));
  });

};