/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {DOM} = require('react')
  const Component = require('omniscient');
  const {throttle, compose} = require('lang/functional');
  const {Suggestions} = require('./suggestion-box');
  const {Editable} = require('common/editable');
  const {WebView} = require('./web-view');
  const {Previews} = require('./preview-box');
  const {getDomainName} = require('common/url-helper');
  const {KeyBindings} = require('common/keyboard');

  // Model
  const LocationBar = function(state) {
    return Object.assign({}, state, {input: Editable(state.input)})
  }

  // Actions
  LocationBar.enter = compose(Editable.selectAll, Editable.focus)
  LocationBar.suggest = throttle(Suggestions.compute, 200)
  LocationBar.select = Editable.select
  LocationBar.selectAll = Editable.selectAll
  LocationBar.focus = Editable.focus
  LocationBar.blur = Editable.blur

  // View

  // Bindings for navigation suggestions.
  const onSuggetionNavigation = KeyBindings({
    'up': edit => edit(Suggestions.selectPrevious),
    'control p': edit => edit(Suggestions.selectPrevious),
    'down': edit => edit(Suggestions.selectNext),
    'control n': edit => edit(Suggestions.selectNext),
    'enter': edit => edit(Suggestions.unselect)
  });

  // General input keybindings.
  const onInputNavigation = KeyBindings({
    'escape': (editInput, editSelectedWebView) => {
      editSelectedWebView(Editable.focus).toJSON();
      // TODO: This should not be necessary but since in case of dashboard focus
      // is passed to a hidden iframe DOM ignores that and we end up with focus
      // still in an `input`. As a workaround for now we manually `blur` input.
      editInput(Editable.blur);
    },
    'accel l': (editInput, _) => editInput(LocationBar.enter)
  });


  LocationBar.render = Component(function LocationBarView(state, handlers) {
    const {input, tabStrip, webView, suggestions, theme} = state;
    const {onNavigate, editTabStrip, onGoBack, editSelectedWebView,
           editInput, editSuggestions} = handlers;

    return DOM.div({
      className: 'locationbar',
      style: theme.locationBar,
      onMouseEnter: event => editTabStrip(Previews.activate)
    }, [
      DOM.div({className: 'backbutton',
               style: theme.backButton,
               key: 'back',
               onClick: event => editSelectedWebView(WebView.goBack)}),
      Editable.renderField({
        key: 'input',
        className: 'urlinput',
        style: theme.urlInput,
        placeholder: 'Search or enter address',
        value: Suggestions.selected(suggestions) || webView.userInput,
        type: 'text',
        submitKey: 'Enter',
        isFocused: input.isFocused,
        selectionStart: input.selectionStart,
        selectionEnd: input.selectionEnd,
        selectionDirection: input.selectionDirection,
        onFocus: event => {
          LocationBar.suggest(event.target.value, editSuggestions);
          editInput(Editable.focus);
        },
        onBlur: event => {
          editSuggestions(Suggestions.reset);
          editInput(Editable.blur);
        },
        onSelect: event => editInput(Editable.select(event.target)),
        onChange: event => {
          // Reset suggestions & compute new ones from the changed input value.
          editSuggestions(Suggestions.unselect);
          LocationBar.suggest(event.target.value, editSuggestions);
          // Also reflect changed value onto webViews useInput.
          editSelectedWebView(viewer => viewer.set('userInput', event.target.value));
        },
        onSubmit: event => {
          editSuggestions(Suggestions.reset);
          onNavigate(event.target.value);
        },
        onKeyDown: compose(onInputNavigation(editInput, editSelectedWebView),
                           onSuggetionNavigation(editSuggestions))
      }),
      DOM.p({key: 'page-info',
             className: 'pagesummary',
             style: theme.pageInfoText,
             onClick: event => editInput(compose(Editable.selectAll, Editable.focus))}, [
        DOM.span({key: 'location',
                  style: theme.locationText,
                  className: 'pageurlsummary'},
                 webView.uri ? getDomainName(webView.uri) : ''),
        DOM.span({key: 'title',
                  className: 'pagetitle',
                  style: theme.titleText},
                 webView.title ? webView.title :
                 webView.isLoading ? 'Loading...' :
                 webView.uri ? webView.uri :
                 'New Tab')
      ]),
      DOM.div({key: 'reload-button',
               className: 'reloadbutton',
               style: theme.reloadButton,
               onClick: event => editSelectedWebView(WebView.reload)}),
      DOM.div({key: 'stop-button',
               className: 'stopbutton',
               style: theme.stopButton,
               onClick: event => editSelectedWebView(WebView.stop)}),
  ])});

  exports.LocationBar = LocationBar;
});
