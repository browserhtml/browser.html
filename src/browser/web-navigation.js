/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Union, List, Maybe, Any} = require('common/typed');
  const Loader = require('./web-loader');
  const Progress = require('./progress-bar');

  // Model

  const Model = Record({
    canGoBack: false,
    canGoForward: false,
  });
  exports.Model = Model;

  // Actions

  const CanGoBackChange = Record({
    id: String,
    value: Boolean
  }, 'WebView.Navigation.CanGoBackChange');

  const CanGoForwardChange = Record({
    id: String,
    value: Boolean
  }, 'WebView.Navigation.CanGoForwardChange');


  const {Load} = Loader.Action;
  const {LoadStart} = Progress.Action;

  const Action = Union({CanGoBackChange, CanGoForwardChange, Load, LoadStart});
  exports.Action = Action;

  // Update

  const update = (state, action) =>
    action instanceof CanGoBackChange ? state.set('canGoBack', action.value) :
    action instanceof CanGoForwardChange ? state.set('canGoForward', action.value) :
    action instanceof LoadStart ? state.clear() :
    action instanceof Load ? state.clear() :
    state;

  exports.update = update;

});
