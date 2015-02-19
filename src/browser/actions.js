/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

'use strict';

const url = require('./util/url');

const makeSearchURL = input =>
  `https://search.yahoo.com/search?p=${encodeURIComponent(input)}`;

const readInputURL = input =>
  url.isNotURL(input) ? makeSearchURL(input) :
  !url.hasScheme(input) ? `http://${input}` :
  input;

// Action takes state cursor for the web viewer and input location
// and navigates that webViewer to that location (if it's not valid
// url either normalizes it or converts to search). Optional `focus`
// can be passed as `false` to navigate to a url but not focus it.
const navigateTo = ({input, webViewer}, location, focus=true) => {
  input.set("value", null);
  webViewer.merge({uri: readInputURL(location), isFocused: focus});
}

// Exports:

exports.makeSearchURL = makeSearchURL;
exports.readInputURL = readInputURL;
exports.navigateTo = navigateTo;
exports.focus = focusable => focusable.set('isFocused', true);
exports.showTabStrip = input => input.set('isActive', true);
exports.hideTabStrip = input => input.set('isActive', false);

});
