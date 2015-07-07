/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {html, node, render, cache} = require('reflex');
  const {Record, Any, Union} = require('common/typed');
  const {inspect} = require('common/debug');
  const {StyleSheet, Style} = require('common/style');
  const WindowBar = require('./window-bar');
  const WindowControls = require('./window-controls');
  const LocationBar = require('./location-bar');
  const Progress = require('./progress-bar');
  const Theme = require('./theme');
  const {KeyBindings} = require('common/keyboard');
  const Focusable = require('common/focusable');
  const {Main} = require('./main');
  const Updates = require('./update-banner');
  const WebView = require('./web-view');
  const Session = require('./session');
  const Input = require('./web-input');
  const Loader = require('./web-loader');
  const Preview = require('./web-preview');
  const ClassSet = require('common/class-set');
  const OS = require('common/os');
  const Pallet = require('service/pallet');
  const Suggestions = require('./suggestion-box');
  const URI = require('common/url-helper');
  const Navigation = require('service/navigation');

  // Model
  const Model = Record({
    version: '0.0.7',
    mode: 'page',
    shell: Focusable.Model({isFocused: true}),
    updates: Updates.Model,
    webViews: WebView.Model,
    input: Input.Model,
    suggestions: Suggestions.Model
  });
  exports.Model = Model;

  // Actions

  const {SaveSession, ResetSession, RestoreSession} = Session.Action;
  const {Focused, Blured} = Focusable.Action;
  const {ApplicationUpdate, RuntimeUpdate} = Updates.Action;

  const modifier = OS.platform() == 'linux' ? 'alt' : 'accel';
  const Binding = KeyBindings({
    'accel l': _ => Input.Action.Enter(),
    'accel t': _ => Input.Action.Enter({value: ''}),
    'accel 0': _ => WebView.Action.Shell.ResetZoom(),
    'accel -': _ => WebView.Action.Shell.ZoomOut(),
    'accel =': _ => WebView.Action.Shell.ZoomIn(),
    'accel shift =': _ => WebView.Action.Shell.ZoomIn(),
    'accel w': _ => WebView.Action.Close(),
    'accel shift ]': _ => WebView.Action.SelectByOffset({offset: 1}),
    'accel shift [': _ => WebView.Action.SelectByOffset({offset: -1}),
    'control tab': _ => WebView.Action.SelectByOffset({offset: 1}),
    'control shift tab': _ => WebView.Action.SelectByOffset({offset: -1}),
    'accel shift backspace': _ => ResetSession(),
    'accel shift s': _ => SaveSession(),

    'accel r': _ => Navigation.Action.Reload(),
    'escape': _ => Navigation.Action.Stop(),
    [`${modifier} left`]: _ => Navigation.Action.GoBack(),
    [`${modifier} right`]: _ => Navigation.Action.GoForward()
  }, 'Browser.Keyboard.Action');

  const Action = Union({
    Binding: Binding.Action,
    Updates: Updates.Action,
    WebView: WebView.Action,
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
        webViews: WebView.update(state.webViews, Loader.Action.Load({
          id: action.id,
          uri: URI.read(state.input.value)
        }))
      });
    }

    if (action instanceof Input.Action.Enter) {
      return state.merge({
        input: Input.update(state.input, action),
        webViews: WebView.update(state.webViews, action)
      });
    }

    if (Focusable.Action.isTypeOf(action)) {
      return state.set('shell', Focusable.update(state.shell, action));
    }

    if (Input.Action.isTypeOf(action)) {
      return state.set('input', Input.update(state.input, action));
    }

    if (WebView.Action.isTypeOf(action)) {
      return state.set('webViews', WebView.update(state.webViews, action));
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


  /*
  exports.update = inspect(update, ([state, action], output) => {
    if (action instanceof WebView.Action.Progress.LoadProgress) {
      return null;
    }

    console.log(action.toString(),
                state.toJSON(),
                output && output.toJSON());
  });
  */


  // Style

  const style = StyleSheet.create({
    shell: {
      color: null,
      backgroundColor: null,

      height: '100vh',
      width: '100vw',
      position: 'relative',
      overflowY: 'hidden',
    }
  });

  // View

  const OpenWindow = event => WebView.Open({uri: event.detail.url});
  const defaultTheme = Theme.read({});

  const view = (state, address) => {
    const {shell, webViews, input, suggestions} = state;
    const {loader, page, progress, security} = WebView.get(webViews,
                                                           webViews.selected);

    const theme = input.isFocused ? defaultTheme :
                  page ? cache(Theme.read, page.pallet) :
                  defaultTheme;

    return Main({
      key: 'root',
      windowTitle: !loader ? '' :
                   !page ? loader.uri :
                   page.title || loader.uri,
      onKeyDown: address.pass(Binding),
      onWindowBlur: address.pass(Blured),
      onWindowFocus: address.pass(Focused),
      onUnload: address.pass(SaveSession),
      onOpenWindow: address.pass(OpenWindow),
      tabIndex: 1,
      style: Style(style.shell, {
        color: theme.shellText,
        backgroundColor: theme.shell,
      })
    }, [
      render('WindowControls', WindowControls.view, shell, theme, address),
      render('WindowBar', WindowBar.view,
        !input.isFocused,
        loader && loader.id,
        shell,
        theme,
        address),
      !input.isFocused && render('ProgressBar', Progress.view,
        loader && loader.id,
        progress,
        theme, address),
      render('LocationBar', LocationBar.view,
        loader, security, page,
        input, suggestions, theme, address),
      render('Preview', Preview.view,
        webViews.loader,
        webViews.page,
        input,
        webViews.selected,
        theme,
        address),
      render('Suggestions', Suggestions.view, suggestions, input.isFocused, theme, address),
      render('WebViews', WebView.view,
        webViews.loader,
        webViews.shell,
        webViews.page,
        address,
        webViews.selected,
        !input.isFocused),
      render('Updater', Updates.view, state.updates, address)
    ])
  };
  exports.view = view;
});
