/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const {Record, Any, Union} = require('../common/typed');
  const {compose} = require('../lang/functional');
  const WebView = require('./web-view');
  const Preview = require('./web-preview');
  const Input = require('./web-input');
  const Suggestions = require('./suggestion-box');
  const Gesture = require('../service/gesture');
  const URI = require('../common/url-helper');
  const Focusable = require('../common/focusable');
  const Editable = require('../common/editable');
  const Navigation = require('../service/navigation');
  const Selector = require('../common/selector');

  // Action

  const OpenNew = Record({
    description: 'Start a new web-view'
  }, 'WebView.OpenNew');
  exports.OpenNew = OpenNew;

  const ShowSelected = Record({
    description: 'Activate selected web-view'
  }, 'SynthesisUI.Select');
  exports.ShowSelected = ShowSelected;

  const Escape = Record({
    description: 'Escape'
  }, 'SynthesisUI.Escape');
  exports.Escape = Escape;

  const ShowPreview = Record({
    description: 'Display previews'
  }, 'SynthesisUI.ShowPreview');

  // Update

  const switchMode = (mode, transition) => state =>
    state.merge({mode, transition});

  const fadeToEditMode = switchMode('edit-web-view', 'fade');
  const zoomToEditMode = switchMode('edit-web-view', 'zoom');
  const fadeToSelectMode = switchMode('select-web-view', 'fade');
  const fadeToShowMode = switchMode('show-web-view', 'fade');

  const edit = (field, update) =>
    state => state.update(field, update);

  const focusInput = edit('input', Focusable.focus);
  const selectInput = edit('input', Editable.selectAll);
  const blurInput = edit('input', Focusable.blur);
  const clearInput = edit('input', Editable.clear);


  const selectViewByIndex = (state, index) =>
    state.set('webViews',
              WebView.activate(state.webViews.set('previewed', index)));

  const showWebViewByIndex = compose(
    switchMode('show-web-view', 'zoom'),
    selectViewByIndex
  );

  const createWebView = compose(
    focusInput,
    (state, transition) =>
      state.mode === 'create-web-view' ?
      state :
      state.mergeDeep({
        mode: 'create-web-view',
        input: {value: null},
        transition
      }));

  const setInputToURIBySelected = state =>
    state.setIn(['input', 'value'],
                state.getIn(['webViews',
                             'loader',
                             state.webViews.selected,
                             'uri']));

  const clearSuggestions = edit('suggestions', Suggestions.clear);

  const fadeToEdit = state =>
    state.mode === 'edit-web-view' ? state :
    state.mode === 'create-web-view' ? state :
    fadeToEditMode(state);


  const editSelectedWebView = compose(
    fadeToEdit,
    selectInput,
    focusInput,
    clearSuggestions,
    state =>
      state.mode === 'edit-web-view' ? state :
      state.mode === 'create-web-view' ? state :
      setInputToURIBySelected(state));

  const closeWebViewByIndex = compose(
    switchMode('edit-web-view', null),
    selectInput,
    focusInput,
    setInputToURIBySelected,
    (state, n) =>
      state.set('webViews', WebView.closeByIndex(state.webViews, n)));

  const navigate = (state, value) => {
    const uri = URI.read(value);
    const webViews = state.mode === 'edit-web-view' ?
      WebView.loadByIndex(state.webViews,
                          state.webViews.selected,
                          {uri}) :
      WebView.open(state.webViews, {uri});

    return state.set('webViews', webViews);
  };

  const submit = compose(
    fadeToShowMode,
    clearSuggestions,
    clearInput,
    navigate);

  const zoomToEditModeFromShowMode = state =>
    state.mode !== 'show-web-view' ? state :
    zoomToEditMode(state);

  const zoomEditSelectedWebView = compose(
    zoomToEditModeFromShowMode,
    selectInput,
    focusInput,
    clearSuggestions,
    setInputToURIBySelected);


  const fadeToSelectModefromShowMode = state =>
    state.mode !== 'show-web-view' ? state :
    fadeToSelectMode(state);

  const showPreview = compose(fadeToSelectMode, blurInput);

  const updateByWebViewIndex = (state, n, action) =>
    action instanceof Focusable.Focus ?
      showWebViewByIndex(state, n) :
    action instanceof Focusable.Focused ?
      showWebViewByIndex(state, n) :
    action instanceof WebView.Close ?
      closeWebViewByIndex(state, n) :
    state;

  const updateByWebViewID = (state, id, action) =>
    updateByWebViewIndex(state, WebView.indexByID(state.webViews, id), action);

  const updateBySelectedWebView = (state, action) =>
    updateByWebViewIndex(state, state.webViews.selected, action);

  const updateByInputAction = (state, action) =>
    action instanceof Input.Submit ? submit(state, action.value) :
    action instanceof Focusable.Focus ? editSelectedWebView(state) :
    action instanceof Focusable.Focused ? editSelectedWebView(state) :
    state;

  const fadeToShowModeFromSelectMode = state =>
    state.mode === 'select-web-view' ? fadeToShowMode(state) :
    state;

  const activateSelectedWebView = state =>
    state.update('webViews', WebView.activate);

  const completeSelection = compose(
    fadeToShowModeFromSelectMode,
    activateSelectedWebView);

  const escape = state =>
    // If we're already showing a webview, or we can't show a webview because
    // none exist yet, do nothing. Otherwise, fade to the selected web view.
    state.mode === 'show-web-view' || state.webViews.selected === null ? state :
    fadeToShowMode(state);

  const update = (state, action) =>
    action instanceof Navigation.Stop ?
      escape(state) :
    action instanceof Input.Action ?
      updateByInputAction(state, action.action) :
    action instanceof Input.Submit ?
      updateByInputAction(state, action) :
    action instanceof Preview.Create ?
      createWebView(state, 'zoom') :
    action instanceof OpenNew ?
      createWebView(state, 'fade') :

    action instanceof WebView.ByID ?
      updateByWebViewID(state, action.id, action.action) :
    action instanceof WebView.BySelected ?
      updateBySelectedWebView(state, action.action) :

    action instanceof Gesture.Pinch ?
      zoomEditSelectedWebView(state) :
    action instanceof ShowSelected ?
      completeSelection(state) :
    action instanceof ShowPreview ?
      showPreview(state) :
    state;
  exports.update = update;


  const service = address => {
    let id = -1;
    const showPreview = address.pass(ShowPreview)

    return action => {
      if (action instanceof WebView.Preview) {
        id = setTimeout(showPreview, 70);
      }

      if (action instanceof ShowSelected) {
        clearTimeout(id);
      }
    }
  }
  exports.service = service
