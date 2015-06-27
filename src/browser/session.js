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

  const RestoreSession = Record({
    name: '@restore-session'
  }, 'Session.RestoreSession');

  const ResetSession = Record({
    name: '@reset-session'
  }, 'Session.ResetSession');

  const Action = Union({SaveSession, RestoreSession, ResetSession});
  exports.Action = Action;


  exports.update = (state, action) => {
    if (action instanceof SaveSession) {
      const session = state
        .updateIn(['webViews', 'entries'],
                   entries => entries.map(entry =>
                      entry.update('view', WebView.persistent)))
        .remove('updates')
        .toJSON();

      localStorage[`session@${state.version}`] = JSON.stringify(session);

      return state;
    }

    if (action instanceof ResetSession) {
      return state.clear().merge({
        shell: {isFocused: document.hasFocus()},
        webViews: {
          entries: [
            {
              view: {
                id: 'about:dashboard',
                uri: 'data:text/html,'
              }
            }
          ]
        }
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
