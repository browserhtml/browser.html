
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Any, Union} = require('common/typed');

  // Action

  const ResetSession = Record({
    name: '@reset-session'
  }, 'Session.ResetSession');
  exports.ResetSession = ResetSession;

  exports.update = (state, action) => {
    if (action instanceof ResetSession) {
      return state.clear().merge({
        shell: {isFocused: true},
        input: {isFocused: true}
      });
    }
    return state
  };
});
