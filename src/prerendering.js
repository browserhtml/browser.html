/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Browser.html native window shows up once index.html has loaded.
 * By then, the first rendering didn't happen yet because requirejs
 * loads script asynchronously. We use localStorage (which is a synchronous
 * API) to store the result of the previous first rendering (see src/browser/index.js)
 * which we restore here.
 *
 * Ideally, we'd like to be able to write the initial rendering directly
 * into index.html, or maybe load the browser.html machinery synchronously.
 */

if (window.localStorage.prerender) {
  document.body.innerHTML = window.localStorage.prerender;
  window.localStorage.removeItem('prerender');
} else {
  // FIXME: blank screen
  // See: https://github.com/mozilla/browser.html/issues/527
}
