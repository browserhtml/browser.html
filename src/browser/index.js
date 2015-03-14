/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  require('./github'); // Pull updates from github

  const {render} = require('./core');
  const {Browser} = require('./browser');
  const {readSession, resetSession} = require('./actions');

  // See issue #218
  let session = readSession() || resetSession();
  session = session.set('appUpdateAvailable', false);
  render(Browser, session , document.body);

});
