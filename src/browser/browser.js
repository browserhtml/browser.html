/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const {html, node, thunk: render, forward} = require('reflex');
  const {Record, Maybe} = require('typed-immutable');
  const {inspect} = require('../common/debug');
  const {StyleSheet, Style} = require('../common/style');
  const WindowBar = require('./window-bar');
  const WindowControls = require('./window-controls');
  const WindowShell = require('./window-shell');
  const LocationBar = require('./location-bar');
  const Progress = require('./web-progress');
  const Theme = require('./theme');
  const {KeyBindings} = require('../common/keyboard');
  const Focusable = require('../common/focusable');
  const Updates = require('./update-banner');
  const WebView = require('./web-view');
  const Shell = require('./web-shell');
  const Input = require('./web-input');
  const Loader = require('./web-loader');
  const Preview = require('./web-preview');
  const Navigation = require('./web-navigation');
  const Session = require('./session');
  const OS = require('../common/os');
  const Suggestions = require('./suggestion-box');
  const URI = require('../common/url-helper');
  const SynthesisUI = require('./synthesis-ui');
  const DevtoolsHUD = require('./devtools-hud');
  const Selector = require('../common/selector');
  const {on, onWindow, title, scrollGrab} = require('driver');
  const {identity} = require('../lang/functional');


  const getOwnerWindow = node => node.ownerDocument.defaultView;

  // Model
  const Model = Record({
    version: require('../../package.json').version,
    mode: 'create-web-view', // or show-web-view, edit-web-view, choose-web-view
    transition: Maybe(String), // zoom, fade, or null (no transition)
    shell: WindowShell.Model,
    updates: Updates.Model,
    webViews: WebView.Model,
    input: Input.Model,
    suggestions: Suggestions.Model,
    devtoolsHUD: DevtoolsHUD.Model
  });
  exports.Model = Model;

  const initialize = () => Model({
    shell: WindowShell.initialize(true)
  });
  exports.initialize = initialize;

  // Actions

  const modifier = OS.platform() == 'linux' ? 'alt' : 'accel';
  const KeyDown = KeyBindings({
    'accel l': _ => Input.Action({action: Focusable.Focus()}),
    'accel t': _ => SynthesisUI.OpenNew(),
    'accel 0': _ => WebView.BySelected({action: Shell.ResetZoom()}),
    'accel -': _ => WebView.BySelected({action: Shell.ZoomOut()}),
    'accel =': _ => WebView.BySelected({action: Shell.ZoomIn()}),
    'accel shift =': _ => WebView.BySelected({action: Shell.ZoomIn()}),
    'accel w': _ => WebView.BySelected({action: WebView.Close()}),
    'accel shift ]': _ => WebView.Preview({action: Selector.Next()}),
    'accel shift [': _ => WebView.Preview({action: Selector.Previous()}),
    'control tab': _ => WebView.Preview({action: Selector.Next()}),
    'control shift tab': _ => WebView.Preview({action: Selector.Previous()}),
    'accel shift backspace': _ => Session.ResetSession(),
    'accel shift s': _ => Session.SaveSession(),
    'accel r': _ => WebView.BySelected({action: Navigation.Reload()}),
    'escape': _ => WebView.BySelected({action: Navigation.Stop()}),
    [`${modifier} left`]: _ => WebView.BySelected({action: Navigation.GoBack()}),
    [`${modifier} right`]: _ => WebView.BySelected({action: Navigation.GoForward()}),

    // TODO: `meta alt i` generates `accel alt i` on OSX we need to look
    // more closely into this but so declaring both shortcuts should do it.
    'accel alt i': _ => DevtoolsHUD.ToggleDevtoolsHUD(),
    'accel alt ˆ': _ => DevtoolsHUD.ToggleDevtoolsHUD(),
    'F12': _ => DevtoolsHUD.ToggleDevtoolsHUD()
  }, 'Browser.KeyDown.Action');

  const KeyUp = KeyBindings({
    'control': _ => SynthesisUI.ShowSelected(),
    'accel': _ => SynthesisUI.ShowSelected(),
  }, 'Browser.KeyUp.Action');


  // Update

  const update = SynthesisUI.update;
  exports.update = update;


  // Style

  const style = StyleSheet.create({
    shell: {
      color: null,
      backgroundColor: null,
      height: '100vh',
      width: '100vw',
      overflow: 'hidden'
    },
    webviewsContainer: {
      height: 'calc(100vh - 28px)',
    },
  });

  // View

  const OpenWindow = event =>
    WebView.Open({uri: event.detail.url});

  const view = (state, address) => {
    const {shell, webViews, input, suggestions, mode} = state;
    const {loader, page, security} = WebView.get(webViews, webViews.selected);
    const id = loader && loader.id;
    const theme =
      (mode === 'show-web-view' && page) ?
        Theme.read(page.pallet) :
      mode === 'show-web-view' ?
        Theme.default :
      Theme.dashboard;

    return html.div({
      key: 'root',
      title: title(!loader ? '' :
                   !page ? loader.uri :
                   page.title || loader.uri),
      onKeyDown: onWindow(forward(address, KeyDown), identity),
      onKeyUp: onWindow(forward(address, KeyUp), identity),
      onBlur: onWindow(forward(address, Focusable.Blured)),
      onFocus: onWindow(forward(address, Focusable.Focused)),
      onUnload: onWindow(forward(address, Session.SaveSession)),
      onMozBrowserOpenWindow: onWindow(address, OpenWindow),
      tabIndex: 1,
      className: theme.isDark ? 'is-dark' : '',
      style: Style(style.shell, {
        color: theme.shellText,
        backgroundColor: theme.shell,
      })
    }, [
      render('WindowControls', WindowControls.view,
        shell.isFocused, shell.controls.isHovering, theme, address),
      render('WindowBar', WindowBar.view,
        state.mode, id, shell, theme, address),
      render('ProgressBars', Progress.view,
        state.mode,
        webViews.loader,
        webViews.progress,
        webViews.selected,
        theme),
      render('LocationBar', LocationBar.view,
        state.mode, loader, security, page, input, suggestions, address),
      render('Preview', Preview.view,
        state.mode, webViews.loader, webViews.page, webViews.card,
        webViews.previewed, address),
      render('Suggestions', Suggestions.view,
        state.mode, suggestions, input, address),
      html.div({
        // The webviews should not require knowing the layout of external components.
        // Its size is always height:100%,width:100%.
        // We use this container to position it properly.
        style: style.webviewsContainer,
        key: 'web-views-container',
      }, [
        render('WebViews', WebView.view,
          state.mode,
          state.transition,
          webViews.loader,
          webViews.shell,
          webViews.navigation,
          webViews.page,
          webViews.sheet,
          address,
          webViews.selected)
      ]),
      render('DevtoolsHUD', DevtoolsHUD.view, state.devtoolsHUD, address),
      render('Updater', Updates.view, state.updates, address)
    ])
  };
  exports.view = view;
