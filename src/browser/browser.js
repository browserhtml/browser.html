/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {html, node, render, cache} = require('reflex');
  const {Record, Any, Union, Maybe} = require('common/typed');
  const {inspect} = require('common/debug');
  const {StyleSheet, Style} = require('common/style');
  const WindowBar = require('./window-bar');
  const WindowControls = require('./window-controls');
  const LocationBar = require('./location-bar');
  const Progress = require('./web-progress');
  const Theme = require('./theme');
  const {KeyBindings} = require('common/keyboard');
  const Focusable = require('common/focusable');
  const {Main} = require('./main');
  const Updates = require('./update-banner');
  const WebView = require('./web-view');
  const Shell = require('./web-shell');
  const Input = require('./web-input');
  const Loader = require('./web-loader');
  const Preview = require('./web-preview');
  const Session = require('./session');
  const ClassSet = require('common/class-set');
  const OS = require('common/os');
  const Suggestions = require('./suggestion-box');
  const URI = require('common/url-helper');
  const Navigation = require('service/navigation');
  const SynthesisUI = require('./synthesis-ui');
  const DevtoolsHUD = require('./devtools-hud');

  // Model
  const Model = Record({
    version: '0.0.7',
    mode: 'create-web-view', // or show-web-view, edit-web-view, choose-web-view
    transition: Maybe(String), // zoom, fade, or null (no transition)
    shell: Focusable.Model({isFocused: true}),
    updates: Updates.Model,
    webViews: WebView.Model,
    input: Input.Model,
    suggestions: Suggestions.Model,
    devtoolsHUD: DevtoolsHUD.Model,
  });
  exports.Model = Model;

  // Actions

  const modifier = OS.platform() == 'linux' ? 'alt' : 'accel';
  const KeyDown = KeyBindings({
    'accel l': _ => Input.Action({action: Focusable.Focus()}),
    'accel t': _ => WebView.FadeToOpen(),
    'accel 0': _ => Shell.ResetZoom(),
    'accel -': _ => Shell.ZoomOut(),
    'accel =': _ => Shell.ZoomIn(),
    'accel shift =': _ => Shell.ZoomIn(),
    'accel w': _ => WebView.Action({action: WebView.Close()}),
    'accel shift ]': _ => WebView.SelectNext(),
    'accel shift [': _ => WebView.SelectPrevious(),
    'control tab': _ => WebView.SelectNext(),
    'control shift tab': _ => WebView.SelectPrevious(),
    'accel shift backspace': _ => Session.ResetSession(),
    'accel shift s': _ => Session.SaveSession(),
    'accel r': _ => Navigation.Reload(),
    'escape': _ => Navigation.Stop(),
    'F12': _ => DevtoolsHUD.ToggleDevtoolsHUD(),
    [`${modifier} left`]: _ => Navigation.GoBack(),
    [`${modifier} right`]: _ => Navigation.GoForward()
  }, 'Browser.KeyDown.Action');

  const KeyUp = KeyBindings({
    'control': _ => SynthesisUI.Select(),
    'accel': _ => SynthesisUI.Select(),
  }, 'Browser.KeyUp.Action');


  // Update


  // Utility function takes `update` functions and attepts to handle action
  // with each one in the order they were passed until one of them returns
  // updated state in which case it returns that state and no longer calls
  // any further update functions.
  const pipeline = updaters => {
    const count = updaters.length
    return (state, action) => {
      var index = 0
      var before = state
      while (index < count) {
        const after = updaters[index](before, action)
        index = index + 1

        if (before !== after) {
          return after
        }
      }
      return state
    }
  };

  const update = pipeline([
    SynthesisUI.update,
    (state, action) =>
      state.set('webViews', WebView.update(state.webViews, action)),
    (state, action) =>
      state.set('input', Input.update(state.input, action)),
    Session.update,
    (state, action) =>
      state.set('devtoolsHUD', DevtoolsHUD.update(state.devtoolsHUD, action)),
    (state, action) =>
      state.set('suggestions', Suggestions.update(state.suggestions, action))
  ]);
  exports.update = update;


  // Style

  const style = StyleSheet.create({
    shell: {
      color: null,
      backgroundColor: null,
      height: '100vh',
      width: '100vw',
      position: 'relative',
    },
    webviewsContainer: {
      height: 'calc(100vh - 28px)',
    },
  });

  // View

  const OpenWindow = event =>
    WebView.Action({action: WebView.Open({uri: event.detail.url}) });

  const view = (state, address) => {
    const {shell, webViews, input, suggestions, mode} = state;
    const {loader, page, security} = WebView.get(webViews, webViews.selected);
    const id = loader && loader.id;
    const theme =
      (mode === 'show-web-view' && page) ?
        cache(Theme.read, page.pallet) :
      mode === 'show-web-view' ?
        Theme.default :
      Theme.dashboard;

    return Main({
      key: 'root',
      windowTitle: !loader ? '' :
                   !page ? loader.uri :
                   page.title || loader.uri,
      onKeyDown: address.pass(KeyDown),
      onKeyUp: address.pass(KeyUp),
      onWindowBlur: address.pass(Focusable.Blured),
      onWindowFocus: address.pass(Focusable.Focused),
      onUnload: address.pass(Session.SaveSession),
      onOpenWindow: address.pass(OpenWindow),
      tabIndex: 1,
      style: Style(style.shell, {
        color: theme.shellText,
        backgroundColor: theme.shell,
      })
    }, [
      render('WindowControls', WindowControls.view, shell, theme, address),
      render('WindowBar', WindowBar.view,
        state.mode, id, shell, theme, address),
      render('ProgressBars', Progress.view,
        state.mode,
        webViews.loader,
        webViews.progress,
        webViews.selected,
        theme),
      render('LocationBar', LocationBar.view,
        state.mode, loader, security, page, input, suggestions, theme, address),
      render('Preview', Preview.view,
        state.mode, webViews.loader, webViews.page, webViews.selected, theme, address),
      render('Suggestions', Suggestions.view,
        state.mode, suggestions, input, theme, address),
      html.div({
        // The webviews should not require knowing the layout of external components.
        // Its size is always height:100%,width:100%.
        // We use this container to position it properly.
        style: style.webviewsContainer,
        key: 'web-views-container',
      },
        render('WebViews', WebView.view,
          state.mode,
          state.transition,
          webViews.loader,
          webViews.shell,
          webViews.page,
          address,
          webViews.selected)),
      render('DevtoolsHUD', DevtoolsHUD.view, state.devtoolsHUD, address),
      render('Updater', Updates.view, state.updates, address)
    ])
  };
  exports.view = view;
});
