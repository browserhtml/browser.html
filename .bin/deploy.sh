#!/bin/bash

set -e
set -v

git config --global user.email "travis@browser.html"
git config --global user.name "travis"

TAG=`git tag -l | sort -g | tail -n 1`
LATEST_REV=`git rev-parse $TAG`
HEAD=`git rev-parse HEAD`
DEPLOYED_REV=`curl https://raw.githubusercontent.com/mozilla/browser.html/gh-pages/HEAD`

if [ "$HEAD" = "$LATEST_REV" ]; then
  if [ "$HEAD" != "$DEPLOYED_REV" ]; then
    echo "Deploy version ${TAG}"
    echo $HEAD > HEAD
    git checkout --orphan gh-pages
    echo "" > .nojekyll
    rm .gitignore
    git add .
    git commit -m "Deploy version ${TAG}"
    git push --force --quiet "https://${GH_TOKEN}@${GH_REF}" gh-pages > /dev/null 2>&1
    git status
  else
    echo "Version ${TAG} is already deployed"
  fi
fi
