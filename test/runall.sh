#!/bin/bash -ve

./node_modules/.bin/marionette-mocha \
  --host-log stdout \
  --host $(pwd)/node_modules/graphene-marionette-runner/host/index.js \
  --runtime ./graphene/Contents/MacOS/graphene \
  --start-manifest http://localhost:6060/manifest.webapp \
  $(find test -name '*_test.js') $@;
