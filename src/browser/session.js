/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Any, Union} = require('common/typed');
  const WebView = require('./web-view');

  // Action

  const SaveSession = Record({
    name: '@save-session'
  }, 'Session.SaveSession');
  exports.SaveSession = SaveSession;

  const RestoreSession = Record({
    name: '@restore-session'
  }, 'Session.RestoreSession');
  exports.RestoreSession = RestoreSession;

  const ResetSession = Record({
    name: '@reset-session'
  }, 'Session.ResetSession');
  exports.ResetSession = ResetSession;

  // Todo: Refactor this module into a service and store session into pouch instead of localStorage.
  exports.update = (state, action) => {
    if (action instanceof SaveSession) {
      const session = state
        //.update('webViews', WebView.write)
        .remove('updates')
        .toJSON();

      localStorage[`session@${state.version}`] = JSON.stringify(session);

      return state;
    }

    if (action instanceof ResetSession) {
      return state.clear().merge({
        shell: {isFocused: true},
        input: {isFocused: true}
      });
    }

    if (action instanceof RestoreSession) {
      const session = localStorage[`session@${state.version}`];
      if (session) {
        try {
          return state.clear().merge(JSON.parse(session));
        } catch (error) {
          console.error(`Failed to restore a session`, error);
        }
      } else {
        console.error('Compatible session was not found, loading default');
      }

      return exports.update(state, ResetSession());
    }

    return state
  };


});
