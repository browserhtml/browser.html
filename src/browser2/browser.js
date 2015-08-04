
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {html, render, cache} = require('reflex');
  const {Record} = require('common/typed');
  const {StyleSheet, Style} = require('common/style');
  const {KeyBindings} = require('common/keyboard');
  const Focusable = require('common/focusable');
  const OS = require('common/os');

  const Navigation = require('service/navigation');

  const DevtoolsHUD = require('browser/devtools-hud');
  const Input = require('browser/web-input');
  const {Main} = require('browser/main');
  const WebView = require('browser/web-view');
  const Shell = require('browser/web-shell');
  const Progress = require('browser/web-progress');
  const Theme = require('browser/theme');

  const TabViews = {
    none: {
      isVertical: true,
      height: 0,
      view: () => null,
    },
    bottom: require('browser2/tabs/bottom'),
    side: require('browser2/tabs/side'),
    smallside: require('browser2/tabs/smallside'),
  }

  const TabMode = require('browser2/tabmode');

  const WindowBar = require('browser2/window-bar');
  const LocationBar = require('browser2/location-bar');
  const UI = require('browser2/ui');

  const Suggestions = require('browser/suggestion-box');

  // Model
  const Model = Record({
    version: '0.0.7',
    shell: Focusable.Model({isFocused: true}),
    webViews: WebView.Model,
    input: Input.Model,
    devtoolsHUD: DevtoolsHUD.Model,
    suggestions: Suggestions.Model,
    tabMode: TabMode.Model,
  });
  exports.Model = Model;

  // Actions

  const modifier = OS.platform() == 'linux' ? 'alt' : 'accel';
  const KeyDown = KeyBindings({
    'accel l': _ => Input.Action({action: Focusable.Focus()}),
    'accel t': _ => WebView.Action({action: WebView.Open()}),
    'accel 0': _ => Shell.ResetZoom(),
    'accel -': _ => Shell.ZoomOut(),
    'accel =': _ => Shell.ZoomIn(),
    'accel shift =': _ => Shell.ZoomIn(),
    'accel w': _ => WebView.Action({action: WebView.Close()}),
    'accel shift ]': _ => WebView.SelectNext(),
    'accel shift [': _ => WebView.SelectPrevious(),
    'control tab': _ => WebView.SelectPrevious(), // tabs are stored old last
    'control shift tab': _ => WebView.SelectNext(),
    'accel r': _ => Navigation.Reload(),
    'escape': _ => Navigation.Stop(),
    'F12': _ => DevtoolsHUD.ToggleDevtoolsHUD(),
    [`${modifier} left`]: _ => Navigation.GoBack(),
    [`${modifier} right`]: _ => Navigation.GoForward()
  }, 'Browser.KeyDown.Action');


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

  exports.update = pipeline([
    UI.update,
    (state, action) => state.set('webViews', WebView.update(state.webViews, action)), // FIXME: webview.update has a lot of overlap (but no-op) with UI.update
    (state, action) => state.set('input', Input.update(state.input, action)),
    (state, action) => state.set('devtoolsHUD', DevtoolsHUD.update(state.devtoolsHUD, action)),
    (state, action) => state.set('suggestions', Suggestions.update(state.suggestions, action)),
    (state, action) => state.set('tabMode', TabMode.update(state.tabMode, action)),
  ]);


  // View

  const OpenWindow = event =>
    WebView.Action({action: WebView.Open({uri: event.detail.url}) });

  const defaultTheme = Theme.read({});

  const styleBoxes = StyleSheet.create({
    hbox: {
      display: 'flex',
    },
    vbox: {
      display: 'flex',
      flexDirection: 'column',
    },
    scrollable: {
      overflowY: 'scroll',
      scrollSnapType: 'mandatory',
      scrollSnapDestination: '0 0',
    },
    flex1: {
      flexGrow: '1',
    },
    fullVH: {
      height: '100vh'
    },
    webViewContainer: {
      scrollSnapCoordinate: '0 0',
      display: 'flex',
      flexGrow: '1',
    },
    webViewContainerBigger: {
      flexShrink: '0',
    },
  });

  const view = (state, address) => {

    const {shell, webViews, input, suggestions, tabMode, devtoolsHUD} = state;
    const {loader, page, security, navigation, progress} = WebView.get(webViews, webViews.selected);
    const id = loader && loader.id;

    const tabCount = webViews.loader.count();

    const theme = page ? cache(Theme.read, page.pallet) : defaultTheme;

    const contentCanScroll = page && page.overflow;

    const tabs = TabViews[tabMode.mode];

    return Main({
      key: 'root',
      style: Style(styleBoxes.fullVH, tabs.isVertical ? styleBoxes.hbox : styleBoxes.vbox),
      windowTitle: !loader ? '' :
                   !page ? loader.uri :
                   page.title || loader.uri,
      onKeyDown: address.pass(KeyDown),
      onWindowBlur: address.pass(Focusable.Blured),
      onWindowFocus: address.pass(Focusable.Focused),
      onOpenWindow: address.pass(OpenWindow),
      tabIndex: 1
    }, [
      html.div({
        key: 'scrollableBox',
        style: Style(styleBoxes.scrollable, styleBoxes.vbox, styleBoxes.flex1),
        className: 'moz-noscrollbars',
      }, [
        render('WindowBar', WindowBar.view, tabMode, shell, loader, progress, navigation, security, page, input, suggestions, webViews.selected, tabCount, theme, address),
        render('ProgressBars', Progress.view, 'show-web-view', webViews.loader, webViews.progress, webViews.selected, theme),
        render('Suggestions', Suggestions.view, 'edit-web-view', suggestions, input, address),
        html.div({
          key: 'resizableVbox',
          style: Style(styleBoxes.webViewContainer, contentCanScroll && styleBoxes.webViewContainerBigger, {height: `calc(100vh - ${tabs.height}px)`}),
        }, render('WebViews', WebView.view, 'show-web-view', 'zoom', webViews.loader, webViews.shell, webViews.page, address, webViews.selected)),
        render('DevtoolsHUD', DevtoolsHUD.view, devtoolsHUD, address),
      ]),
      render('Tabs', tabs.view, tabMode, webViews.page, webViews.loader, webViews.progress, webViews.selected, address),
    ])
  };
  exports.view = view;
});
