/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Union, List, Maybe, Any} = require('common/typed');

  // Model
  const Model = Record({
    state: 'insecure',
    secure: false,
    extendedValidation: false
  });
  exports.Model = Model;

  // Action

  const SecurityChange = Record({
    id: String,
    state: String,
    extendedValidation: Boolean
  }, 'WebView.Security.Change');

  const Action = Union({SecurityChange});
  exports.Action = Action;


  const update = (state, action) =>
    action instanceof SecurityChange ? state.merge({
        state: action.state,
        secure: action.state === 'secure',
        extendedValidation: action.extendedValidation
      }) :
    state;
  exports.update = update;

});
