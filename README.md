<!-- 
[![build](https://travis-ci.org/mozilla/browser.html.svg?branch=master)](https://travis-ci.org/mozilla/browser.html)
-->

![light theme](https://cloud.githubusercontent.com/assets/373579/5355479/d4d650d8-7f93-11e4-9645-88c93c8c495a.png)

![black theme](https://cloud.githubusercontent.com/assets/373579/5382222/a9bc89d8-80a8-11e4-86ad-46a128a67fc5.png)

Screencast: https://www.youtube.com/watch?v=IBzrCmGVDkA

Browser.html: an experimental Desktop browser, based on Firefox Desktop and Firefox OS. UI is built in HTML.

**Setup**

Serve code via a HTTP server:
```
npm install 
python -m SimpleHTTPServer 8000
```

Use a recent B2G build:
```
b2g --start-manifest http://localhost:8000/manifest.webapp
```

I recommend to use this branch for now: https://github.com/paulrouget/gecko-dev/compare/htmlrunner

**Using WebIDE**

The easiest way to use developer tools with Browser.html is to select the "Remote Runtime" option in WebIDE. By default you should be able to connect to the running browser at: localhost:6000. 
