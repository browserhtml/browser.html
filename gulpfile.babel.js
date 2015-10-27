'use strict';

import browserify from 'browserify';
import gulp from 'gulp';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import uglify from 'gulp-uglify';
import sourcemaps from 'gulp-sourcemaps';
import gutil from 'gulp-util';
import watchify from 'watchify';
import child from 'child_process';
import http from 'http';
import path from 'path';
import babelify from 'babelify';
import sequencial from 'gulp-sequence';
import ecstatic from 'ecstatic';
import hmr from 'browserify-hmr';
import hotify from 'hotify';

var settings = {
  port: process.env.BROWSER_HTML_PORT ||
        '6060',
  runtimePath: process.env.BROWSER_HTML_RUNTIME_PATH ||
        '/Applications/Browser.html.app/Contents/MacOS/graphene',
  profilePath: process.env.BROWSER_HTML_PROFILE_PATH ||
               './.profile',
  cache: {},
  packageCache: {},
  transforms: {},
  plugins: {},
  plugin: [],
  transform: [
    babelify.configure({
      "optional": [
        "spec.protoToAssign",
        "runtime"
      ],
      "blacklist": []
    })
  ],
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
    cache: {},
    packageCache: {},
    transform: [...settings.transform,
                ...(settings.transforms[entry] || [])],
    plugin: [...settings.plugin,
             ...(settings.plugins[entry] || [])]
  });

  this.watcher = settings.watch &&
    watchify(this.bundler)
    .on('update', this.build);
}
Bundler.prototype.bundle = function() {
  gutil.log(`Begin bundling: '${this.entry}'`);
  return this.watcher ? this.watcher.bundle() : this.bundler.bundle();
}

Bundler.prototype.build = function() {
  var bundle = this
    .bundle()
    .on('error', (error) => {
      gutil.beep();
      console.error(`Failed to browserify: '${this.entry}'`, error.message);
    })
    .pipe(source(this.entry + '.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .on('error', (error) => {
      gutil.beep();
      console.error(`Failed to make source maps for: '${this.entry}'`,
                    error.message);
    });

  return (this.compression ? bundle.pipe(uglify(this.compression)) : bundle)
    .on('error', (error) => {
      gutil.beep();
      console.error(`Failed to bundle: '${this.entry}'`,
                    error.message);
    })
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/'))
    .on('end', () => {
      gutil.log(`Completed bundling: '${this.entry}'`);
    });
}

var bundler = function(entry) {
  return gulp.task(entry, function() {
    return new Bundler(entry).build();
  });
}

// Starts a static http server that serves browser.html directory.
gulp.task('server', function() {
  var server = http.createServer(ecstatic({
    root: path.join(module.filename, '../'),
    cache: 0
  }));
  server.listen(settings.port);
});


// Starts a garphene build that loads browser.html app from the localhost:6060
gulp.task('application', function() {
  var app = child.spawn(settings.runtimePath, [
    '--profile',
    settings.profilePath,
    '--start-manifest=http://localhost:' + settings.port + '/manifest.webapp'
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

gulp.task('hotreload', function() {

  settings.plugins['browser/index'] = [[hmr, {
    port: 3124,
    url: "http://localhost:3124"
  }]]
  settings.plugins['service/history-worker'] = [[hmr, {
    port: 3125,
    url: "http://localhost:3125"
  }]]
  settings.plugins['about/settings/index'] = [[hmr, {
    port: 3126,
    url: "http://localhost:3126"
  }]]

  settings.transform.push(hotify);
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

gulp.task('develop', sequencial('watch', 'server', 'application'));
gulp.task('build-server', sequencial('watch', 'server'));

gulp.task('live', ['hotreload', 'develop']);
gulp.task('live-server', ['hotreload', 'build-server']);

gulp.task('default', ['develop']);
