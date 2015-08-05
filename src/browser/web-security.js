/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const {Record, Union, List, Maybe, Any} = require('../common/typed');
  const Loader = require('./web-loader');

  // Model
  const Model = Record({
    state: 'insecure',
    secure: false,
    extendedValidation: false
  });
  exports.Model = Model;

  // Action

  const SecurityChanged = Record({
    description: 'Security state of the page changed',
    state: String,
    extendedValidation: Boolean
  }, 'WebView.Security.Change');
  exports.SecurityChanged = SecurityChanged;

  // Update

  const update = (state, action) =>
    action instanceof SecurityChanged ? state.merge({
        state: action.state,
        secure: action.state === 'secure',
        extendedValidation: action.extendedValidation
      }) :
    action instanceof Loader.Load ? state.clear() :
    action instanceof Loader.LocationChanged ? state.clear() :
    state;
  exports.update = update;
