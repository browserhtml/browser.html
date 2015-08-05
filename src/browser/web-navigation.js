/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const {Record, Union, List, Maybe, Any} = require('../common/typed');
  const Loader = require('./web-loader');
  const Progress = require('./web-progress');

  // Model

  const Model = Record({
    canGoBack: false,
    canGoForward: false,
  });
  exports.Model = Model;

  // Actions

  const CanGoBackChanged = Record({
    description: 'Navigator state for going forward changed',
    value: Boolean
  }, 'WebView.Navigation.CanGoBackChanged');
  exports.CanGoBackChanged = CanGoBackChanged;

  const CanGoForwardChanged = Record({
    description: 'Navigator state for going back changed',
    value: Boolean
  }, 'WebView.Navigation.CanGoForwardChanged');
  exports.CanGoForwardChanged = CanGoForwardChanged;


  // Update

  const update = (state, action) =>
    action instanceof CanGoBackChanged ?
      state.set('canGoBack', action.value) :
    action instanceof CanGoForwardChanged ?
      state.set('canGoForward', action.value) :
    // Clear state when load is initiated or load is started.
    action instanceof Progress.LoadStarted ? state.clear() :
    action instanceof Loader.Load ? state.clear() :
    state;

  exports.update = update;
