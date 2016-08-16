'use strict';

import browserify from 'browserify';
import gulp from 'gulp';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import uglify from 'gulp-uglify';
import sourcemaps from 'gulp-sourcemaps';
import gutil from 'gulp-util';
import watchify from 'watchify';
import watch from 'gulp-watch';
import child from 'child_process';
import http from 'http';
import path from 'path';
import babelify from 'babelify';
import sequencial from 'gulp-sequence';
import ecstatic from 'ecstatic';
import hmr from 'browserify-hmr';
import hotify from 'hotify';
import * as manifest from './package.json';
import * as fs from 'fs';

var dist = gutil.env.dist || "./dist/";

var settings = {
  port: process.env.BROWSER_HTML_PORT ||
        '6060',
  geckoPath: process.env.BROWSER_HTML_GECKO_PATH ||
        '/Applications/Browser.html.app/Contents/MacOS/graphene',
  servoPath: process.env.BROWSER_HTML_SERVO_PATH ||
        '/usr/local/bin/servo',
  profilePath: process.env.BROWSER_HTML_PROFILE_PATH ||
               './.profile',
  cache: {},
  packageCache: {},
  transforms: {},
  plugins: {},
  plugin: [],
  transform: [
    babelify
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
    .pipe(gulp.dest(path.join(dist, "components")))
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
    root: dist,
    cache: 0
  }));
  server.listen(settings.port);
});


// Starts a garphene build that loads browser.html app from the localhost:6060
gulp.task('gecko', function() {
  fs.exists(settings.geckoPath, function (exists) {
    if(exists) {
      var app = child.spawn(settings.geckoPath, [
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
    } else {
      console.error("Error: Gecko binary not found: " + settings.geckoPath);
      process.exit(1);
    }
  });
});

gulp.task('servo', function() {
  fs.exists(settings.servoPath, function (exists) {
    if(exists) {
      var app = child.spawn(settings.servoPath, [
          '-w', // Webrender
          '-b', // Borderless
          '--pref', 'dom.mozbrowser.enabled',
          '--pref', 'dom.forcetouch.enabled',
          '--pref', 'shell.builtin-key-shortcuts.enabled=false',
          'http://localhost:' + settings.port
      ], {
          stdio: 'inherit'
      });

      var exit = function(code) {
          app.kill();
          process.exit(code);
      }

      process.on('SIGINT', exit);
      app.on('close', exit);
    } else {
      console.error("Error: Servo binary not found: " + settings.servoPath);
      process.exit(1);
    }
  });
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

  settings.plugins['Main'] = [[hmr, {
    port: 3124,
    url: "http://localhost:3124"
  }]]

  settings.plugins['About/Settings/Main'] = [[hmr, {
    port: 3126,
    url: "http://localhost:3126"
  }]]

  settings.plugins['About/Repl/Main'] =
    [ [ hmr
      , { port: 3127
        , url: "http://localhost:3127"
        }
      ]
    ]

  settings.plugins['About/Newtab/Main'] =
    [ [ hmr
      , { port: 3128
        , url: "http://localhost:3128"
        }
      ]
    ]

  settings.transform.push(hotify);
});

function copy_files(src, dst) {
  var s = gulp.src(src);
  if (settings.watch) {
    s = s.pipe(watch(src));
  }
  s.pipe(gulp.dest(dst));
}

gulp.task('copydist', function() {
  copy_files('LICENSE', dist);
  copy_files('README.md', dist);
  copy_files('browser.gif', dist);
  copy_files('./index.html', dist);
  copy_files('./manifest.webapp', dist);
  copy_files('./css/*', path.join(dist, "css/"));
  copy_files('./src/**/*.css', path.join(dist, "components"));
  copy_files('./src/**/*.html', path.join(dist, "components"));
  copy_files('./src/**/*.json', path.join(dist, "components"));
  copy_files('./src/**/*.png', path.join(dist, "components"));
  copy_files('./src/**/*.jpg', path.join(dist, "components"));
  copy_files('./src/**/*.gif', path.join(dist, "components"));
  copy_files('./src/**/evil_ad/**/*.js', path.join(dist, "components"));
  copy_files('./*.json', path.join(dist, "components"));
});

bundler('Main');
bundler('About/Settings/Main');
bundler('About/Repl/Main');
bundler('About/Newtab/Main');

gulp.task('build', [
  'compressor',
  'Main',
  'About/Settings/Main',
  'About/Repl/Main',
  'About/Newtab/Main',
  'copydist'
]);

gulp.task('watch', [
  'watcher',
  'Main',
  'About/Settings/Main',
  'About/Newtab/Main',
  'About/Repl/Main',
  'copydist'
]);

const readName =
  contributor =>
  ( contributor.name == null
  ? ``
  : `${contributor.name}`
  );

const readEmail =
  contributor =>
  ( contributor.email == null
  ? ``
  : `<${contributor.email}>`
  );

const readURL =
  contributor =>
  ( contributor.url == null
  ? ``
  : `${contributor.url}`
  );

const toAuthor =
  contributor =>
  ( typeof(contributor) === "string"
  ? `"${contributor}"`
  : `"${[readName(contributor), readEmail(contributor), readURL(contributor)].join(" ")}"`
  );

gulp.task('cargo', () => {
  const lib = source('./src/lib.rs')
  const cargo = source('./Cargo.toml')
  const build = source('./build.rs')

  lib.end(`/* file intentionally blank */\n`);

  cargo.end(`[package]
name = "${manifest.name.replace(/\./g, "")}"
version = "${manifest.version}"
authors = [${manifest.contributors.map(toAuthor).join(", ")}]
license = "${manifest.license}"
repository = "${manifest.repository.url}"
homepage = "${manifest.homepage}"
build = "build.rs"
`);

build.end(`/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use std::env;
use std::process::Command;
use std::path::PathBuf;

fn main() {
    let out_dir = env::var("OUT_DIR").unwrap();
    let target = env::var("TARGET").unwrap();

    if target.contains("msvc") {
        // sigh
        let mut css_dir = PathBuf::from(&out_dir);
        css_dir.push("css");
        let mut components_dir = PathBuf::from(&out_dir);
        components_dir.push("components");
        assert!(Command::new("xcopy")
                .args(&["/QY", "index.html", &out_dir])
                .status()
                .unwrap()
                .success());
        assert!(Command::new("xcopy")
                .args(&["/EQIY", "components", components_dir.to_str().unwrap()])
                .status()
                .unwrap()
                .success());
        assert!(Command::new("xcopy")
                .args(&["/EQIY", "css", css_dir.to_str().unwrap()])
                .status()
                .unwrap()
                .success());
    } else {
        assert!(Command::new("cp")
                .args(&["-R", "index.html", "css", "components", &out_dir])
                .status()
                .unwrap()
                .success());
    }
}
`);

  lib.pipe(gulp.dest(dist));
  cargo.pipe(gulp.dest(dist));
  build.pipe(gulp.dest(dist));
});

gulp.task('develop', sequencial('watch', 'server', 'gecko'));
gulp.task('build-server', sequencial('watch', 'server'));

gulp.task('live', ['hotreload', 'develop']);
gulp.task('live-server', ['hotreload', 'build-server']);

gulp.task('default', ['develop']);
