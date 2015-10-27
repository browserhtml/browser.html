# Driver

Reflex is unable (or at least now) to abstract all the internals of [react][] and [virtual-dom][] that browser.html needs to deal with. There for driver specific code is isolated either under `react` or `virtual-dom` directory which is then mapped out via [`browser`][browserify-browser-field]. In other words
`driver/react/iframe` will have to be required as `driver/iframe` instead.


[react]:http://reactjs.com
[virtual-dom]:https://github.com/Matt-Esch/virtual-dom
[browserify-browser-field]:https://github.com/substack/node-browserify#browser-field
