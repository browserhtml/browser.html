'use strict';

var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');
var watchify = require('watchify');
var child = require('child_process');
var http = require('http');
var ecstatic = require('ecstatic');
var path = require('path');

var settings = {
  cache: {},
  packageCache: {},
  debug: true,
  watch: false,
  compression: null
};

var Bundler = function(entry) {
  this.entry = entry
  this.compression = settings.compression
  this.build = this.build.bind(this);

  this.bundler = browserify({
    entries: ['./src/' + entry],
    debug: settings.debug,
    cache: settings.cache,
    packageCache: settings.packageCache
  });

  this.watcher = settings.watch &&
    watchify(this.bundler)
    .on('time', gutil.log)
    .on('update', this.build);
}
Bundler.prototype.bundle = function() {
  return this.watcher ? this.watcher.bundle() : this.bundler.bundle();
}

Bundler.prototype.build = function() {
  var bundle = this
    .bundle()
    .on('error', gutil.log)
    .pipe(source(this.entry + '.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .on('error', gutil.log)

  return (this.compression ? bundle.pipe(uglify(this.compression)) : bundle)
    .on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/'));
}

var bundler = function(entry) {
  return gulp.task(entry, function() {
    return new Bundler(entry).build();
  });
}

gulp.task('server', function() {
  var server = http.createServer(ecstatic({
    root: path.join(module.filename, '../'),
    cache: 0
  }));
  server.listen(6060);
});

gulp.task('application', function() {
  var app = child.spawn('/Applications/Browser.html.app/Contents/MacOS/graphene', [
    '--profile', './.profile', '--start-manifest=http://localhost:6060/manifest.webapp'
  ], {
    stdio: 'inherit'
  });

  var exit = function(code) {
    app.kill();
    process.exit(code);
  }

  process.on('SIGINT', exit);
  app.on('close', exit);
});

gulp.task('compressor', function() {
  settings.compression = {
    mangle: true,
    compress: true,
    acorn: true
  };
});

gulp.task('watcher', function() {
  settings.watch = true
});

bundler('browser/index');
bundler('service/history-worker');
bundler('about/settings/index');

gulp.task('build', [
  'compressor',
  'browser/index',
  'service/history-worker',
  'about/settings/index'
]);

gulp.task('watch', [
  'watcher',
  'browser/index',
  'service/history-worker',
  'about/settings/index'
]);

gulp.task('develop', ['watch', 'server', 'application']);;
gulp.task('default', ['develop']);
