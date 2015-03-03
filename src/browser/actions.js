/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const url = require('./util/url');
  const {fromJS} = require('immutable');
  const {open} = require('./web-viewer/actions');
  const {select, active} = require('./deck/actions');
  // TODO: Should be `const {version} = require('package.json`);` instead but require.js
  // does not supports that.
  const version = '0.0.1';


  const makeSearchURL = input =>
    `https://duckduckgo.com/?q=${encodeURIComponent(input)}`;


  const readInputURL = input =>
    url.isNotURL(input) ? makeSearchURL(input) :
    !url.hasScheme(input) ? `http://${input}` :
    input;

  // Action takes state cursor for the web viewer and input location
  // and navigates that webViewer to that location (if it's not valid
  // url either normalizes it or converts to search). Optional `focus`
  // can be passed as `false` to navigate to a url but not focus it.
  const navigateTo = ({inputCursor, webViewerCursor}, location, focus=true) => {
    inputCursor.set('value', null);
    webViewerCursor.merge({uri: readInputURL(location), isFocused: focus});
  }

  // We'll hard-code dashboard items for now.
  const dashboardItems = [
    {image: '',
     uri: 'https://facebook.com',
     title: 'facebook.com'},
    {image: '',
     uri: 'https://youtube.com',
     title: 'youtube.com'},
    {image: '',
     uri: 'https://amazon.com',
     title: 'amazon.com'},
    {image: '',
     uri: 'https://wikipedia.org',
     title: 'wikipedia.org'},

    {image: '',
     uri: 'https://twitter.com',
     title: 'twitter.com'},
    {image: '',
     uri: 'https://mail.google.com',
     title: 'mail.google.com'},
    {image: '',
     uri: 'https://nytimes.com',
     title: 'nytimes.com'},
    {image: '',
     uri: 'https://qz.com',
     title: 'qz.com'},

    {image: '',
     uri: 'https://github.com',
     title: 'github.com'},
    {image: '',
     uri: 'https://dropbox.com',
     title: 'dropbox.com'},
    {image: '',
     uri: 'https://linkedin.com',
     title: 'linkedin.com'},
    {image: '',
     uri: 'https://yahoo.com',
     title: 'yahoo.com'}
  ];

  // Creates a blank session. Returns immutable map.
  const resetSession = () => fromJS({
    isDocumentFocused: document.hasFocus(),
    os: navigator.platform.startsWith('Win') ? 'windows' :
    navigator.platform.startsWith('Mac') ? 'osx' :
    navigator.platform.startsWith('Linux') ? 'linux' :
    '',
    input: {value: '', isFocused: false},
    tabStrip: {isActive: false},
    dashboard: {isActive: false,
                items: dashboardItems},
    webViewers: [open({isSelected: true,
                       isActive: true,
                       isFocused: true,
                       uri: 'https://github.com/mozilla/browser.html'})]
  });

  // Reads stored session. Returns either immutable data for the
  // session or null.
  const readSession = () => {
    try {
      return fromJS(JSON.parse(localStorage[`session@${version}`]));
    } catch(error) {
      return null;
    }
  };

  const writeSession = session => {
    localStorage[`session@${version}`] = JSON.stringify(session.toJSON());
  };

  const showDashboard = (dashboardCursor, tabStripCursor) => {
    dashboardCursor.set('isActive', true);
    tabStripCursor.set('isActive', true);
  }

  const hideDashboard = (dashboardCursor, tabStripCursor) => {
    dashboardCursor.set('isActive', false);
    tabStripCursor.set('isActive', false);
  }

  // Exports:

  exports.makeSearchURL = makeSearchURL;
  exports.readInputURL = readInputURL;
  exports.navigateTo = navigateTo;
  exports.focus = focusable => focusable.set('isFocused', true);
  exports.blur = focusable => focusable.set('isFocused', false);
  exports.showTabStrip = tabStripCursor =>
    tabStripCursor.set('isActive', true);
  exports.hideTabStrip = tabStripCursor =>
    tabStripCursor.set('isActive', false);
  exports.resetSelected = webViewersCursor =>
    webViewersCursor.update(items => select(items, active(items)));
  exports.showDashboard = showDashboard;
  exports.hideDashboard = hideDashboard;
  exports.resetSession = resetSession;
  exports.readSession = readSession;
  exports.writeSession = writeSession;

});
