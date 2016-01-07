[![build](https://travis-ci.org/mozilla/browser.html.svg?branch=master)](https://travis-ci.org/mozilla/browser.html) [![slack](https://browserhtml-slackin.herokuapp.com/badge.svg)](https://browserhtml-slackin.herokuapp.com/)

*Browser.html* is a research project aimed at building native apps in HTML using [Servo](https://github.com/servo/servo). The project has 2 major pieces:

- _Graphene_: a runtime for building native apps in HTML. It's currently in development and part of Servo.
- _Browser.html_: an experimental browser UI for desktop.

This repository is for Browser.html (the front-end). Active development of Graphene happens in the [Servo](https://github.com/servo/servo) repository.

We welcome contributions from anyone. See [CONTRIBUTING.md](https://github.com/mozilla/browser.html/blob/master/CONTRIBUTING.md) for help getting started.

![browser](./browser.gif)

### Prerequisites and Setup

You'll need [Node](https://nodejs.org/) and NPM to develop and run the UI locally.

```sh
npm install --no-optional
npm start
```


### Running in Servo

First, [build Servo](https://github.com/servo/servo#prerequisites).

Then, start the front-end local server:

    npm run build-server

Finally, start Servo with the browser.html flags turned on in either debug (`-d`) or release (`-r`) mode:

    ./mach run -r -- -b --pref dom.mozbrowser.enabled http://localhost:6060


### Running in Gecko

Browser.html can also be run on top of a Gecko-based version of Graphene. Browser.html was originally prototyped on top of this variant, and we sometimes use it to test and debug missing platform features while Servo undergoes rapid development. Build instructions for Gecko-flavored Graphene can be found [on the wiki](https://github.com/mozilla/browser.html/wiki/Building-Graphene-%28Gecko-flavor%29).


### Using WebIDE

The easiest way to use developer tools with Browser.html is to select the "Remote Runtime" option in WebIDE while using the Gecko Graphene runtime.

By default you should be able to connect to the running browser at: localhost:6000.


### Integration Tests

Run integration tests with `./test/runall.sh`. You need to have a Graphene Gecko binary symlinked in the root of the repository.

```
ln -s ../gecko/obj-graphene/dist/Graphene.app graphene
```
