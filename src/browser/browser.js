/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {html, node, render, reframe} = require('reflex');
  const {Record, Any, Union} = require('common/typed');
  const {inspect} = require('common/debug');
  const WindowBar = require('./window-bar');
  const WindowControls = require('./window-controls');
  const LocationBar = require('./location-bar');
  const WebViews = require('./web-view-deck');
  const Theme = require('./theme');
  const {KeyBindings} = require('common/keyboard');
  const Focusable = require('common/focusable');
  const {Main} = require('./main');
  const Updates = require('./update-banner');
  const WebView = require('./web-view');
  const Session = require('./session');
  const Input = require('./web-input');
  const Preview = require('./web-preview');
  const ClassSet = require('common/class-set');
  const OS = require('common/os');
  const Pallet = require('service/pallet');
  const Suggestions = require('./suggestion-box');
  const URI = require('common/url-helper');

  // Model
  const Model = Record({
    version: '0.0.7',
    shell: Focusable.Model({isFocused: true}),
    updates: Updates.Model,
    webViews: WebViews.Model,
    input: Input.Model,
    suggestions: Suggestions.Model
  });
  exports.Model = Model;

  // Actions

  const {SaveSession, ResetSession, RestoreSession} = Session.Action;
  const {Focus, Blur} = Focusable.Action;
  const {ApplicationUpdate, RuntimeUpdate} = Updates.Action;

  const modifier = OS.platform() == 'linux' ? 'alt' : 'accel';
  const Binding = KeyBindings({
    'accel l': _ => Input.Action.Enter(),
    'accel t': _ => Input.Action.Enter({value: ''}),
    'accel 0': _ => WebView.Action.Shell.ResetZoom(),
    'accel -': _ => WebView.Action.Shell.ZoomOut(),
    'accel =': _ => WebView.Action.Shell.ZoomIn(),
    'accel shift =': _ => WebView.Action.Shell.ZoomIn(),
    'accel w': _ => WebViews.Action.Close(),
    'accel shift ]': _ => WebViews.Action.SelectByOffset({offset: 1}),
    'accel shift [': _ => WebViews.Action.SelectByOffset({offset: -1}),

    'accel shift backspace': _ => ResetSession(),
    'accel shift s': _ => SaveSession(),

    'accel r': _ => WebView.Action.Navigation.Reload(),
    'escape': _ => WebView.Action.Navigation.Stop(),
    [`${modifier} left`]: _ => WebView.Action.Navigation.GoBack(),
    [`${modifier} right`]: _ => WebView.Action.Navigation.GoForward()
  }, 'Browser.Keyboard.Action');

  const Action = Union({
    Binding: Binding.Action,
    Updates: Updates.Action,
    WebViews: WebViews.Action,
    Focusable: Focusable.Action,
    Session: Session.Action,
    Suggestions: Suggestions.Action
  });
  exports.Action = Action;



  // Update

  const update = (state, action) => {
    if (action instanceof Input.Action.Submit) {
      return state.merge({
        input: Input.update(state.input, action),
        webViews: WebViews.update(state.webViews, WebView.Action.Load({
          id: action.id,
          uri: URI.read(state.input.value)
        }))
      });
    }

    if (action instanceof Input.Action.Enter) {
      return state.merge({
        input: Input.update(state.input, action),
        webViews: WebViews.update(state.webViews, action)
      });
    }

    if (Focusable.Action.isTypeOf(action)) {
      return state.set('shell', Focusable.update(state.shell, action));
    }

    if (Input.Action.isTypeOf(action)) {
      return state.set('input', Input.update(state.input, action));
    }

    if (WebViews.Action.isTypeOf(action)) {
      return state.set('webViews', WebViews.update(state.webViews, action));
    }

    if (Updates.Action.isTypeOf(action)) {
      return state.set('updates', Updates.update(state.updates, action));
    }

    if (Session.Action.isTypeOf(action)) {
      return Session.update(state, action);
    }

    if (Suggestions.Action.isTypeOf(action)) {
      return state.set('suggestions',
                       Suggestions.update(state.suggestions, action));
    }

    return state
  }
  exports.update = update;


  exports.update = inspect(update, ([state, action], output) => {
    if (action instanceof WebView.Action.Progress.LoadProgress) {
      return null;
    }

    console.log(action.toString(),
                state.toJSON(),
                output && output.toJSON());
  });


  // View

  const OpenWindow = event => WebView.Open({uri: event.detail.url});

  const view = (state, address) => {
    const {shell, webViews, input, suggestions} = state;
    const selected = webViews.selected === null ? null :
                     webViews.entries.getIn([webViews.selected, 'view']);
    const theme = Theme.read(selected ? selected.page.pallet : {});

    return Main({
      key: 'root',
      windowTitle: !selected ? '' :
                   (selected.page.title || selected.uri),
      onKeyDown: address.pass(Binding, state),
      onWindowBlur: address.pass(Blur),
      onWindowFocus: address.pass(Focus),
      onUnload: address.pass(SaveSession),
      onAppUpdateAvailable: address.pass(ApplicationUpdate),
      onRuntimeUpdateAvailable: address.pass(RuntimeUpdate),
      onOpenWindow: address.pass(OpenWindow),
      tabIndex: 1,
      className: ClassSet({
        'moz-noscrollbars': true
      }),
      style: {
        height: '100vh',
        width: '100vw',
        color: theme.shellText,
        backgroundColor: theme.shell,
        position: 'relative',
        overflowY: 'hidden',
      }
    }, [
      render('WindowControls', WindowControls.view, shell, theme, address),
      render('WindowBar', WindowBar.view, !input.isFocused, shell, selected, theme, address),
      render('LocationBar', LocationBar.view, selected, input, suggestions, theme, address),
      render('Preview', Preview.view, webViews, input, selected, theme, address),
      render('Suggestions', Suggestions.view, suggestions, input.isFocused, theme, address),
      render('WebViews', WebViews.view, !input.isFocused, webViews, address),
      render('Updater', Updates.view, state.updates, address)
    ])
  };
  exports.view = view;
});
