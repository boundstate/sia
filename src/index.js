var del = require('del');
var Dgeni = require('dgeni');
var path = require('path');
var runSequence = require('run-sequence');

var concat = require('gulp-concat');
var gulpif = require('gulp-if');
var ngConstant = require('gulp-ng-constant');
var ngHtml2js = require('gulp-ng-html2js');
var rename = require('gulp-rename');
var template = require('gulp-template');
var uglify = require('gulp-uglify');

var util = require('./util');

var appDir = path.join(__dirname, 'app');

module.exports = function (gulp, config) {

  gulp.task('docs:clean', function () {
    return del('dist/docs');
  });

  // Generates docs and demos
  gulp.task('docs', function () {
    runSequence('docs:clean', [
      'docs:index',
      'docs:dgeni',
      'docs:js',
      'docs:css',
      'docs:demos',
      'docs:demos:copy',
      'docs:demos:scripts'
    ]);
  });

  // Parses ngDocs
  gulp.task('docs:dgeni', function() {
    var dgeniPackage = require('./dgeni-package')
      .config(function (componentsDataProcessor) {
        componentsDataProcessor.modulePrefix = config.modulePrefix;
        componentsDataProcessor.repositoryUrl = config.repositoryUrl;
      });
    var dgeni = new Dgeni([dgeniPackage]);
    return dgeni.generate();
  });

  // Copies app files
  gulp.task('docs:app', function() {
    return gulp.src([
      appDir + '/**/*',
      '!' + appDir + '/partials/**/*.html',
      '!' + appDir + '/index.html'
    ])
      .pipe(gulp.dest('dist/docs'));
  });

  // Generates AngularJS config constants
  gulp.task('docs:config', function () {
    return ngConstant({
      name: 'docsApp.config',
      constants: {CONFIG: config},
      stream: true
    })
      .pipe(rename('config-data.js'))
      .pipe(gulp.dest('dist/docs/js'));
  });

  // Concatenates and uglifies JS
  gulp.task('docs:js', ['docs:app', 'docs:config', 'docs:html2js', 'docs:dgeni'], function() {
    return gulp.src('dist/docs/js/**/*.js')
      .pipe(concat('docs.js'))
      .pipe(gulpif(!config.dev, uglify()))
      .pipe(gulp.dest('dist/docs'));
  });

  // Concatenates CSS
  gulp.task('docs:css', ['docs:app'], function() {
    return gulp.src([
      appDir + '/css/highlightjs-material.css',
      appDir + '/css/style.css'
    ])
      .pipe(concat('docs.css'))
      .pipe(gulp.dest('dist/docs'));
  });

  // Converts HTML to JS
  gulp.task('docs:html2js', function() {
    return gulp.src(appDir + '/**/*.tmpl.html')
      .pipe(ngHtml2js({
        moduleName: 'docsApp',
        declareModule: false
      }))
      .pipe(concat('docs-templates.js'))
      .pipe(gulp.dest('dist/docs/js'));
  });

  // Compiles index template
  gulp.task('docs:index', function() {
    return gulp.src(appDir + '/index.html')
      .pipe(template({ngVersion: config.ngVersion}))
      .pipe(gulp.dest('dist/docs'));
  });

  // Generates demo data
  gulp.task('docs:demos', function() {
    return gulp.src('src/**/demo*/**/*')
      .pipe(util.parseDemoFiles(config.modulePrefix))
      .pipe(ngConstant({name: 'docsApp.demos'}))
      .pipe(gulp.dest('dist/docs/js'));
  });

  // Copies demo files to `dist/docs/demo-partials` and prefixes CSS with demo ID as parent class.
  gulp.task('docs:demos:copy', function() {
    return gulp.src('src/**/demo*/**/*')
      .pipe(gulpif(/.css$/, util.prefixDemoCss()))
      .pipe(gulp.dest('dist/docs/demo-partials'));
  });

  // Concatenates demo scripts
  gulp.task('docs:demos:scripts', ['docs:demos:copy'], function() {
    return gulp.src('dist/docs/demo-partials/**/*.js')
      .pipe(concat('docs-demo-scripts.js'))
      .pipe(gulp.dest('dist/docs'));
  });

};