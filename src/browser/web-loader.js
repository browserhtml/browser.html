/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Union, List, Maybe, Any} = require('common/typed');

  // Model
  const Model = Record({
    id: String,
    uri: String
  }, 'WebLoader');
  exports.Model = Model;

  // Actions

  const Load = Record({
    id: '@selected',
    uri: String
  }, 'WebView.Load');

  const LocationChange = Record({
    id: String,
    uri: String
  }, 'WebView.LocationChange');


  const Action = Union({Load, LocationChange});
  exports.Action = Action;

  // Update

  const update = (state, action) =>
    action instanceof Load ? state.set('uri', action.uri) :
    action instanceof LocationChange ? state.set('uri', action.uri) :
    state;
  exports.update = update;
});
