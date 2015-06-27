/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Union, List, Maybe, Any} = require('common/typed');

  // Model

  const Model = Record({
    canGoBack: false,
    canGoForward: false,
    // Hack: `state` is a workaround for a `mozbrowser`-s unfortunate API
    // that does not quite gives enough control of a history graph that makes it
    // incompatible with declarative interface. For more details see:
    // https://github.com/benfrancis/webview/issues/4
    // In a future we're likely expose a different API that is probably going to
    // translate into imperative calls.
    state: Maybe(String) // 'goBack', 'goBack', 'stop', 'reload'.
  });
  exports.Model = Model;

  // Actions


  const GoBack = Record({id: '@selected'},'WebView.Navigation.GoBack');
  const GoForward = Record({id: '@selected'}, 'WebView.Navigation.GoForward');
  const Stop = Record({id: '@selected'}, 'WebView.Navigation.Stop');
  const Reload = Record({id: '@selected'}, 'WebView.Navigation.Reload');

  const CanGoBackChange = Record({
    id: String,
    value: Boolean
  }, 'WebView.Navigation.CanGoBackChange');

  const CanGoForwardChange = Record({
    id: String,
    value: Boolean
  }, 'WebView.Navigation.CanGoForwardChange');


  const Action = Union({GoBack, GoForward, Stop, Reload,
                        CanGoBackChange, CanGoForwardChange});
  exports.Action = Action;

  // Update

  const update = (state, action) =>
    action instanceof GoBack ? state.set('state', 'goBack') :
    action instanceof GoForward ? state.set('state', 'goForward') :
    action instanceof Stop ? state.set('state', 'stop') :
    action instanceof Reload ? state.set('state', 'reload') :
    action instanceof CanGoBackChange ? state.set('canGoBack', action.value) :
    action instanceof CanGoForwardChange ? state.set('canGoForward', action.value) :
    state;

  exports.update = update;

});
