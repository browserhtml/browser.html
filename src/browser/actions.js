/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {fromJS, List} = require('immutable');
  const {isAboutURL, isNotURL, hasScheme, getBaseURI} = require('common/url-helper');
  const {select, active} = require('./deck/actions');
  const {initDashboard} = require('./dashboard/actions');
  const {Suggestions} = require('./suggestion-box');
  const {Editable} = require('common/editable');
  const {WebView, WebViews} = require('./web-view');
  const {Updates} = require('./update-banner');
  // TODO: Should be `const {version} = require('package.json`);` instead but require.js
  // does not supports that.
  const version = '0.0.6';

  const makeSearchURL = input =>
    `https://duckduckgo.com/?q=${encodeURIComponent(input)}`;

  const makeAboutURL = input =>
    getBaseURI() + 'src/about/' + input.replace('about:', '') + '/index.html';

  const sendEventToChrome = type => dispatchEvent(new CustomEvent('mozContentEvent',
    {bubbles: true, cancelable: false, detail: {type}}))

  const readInputURL = input =>
    isAboutURL(input) ? makeAboutURL(input) :
    isNotURL(input) ? makeSearchURL(input) :
    !hasScheme(input) ? `http://${input}` :
    input;

  // We'll hard-code dashboard items for now.
  const dashboardItems = [
    {image: 'tiles/facebook.com.png',
     uri: 'https://facebook.com',
     title: 'facebook.com'},
    {image: 'tiles/youtube.com.png',
     uri: 'https://youtube.com',
     title: 'youtube.com'},
    {image: 'tiles/amazon.com.png',
     uri: 'https://amazon.com',
     title: 'amazon.com'},
    {image: 'tiles/wikipedia.org.png',
     uri: 'https://wikipedia.org',
     title: 'wikipedia.org'},
    {image: 'tiles/twitter.com.png',
     uri: 'https://twitter.com',
     title: 'twitter.com'},
    {image: 'tiles/mail.google.com.png',
     uri: 'https://mail.google.com',
     title: 'mail.google.com'},
    {image: 'tiles/nytimes.com.png',
     uri: 'https://nytimes.com',
     title: 'nytimes.com'},
    {image: 'tiles/qz.com.png',
     uri: 'http://qz.com',
     title: 'qz.com'},
    {image: 'tiles/github.com.png',
     uri: 'https://github.com',
     title: 'github.com'},
    {image: 'tiles/dropbox.com.png',
     uri: 'https://dropbox.com',
     title: 'dropbox.com'},
    {image: 'tiles/linkedin.com.png',
     uri: 'https://linkedin.com',
     title: 'linkedin.com'},
    {image: 'tiles/yahoo.com.png',
     uri: 'https://yahoo.com',
     title: 'yahoo.com'}
  ];

  // Creates a blank session. Returns immutable map.
  const resetSession = () => fromJS({
    isDocumentFocused: document.hasFocus(),
    // TODO: `isFocused` should be `true` but that causes
    // issues when app iframe isn't focused. Can be fixed
    // once #239 is resolved.
    input: Editable(),
    tabStrip: {isActive: false},
    dashboard: initDashboard({items: dashboardItems}),
    rfa: {id: -1},
    suggestions: Suggestions(),
    updates: Updates(),
    webViews: [WebView({id: 'about:blank',
                        isPinned: true,
                        isSelected: true,
                        isActive: true,
                        isFocused: false})]
  });

  // Reads stored session. Returns either immutable data for the
  // session or null.
  const readSession = () => {
    const session = localStorage[`session@${version}`];
    try {
      return session && fromJS(JSON.parse(session))
             .update('suggestions', Suggestions)
             .update('input', Editable)
             .update('webViews', WebViews)
             .update('updates', Updates);
    } catch (error) {
      if (session) {
        console.error(`Failed to restore a session`, error);
      }
    }
  };

  const writeSession = session => {
    const data = session
      .setIn(['rfa', 'id'], -1)
      // Reset state of each web viewer that can't be carried across the sessions.
      .updateIn(['webViews'], viewers => viewers.map(WebView.persistent))
      .updateIn(['updates'], updates => updates.merge({
        appUpdateAvailable: false,
        runtimeUpdateAvailable: false
      }))
      .toJSON();
    localStorage[`session@${version}`] = JSON.stringify(data);
    return session;
  };

  // Exports:

  exports.makeSearchURL = makeSearchURL;
  exports.readInputURL = readInputURL;
  exports.activate = state => state.set('isActive', true);
  exports.deactivate = state => state.set('isActive', false);
  exports.resetSession = resetSession;
  exports.readSession = readSession;
  exports.writeSession = writeSession;
  exports.sendEventToChrome = sendEventToChrome;

});
