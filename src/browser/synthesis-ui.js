/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const {Record} = require('typed-immutable');
  const {compose} = require('../lang/functional');
  const WebView = require('./web-view');
  const Preview = require('./web-preview');
  const Navigation = require('./web-navigation');
  const {Load} = require('./web-loader');
  const Input = require('./web-input');
  const Suggestions = require('./suggestion-box');
  const Gesture = require('../service/gesture');
  const URI = require('../common/url-helper');
  const Focusable = require('../common/focusable');
  const Pointer = require('../common/pointer');
  const Editable = require('../common/editable');
  const Selector = require('../common/selector');
  const Session = require('./session');
  const DevtoolsHUD = require('./devtools-hud');
  const WindowShell = require('./window-shell');
  const {forward} = require('reflex');


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
                          Load({uri})) :
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
    action instanceof Navigation.Stop ?
      escape(state, action) :
    action instanceof Focusable.Focus ?
      showWebViewByIndex(state, n) :
    action instanceof Focusable.Focused ?
      showWebViewByIndex(state, n) :
    action instanceof WebView.Close ?
      closeWebViewByIndex(state, n) :
      state.set('webViews', WebView.updateByIndex(state.webViews, n, action));

  const updateByWebViewID = (state, id, action) =>
    updateByWebViewIndex(state, WebView.indexByID(state.webViews, id), action);

  const updateBySelectedWebView = (state, action) =>
    updateByWebViewIndex(state, state.webViews.selected, action);

  const updateWebViews = (state, action) =>
    state.set('webViews', WebView.update(state.webViews, action));

  const updateSuggestions = (state, action) =>
    state.set('suggestions', Suggestions.update(state.suggestions, action));

  const updateByInputAction = (state, action) =>
    action.action instanceof Input.Submit ?
      submit(state, action.action.value) :
    action.action instanceof Focusable.Focus ?
      editSelectedWebView(state) :
    action.action instanceof Focusable.Focused ?
      editSelectedWebView(state) :
      state.set('input', Input.update(state.input, action));

  const updateDevtoolsHUD = (state, action) =>
    state.set('devtoolsHUD', DevtoolsHUD.update(state.devtoolsHUD, action));

  const fadeToShowModeFromSelectMode = state =>
    state.webViews.selected == null ? state :
    state.mode === 'select-web-view' ? fadeToShowMode(state) :
    state;

  const activateSelectedWebView = state =>
    state.update('webViews', WebView.activate);

  const completeSelection = compose(
    fadeToShowModeFromSelectMode,
    activateSelectedWebView);

  const unknownAction = (state, action) => {
    console.warn("Unknown action was received & ignored:", action + '')
    return state
  }

  const escape = state =>
    // If we're already showing a webview, or we can't show a webview because
    // none exist yet, do nothing. Otherwise, fade to the selected web view.
    state.mode === 'show-web-view' ?
      state :
    state.webViews.selected === null ?
      state :
    fadeToShowMode(state);

  const updateWindowShell = (state, action) =>
    state.set('shell', WindowShell.update(state.shell, action));

  const update = (state, action) =>
    // Location bar actions
    action instanceof Input.Action ?
      updateByInputAction(state, action) :

    // SynthesisUI specific actions.
    action instanceof Preview.Create ?
      createWebView(state, 'zoom') :
    action instanceof OpenNew ?
      createWebView(state, 'fade') :

    // WebView actions handled specially.
    action instanceof WebView.ByID ?
      updateByWebViewID(state, action.id, action.action) :
    action instanceof WebView.BySelected ?
      updateBySelectedWebView(state, action.action) :
    // WebView actions handled by default
    action instanceof WebView.Select ?
      updateWebViews(state, action) :
    action instanceof WebView.Preview ?
      updateWebViews(state, action) :
    action instanceof WebView.Open ?
      updateWebViews(state, action) :
    action instanceof WebView.OpenInBackground ?
      updateWebViews(state, action) :

    // WebView gesture actions
    action instanceof Gesture.Pinch ?
      zoomEditSelectedWebView(state) :
    action instanceof ShowSelected ?
      completeSelection(state) :
    action instanceof ShowPreview ?
      showPreview(state) :

    // Session actions
    action instanceof Session.SaveSession ?
      Session.update(state, action) :
    action instanceof Session.ResetSession ?
      Session.update(state, action) :
    action instanceof Session.RestoreSession ?
      Session.update(state, action) :

    // Devtools HUD
    action instanceof DevtoolsHUD.ToggleDevtoolsHUD ?
      updateDevtoolsHUD(state, action) :
    action instanceof DevtoolsHUD.Fetched ?
      updateDevtoolsHUD(state, action) :
    action instanceof DevtoolsHUD.Changed ?
      updateDevtoolsHUD(state, action) :

    // Suggestions
    action instanceof Suggestions.SelectRelative ?
      updateSuggestions(state, action) :
    action instanceof Suggestions.SelectNext ?
      updateSuggestions(state, action) :
    action instanceof Suggestions.SelectPrevious ?
      updateSuggestions(state, action) :
    action instanceof Suggestions.Unselect ?
      updateSuggestions(state, action) :
    action instanceof Suggestions.Clear ?
      updateSuggestions(state, action) :
    action instanceof Suggestions.SearchResult ?
      updateSuggestions(state, action) :
    action instanceof Suggestions.PageResult ?
      updateSuggestions(state, action) :

    // Window shell actions
    action instanceof Pointer.Out ?
      updateWindowShell(state, action) :
    action instanceof Pointer.Over ?
      updateWindowShell(state, action) :
    action instanceof Focusable.Focused ?
      updateWindowShell(state, action) :
    action instanceof Focusable.Blured ?
      updateWindowShell(state, action) :

    // Unknown
    unknownAction(state, action);
  exports.update = update;


  const service = address => {
    let id = -1;
    const showPreview = forward(address, ShowPreview)

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
