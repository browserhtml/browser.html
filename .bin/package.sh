#!/bin/sh

set -e
set -x #debug

MINIFY=0

TMPDIR=`mktemp -d 2>/dev/null || mktemp -d -t 'browserhtml'`

rm -rf dist
mkdir dist

./node_modules/requirejs/bin/r.js -o ./build.js out=$TMPDIR/built.js

if [ "$MINIFY" = 1 ] ; then
  babel $TMPDIR/built.js > $TMPDIR/es5.js
  uglifyjs --screw-ie8 $TMPDIR/es5.js > dist/main.js
  rm $TMPDIR/es5.js
  uglifyjs --screw-ie8 node_modules/requirejs/require.js > dist/require.js
else
  cp node_modules/requirejs/require.js dist/require.js
  cp $TMPDIR/built.js dist/main.js
fi


mkdir dist/src
cp -r css manifest.webapp net_error.html dist
cp src/prerendering.js src/alexa.json dist/src
cp index-dist.html dist/index.html

rm $TMPDIR/built.js
rmdir $TMPDIR
