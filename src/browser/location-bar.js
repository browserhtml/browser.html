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
  const {mix} = require('common/style');
  const {isPrivileged} = require('common/url-helper');

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

  // Style

  const styleLocationBar = {
    display: 'inline-block',
    position: 'relative',
    MozWindowDragging: 'no-drag',
    borderRadius: 3,
    lineHeight: '30px',
    width: 460, // FIXME :Doesn't shrink when window is narrow
    height: 30,
    padding: '0 30px',
    margin: '0 67px',
    backgroundColor: 'rgba(0,0,0,0.07)',
    overflow: 'hidden'
  };

  const stylePageSummary = {
    lineHeight: '30px',
    overflow: 'hidden',
    width: '100%',
    display: 'inline-block',
    textOverflow: 'ellipsis',
    textAlign: 'center'
  };

  const styleCollapse = {
    /* We don't use display:none. We want the input to be focussable */
    maxWidth: 0,
    padding: 0
  };

  const styleButton = {
    position: 'absolute',
    top: 0,
    width: 30,
    height: 30,
    fontFamily: 'FontAwesome',
    textAlign: 'center',
    fontSize: '17px',
    verticalAlign: 'middle',
    cursor: 'default'
  };

  const styleDisabledButton = {
    opacity: 0.2,
    pointerEvents: 'none'
  };

  const styleUrlInput = {
    lineHeight: '30px',
    overflow: 'hidden',
    width: '100%',
    borderRadius: 0
  };

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

    const isInputFocused = input.isFocused;

    return DOM.div({
      style: mix(styleLocationBar, theme.locationBar),
      onMouseEnter: event => editTabStrip(Previews.activate)
    }, [
      DOM.div({
        style: mix(styleButton,
                   {left: 0},
                   theme.backButton,
                   !webView.canGoBack && styleDisabledButton),
        key: 'back',
        onClick: event => editSelectedWebView(WebView.goBack)
      }, '\uf053'), // UTF8 "back" icon
      Editable.renderField({
        key: 'input',
        style: mix(styleUrlInput,
                   theme.urlInput,
                   !isInputFocused && styleCollapse),
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
             style: mix(stylePageSummary,
                        theme.pageInfoText,
                        isInputFocused && styleCollapse),
             onClick: event => editInput(compose(Editable.selectAll, Editable.focus))}, [
        DOM.span({
          key: 'securityicon',
          style: {
            fontFamily: 'FontAwesome',
            fontWeight: 'normal',
            marginRight: 6,
            verticalAlign: 'middle'
          }
        }, isPrivileged(webView.uri) ? '\uf013' :  // Gear
           webView.securityState == 'secure' ? '\uf023' : ''), // Lock
        DOM.span({
          key: 'location',
          style: theme.locationText,
          style: {
            fontWeight: 'bold'
          }
        },
        webView.uri ? getDomainName(webView.uri) : ''),
        DOM.span({
          key: 'title',
          style: mix(theme.titleText, {padding: 5})
        },
        webView.title ? webView.title :
               webView.isLoading ? 'Loading...' :
               webView.uri ? webView.uri :
               'New Tab')
      ]),
      DOM.div({key: 'reload-button',
               style: mix(styleButton,
                          theme.reloadButton,
                          {right: 0},
                          webView.isLoading && {display:'none'},
                          !webView.uri && styleDisabledButton),
               onClick: event => editSelectedWebView(WebView.reload)
      }, '\uf01e'), // UTF8 "reload" icon
      DOM.div({key: 'stop-button',
               style: mix(styleButton,
                          theme.stopButton,
                          {right: 0},
                          !webView.isLoading && {display:'none'}),
               onClick: event => editSelectedWebView(WebView.stop)
      }, '\uf00d') // UTF8 "stop" icon
  ])});

  exports.LocationBar = LocationBar;
});
