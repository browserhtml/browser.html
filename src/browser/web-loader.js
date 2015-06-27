/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Union, List, Maybe, Any} = require('common/typed');

  // The reason this code is a separate module from web-view is to avoid
  // circular dependencies between components.

  // TODO: Consider merging `Load` & `LocationChange` into one.
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
});
