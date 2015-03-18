#!/bin/bash

set -e
set -v

git config --global user.email "travis@browser.html"
git config --global user.name "travis"
git rev-parse HEAD > HEAD
git checkout --orphan gh-pages
rm .gitignore
git add .
git commit -m "Deployed to Github Pages"
git push --force --quiet "https://${GH_TOKEN}@${GH_REF}" gh-pages > /dev/null 2>&1
git status
