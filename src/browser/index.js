/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

'use strict';

const {fromJS, Set} = require('immutable');
const {render} = require('./core');
const {Browser} = require('./browser');
const {open} = require('./web-viewer/actions');

const initial = fromJS({
  isDocumentFocused: document.hasFocus(),
  os: navigator.platform.startsWith('Win') ? 'windows' :
      navigator.platform.startsWith('Mac') ? 'osx' :
      navigator.platform.startsWith('Linux') ? 'linux' :
      '',
  input: {value: '', isFocused: false},
  tabStrip: {
    isActive: false
  },
  webViewers: [open({id: 0,
                     zoom: 1,
                     isSelected: true,
                     isFocused: true,
                     uri: "https://github.com/mozilla/browser.html"})]
});

render(Browser, initial, document.body);

});
