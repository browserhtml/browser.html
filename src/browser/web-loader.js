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
    description: 'Request loading of the passed `uri`',
    uri: String
  }, 'WebView.Load');
  exports.Load = Load;

  const LocationChanged = Record({
    description: 'Location of the web view changed to enclosed uri',
    uri: String
  }, 'WebView.LocationChanged');
  exports.LocationChanged = LocationChanged;

  // Update

  const update = (state, action) =>
    action instanceof Load ? state.set('uri', action.uri) :
    action instanceof LocationChanged ? state.set('uri', action.uri) :
    state;
  exports.update = update;
});
