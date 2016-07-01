#!/bin/bash

set -e

git config --global user.email "travis@browser.html"
git config --global user.name "travis"

TAG=`git describe --abbrev=0 --tags`
LATEST_REV=`git rev-parse $TAG`
REPO_URL=`git config --get remote.origin.url`
HEAD=`git rev-parse HEAD`
DEPLOYED_REV=`curl --silent https://raw.githubusercontent.com/browserhtml/browserhtml/gh-pages/HEAD`

if [ "$HEAD" = "$LATEST_REV" ]; then
  if [ "$HEAD" != "$DEPLOYED_REV" ]; then
    echo "Deploying version ${TAG}"
    rm -rf dist
    mkdir dist
    git clone -b gh-pages $REPO_URL dist
    rm -r dist/*
    npm run build
    npm run build-cargo
    cd dist
    echo $HEAD > HEAD
    echo "" > .nojekyll
    git add -A
    git commit -m "Deploy version ${TAG}"
    git push --quiet "https://travis:${GH_TOKEN}@${GH_REF}" gh-pages > /dev/null 2>&1
    git status
    echo "Deployed version ${TAG}"
  else
    echo "Version ${TAG} is already deployed, skip deployment."
  fi
else
    echo "Not a tagged commit, skip deployment."
fi
