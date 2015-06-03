#!/usr/bin/env node

var child = require('child_process');
var http = require('http');
var ecstatic = require('ecstatic');
var path = require('path');


process.title = 'browser.html';

var server = http.createServer(ecstatic({root: path.join(module.filename, '../..')}));
server.listen(6060);

var app = child.spawn('/Applications/B2G.app/Contents/MacOS/graphene', [
  '--profile', './.profile', '--start-manifest=http://localhost:6060/manifest.webapp'
], {
  stdio: 'inherit',
  uid: process.getuid(),
  gid: process.getgid()
});

var exit = function(code) {
  app.kill();
  process.exit(code);
}

process.on('SIGINT', exit);
app.on('close', exit);
