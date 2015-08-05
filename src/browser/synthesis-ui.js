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

  // Action

  const Select = Record({
    description: 'Complete web-view selection'
  }, 'SynthesisUI.Select');
  exports.Select = Select;

  const Escape = Record({
    description: 'Escape'
  }, 'SynthesisUI.Escape');
  exports.Escape = Escape;

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



  const selectViewByID = (state, id) =>
    state.set('webViews', WebView.selectByID(state.webViews, id));

  const showWebViewByID = compose(
    switchMode('show-web-view', 'zoom'),
    selectViewByID
  );

  const fadeToWebViewByID = compose(
    fadeToShowMode,
    selectViewByID
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

  const setInputToURIByID = (state, id) => {
    const index = WebView.indexByID(state.webViews, id);
    return state.setIn(['input', 'value'],
                       state.getIn(['webViews', 'loader', index, 'uri']));
  };

  const clearSuggestions = edit('suggestions', Suggestions.clear);

  const editWebViewByID = compose(
    state => state.mode === 'edit-web-view' ? state :
             state.mode === 'create-web-view' ? state :
             fadeToEditMode(state),
    selectInput,
    focusInput,
    clearSuggestions,
    (state, id) =>
      state.mode === 'edit-web-view' ? state :
      state.mode === 'create-web-view' ? state :
      setInputToURIByID(state, id));

  const selectByOffset = offset => state =>
    state.set('webViews', WebView.selectByOffset(state.webViews, offset));

  const selectNext = compose(
    fadeToSelectMode,
    blurInput,
    selectByOffset(1));

  const selectPrevious = compose(
    fadeToSelectMode,
    blurInput,
    selectByOffset(-1));

  const closeWebViewByID = compose(
    switchMode('edit-web-view', null),
    selectInput,
    focusInput,
    (state) => setInputToURIByID(state, '@selected'),
    (state, id) =>
      state.set('webViews', WebView.closeByID(state.webViews, id)));

  const navigate = (state, value) => {
    const uri = URI.read(value);
    const webViews = state.mode === 'edit-web-view' ?
      WebView.load(state.webViews, {uri}) :
      WebView.open(state.webViews, {uri});

    return state.set('webViews', webViews);
  };

  const submit = compose(
    fadeToShowMode,
    clearSuggestions,
    clearInput,
    navigate);

  const showPreview = compose(
    state =>
      state.mode != 'show-web-view' ? state :
      zoomToEditMode(state),
    selectInput,
    focusInput,
    clearSuggestions,
    state =>
      setInputToURIByID(state, '@selected'));


  const updateByWebViewAction = (state, id, action) =>
    action instanceof Focusable.Focus ?
      showWebViewByID(state, id) :
    action instanceof Focusable.Focused ?
      showWebViewByID(state, id) :
    action instanceof WebView.Close ?
      closeWebViewByID(state, id) :
    (action instanceof WebView.Open && !action.uri) ?
      createWebView(state, 'zoom') :
    action instanceof WebView.FadeToOpen ?
      createWebView(state, 'fade') :
    action instanceof WebView.SelectNext ?
      selectNext(state) :
    action instanceof WebView.SelectPrevious ?
      selectPrevious(state) :
    state;

  const updateByInputAction = (state, action) =>
    action instanceof Input.Submit ? submit(state, action.value) :
    action instanceof Focusable.Focus ? editWebViewByID(state, null) :
    action instanceof Focusable.Focused ? editWebViewByID(state, null) :
    state;

  const completeSelection = state =>
    state.mode === 'select-web-view' ? fadeToShowMode(state) :
    state;

  const escape = state =>
    // If we're already showing a webview, or we can't show a webview because
    // none exist yet, do nothing. Otherwise, fade to the selected web view.
    state.mode === 'show-web-view' || state.webViews.selected === null ? state :
    fadeToWebViewByID(state);

  const update = (state, action) =>
    action instanceof Navigation.Stop ?
      escape(state) :
    action instanceof WebView.Action ?
      updateByWebViewAction(state, action.id, action.action) :
    action instanceof WebView.Open ?
      updateByWebViewAction(state, null, action) :
    action instanceof WebView.FadeToOpen ?
      updateByWebViewAction(state, null, action) :
    action instanceof WebView.Close ?
      updateByWebViewAction(state, null, action) :
    action instanceof WebView.SelectNext ?
      updateByWebViewAction(state, null, action) :
    action instanceof WebView.SelectPrevious ?
      updateByWebViewAction(state, null, action) :
    action instanceof Input.Action ?
      updateByInputAction(state, action.action) :
    action instanceof Input.Submit ?
      updateByInputAction(state, action) :
    action instanceof Gesture.Pinch ?
      showPreview(state) :
    action instanceof Select ?
      completeSelection(state) :
    state;

  exports.update = update;
