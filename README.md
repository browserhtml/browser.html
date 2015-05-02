[![build](https://travis-ci.org/mozilla/browser.html.svg?branch=master)](https://travis-ci.org/mozilla/browser.html)

*browser.html* is a platform research project closely related to [Servo](https://github.com/servo/servo). It's not a product.
We are exploring future UI paradigms strictly only because we are curious what future needs
will be on our platform and processes to build our platform, which we want to evolve.

#### Setup

```
npm install
npm start
```

#### Runtime

Browser.html needs a special build of B2G desktop called *Graphene*.
Build this branch: https://hg.mozilla.org/projects/larch with
`--enable-application=b2g/graphene`.

In the future, we want `browser.html` to be able to run on top of Servo.

#### Using WebIDE

The easiest way to use developer tools with Browser.html is to select the "Remote Runtime" option in WebIDE.
By default you should be able to connect to the running browser at: localhost:6000.
