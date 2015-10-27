/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const {Record, Union, List, Maybe, Any} = require('typed-immutable');
  const Loader = require('./web-loader');
  const Progress = require('./web-progress');

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


  const GoBack = Record({
    description: 'Navigate web-view back',
    isGoBack: true
  },'WebView.Navigation.GoBack');
  exports.GoBack = GoBack;

  const GoForward = Record({
    description: 'Navigate web-view forward',
    isGoForward: true
  }, 'WebView.Navigation.GoForward');
  exports.GoForward = GoForward;

  const Stop = Record({
    description: 'Interupt web-view navigation',
    isStop: true
  }, 'WebView.Navigation.Stop');
  exports.Stop = Stop;

  const Reload = Record({
    description: 'Reload web-view',
    isReload: true
  },  'WebView.Navigation.Reload');
  exports.Reload = Reload;

  const Action = Union(CanGoBackChanged, CanGoForwardChanged,
                       Stop, Reload, GoBack, GoForward);
  exports.Action = Action;

  // Model

  const Model = Record({
    canGoBack: false,
    canGoForward: false,
    state: Maybe(Union(Stop, Reload, GoBack, GoForward))
  });
  exports.Model = Model;


  // Update

  const update = (state, action) =>
    action instanceof CanGoBackChanged ?
      state.set('canGoBack', action.value) :
    action instanceof CanGoForwardChanged ?
      state.set('canGoForward', action.value) :
    action instanceof GoBack ?
      state.set('state', GoBack({isGoBack: true})) :
    action instanceof GoForward ?
      state.set('state', GoForward({isGoForward: true})) :
    action instanceof Stop ?
      state.set('state', Stop({isStop: true})) :
    action instanceof Reload ?
      state.set('state', Reload({isReload: true})) :
    action instanceof Loader.LocationChanged ?
      state.set('state', null) :
    action instanceof Progress.LoadStarted ?
      state.clear() :
    action instanceof Loader.Load ?
      state.clear() :
    state;

  exports.update = update;
