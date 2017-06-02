[![build](https://travis-ci.org/browserhtml/browserhtml.svg?branch=master)](https://travis-ci.org/browserhtml/browserhtml) [![slack](https://browserhtml-slackin.herokuapp.com/badge.svg)](https://browserhtml-slackin.herokuapp.com/)

# Browser.html

*Browser.html* is a research project aimed at building an experimental [Servo][] browser in HTML. This project has 2 major pieces:

- _Graphene_: a runtime for building native apps in HTML. It's currently in development and part of Servo.
- _Browser.html_: an experimental browser UI for desktop.

This repository is for Browser.html (the front-end). Active development of Graphene happens in the [Servo][] repository. Questions? Check out the [FAQ](https://github.com/browserhtml/browserhtml/wiki/FAQ).

![browser](./browser.gif)

## Contributing

We welcome contributions from anyone. See [CONTRIBUTING.md](https://github.com/browserhtml/browserhtml/blob/master/CONTRIBUTING.md) for help getting started.


## Development

There are two major components to the browser.html application.

1. Local server that serves application UI.
2. Client that is a application shell that connects to the server and renders served UI.


### Server

If you're working on the Browser.html front-end, you'll need [Node.js][] to install all dependencies and run the development toolchain.

``` sh
git clone https://github.com/browserhtml/browserhtml.git
cd browserhtml
npm install --no-optional
```

Once all dependencies are installed, you can run the server component with the following command:

``` sh
npm run build-server
```

Any changes to the source code will trigger a build, which is then automatically served. That will allow you to reload a client in order to see your changes. Alternatively you can use `live-server` to not only rebuild, but also trigger an automatic live code reload for the UI such that application state is preserved:

```sh
npm run live-server
```

### Client

In order to run the browser.html application itself, you will need a client component. This would be a Servo binary with the Graphene runtime. You can either [download][download servo] pre-built nightly snapshots or [build it yourself][build servo] and run with the `--browserhtml` flag. Assuming you have a pre-built snapshot in the default location on a Mac you can run the browser.html application with the following command:


``` sh
 /Applications/Servo.app/Contents/MacOS/servo -b -w --pref dom.mozbrowser.enabled --pref dom.forcetouch.enabled --pref shell.builtin-key-shortcuts.enabled=false http://localhost:6060
```

### Gecko Client

Browser.html can also be run on top of a Gecko-based version of Graphene. We used to use this variant to test and debug features that were not yet in Servo. You can either [download][download gecko] pre-built nightly snapshots or [build it yourself][build gecko]. Assuming you have a pre-built snapshot in default location on a Mac you can run the browser.html application with the following command:

```sh
/Applications/B2G.app/Contents/MacOS/b2g-bin --start-manifest=http://localhost:6060/manifest.webapp --profile ./.profile
```

### Electron Client

Browser.html can also run as an [Electron][] application. Assuming you have `electron` installed you can run the browser.html application with the following command (must be run from the project root):

```sh
electron .
```

### Browser Client

You can also just load http://localhost:6060/ in your favourite web browser, but be aware that many features with not work because they require APIs not available to web content.


[build gecko]:https://github.com/browserhtml/browserhtml/wiki/Building-Graphene-%28Gecko-flavor%29
[build servo]:https://github.com/servo/servo/blob/master/docs/HACKING_QUICKSTART.md
[download gecko]:https://ftp.mozilla.org/pub/b2g/nightly/latest-mozilla-central/
[download servo]:https://download.servo.org/
[Electron]:https://electron.atom.io/
[Node.js]:https://nodejs.org/
[npm]:https://www.npmjs.com/
[Servo]:https://github.com/servo/servo
