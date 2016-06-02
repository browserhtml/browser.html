[![build](https://travis-ci.org/browserhtml/browserhtml.svg?branch=master)](https://travis-ci.org/browserhtml/browserhtml) [![slack](https://browserhtml-slackin.herokuapp.com/badge.svg)](https://browserhtml-slackin.herokuapp.com/)

# Browser.html

*Browser.html* is a research project aimed at building an experimental [Servo](https://github.com/servo/servo) browser in HTML. This project has 2 major pieces:

- _Graphene_: a runtime for building native apps in HTML. It's currently in development and part of Servo.
- _Browser.html_: an experimental browser UI for desktop.

This repository is for Browser.html (the front-end). Active development of Graphene happens in the [Servo](https://github.com/servo/servo) repository. Questions? Check out the [FAQ](https://github.com/browserhtml/browserhtml/wiki/FAQ).

![browser](./browser.gif)

## Contributing

We welcome contributions from anyone. See [CONTRIBUTING.md](https://github.com/browserhtml/browserhtml/blob/master/CONTRIBUTING.md) for help getting started.


### Building and Running

The Browser.html UI is bundled with Servo. To run it, you'll need to build Servo.

First, [install Servo's prerequisites](https://github.com/servo/servo#prerequisites). Then, clone and build Servo:

``` sh
git clone https://github.com/servo/servo
cd servo
./mach build -r
```

Finally, run Servo with the `--browserhtml` flag.

``` sh
./mach run -r --browserhtml
```


### Developing the Front-end

If you're working on the Browser.html front-end, you'll want to run the web app locally.

**Prerequisites**: You'll need [Node](https://nodejs.org/) and NPM. Next, clone Browser.html and install its Node dependencies.

``` sh
git clone https://github.com/browserhtml/browserhtml.git
cd browserhtml
npm install --no-optional
```

Then, start the front-end local server:

``` sh
npm run build-server
```

Finally, start Servo with the Browser.html flags turned on in either debug (`-d`) or release (`-r`) mode:

``` sh
./mach run -r -- -b -w --resolution=1024x720 --pref dom.mozbrowser.enabled --pref dom.forcetouch.enabled --pref dom.quit-on-escape.enabled=false http://localhost:6060
```

### Running in Gecko

Browser.html can also be run on top of a Gecko-based version of Graphene. We sometimes use this variant to test and debug features that haven't yet landed in Servo. Build instructions for Gecko-flavored Graphene can be found [on the wiki](https://github.com/browserhtml/browserhtml/wiki/Building-Graphene-%28Gecko-flavor%29).


### Using WebIDE

The easiest way to use developer tools with Browser.html is to select the "Remote Runtime" option in WebIDE while using the Gecko Graphene runtime.

By default you should be able to connect to the running browser at: localhost:6000.


### Integration Tests

Run integration tests with `./test/runall.sh`. You need to have a Graphene Gecko binary symlinked in the root of the repository.

``` sh
ln -s ../gecko/obj-graphene/dist/Graphene.app graphene
```
