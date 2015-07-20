/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Any, Union} = require('common/typed');
  const {compose} = require('lang/functional');
  const WebView = require('./web-view');
  const Preview = require('./web-preview');
  const Input = require('./web-input');
  const Suggestions = require('./suggestion-box');
  const Gesture = require('service/gesture');
  const URI = require('common/url-helper');
  const Focusable = require('common/focusable');
  const Editable = require('common/editable');
  const Navigation = require('service/navigation');

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

  const switchMode = mode => state =>
    state.set('mode', mode);


  const edit = (field, update) =>
    state => state.update(field, update);

  const focusInput = edit('input', Focusable.focus);
  const selectInput = edit('input', Editable.selectAll);
  const blurInput = edit('input', Focusable.blur);
  const clearInput = edit('input', Editable.clear);



  const selectViewByID = (state, id) =>
    state.set('webViews', WebView.selectByID(state.webViews, id));

  const showWebView = switchMode('show-web-view');
  const showWebViewQuick = switchMode('show-web-view-quick');
  const showWebViewByID = compose(showWebView, selectViewByID);

  const setupCreateWebView = compose(
    focusInput,
    state => state.setIn(['input', 'value'], null)
  );

  const createWebView = compose(
    switchMode('create-web-view'),
    setupCreateWebView
  );

  const createWebViewQuick = compose(
    switchMode('create-web-view-quick'),
    setupCreateWebView
  );

  const setInputToURIByID = (state, id) => {
    const index = WebView.indexByID(state.webViews, id);
    return state.setIn(['input', 'value'],
                       state.getIn(['webViews', 'loader', index, 'uri']));
  };

  // If the UI is in any of these modes, the card dashboard is being displayed.
  const isDashboardMode = (mode) =>
    mode === 'edit-web-view' ||
    mode === 'edit-web-view-quick' ||
    mode === 'create-web-view' ||
    mode === 'create-web-view-quick';

  // Given state and webview ID, set input value to URL of webview and focus
  // the input. Returns state.
  const editInputByID = compose(
    selectInput,
    focusInput,
    (state, id) =>
      isDashboardMode(state.mode) ? state :
      setInputToURIByID(state, id));

  const editWebViewByID = compose(
    state => !isDashboardMode(state.mode) ?
      state.set('mode', 'edit-web-view') :
      state,
    editInputByID);

  const editWebViewByIDQuick = compose(
    state => !isDashboardMode(state.mode) ?
      state.set('mode', 'edit-web-view-quick') :
      state,
    editInputByID);

  const selectByOffset = offset => state =>
    state.set('webViews', WebView.selectByOffset(state.webViews, offset));

  const selectNext = compose(
    switchMode('select-web-view'),
    blurInput,
    selectByOffset(1));

  const selectPrevious = compose(
    switchMode('select-web-view'),
    blurInput,
    selectByOffset(-1));

  const closeWebViewByID = compose(
    switchMode('edit-web-view-quick'),
    selectInput,
    focusInput,
    (state, id) =>
      state.set('webViews', WebView.closeByID(state.webViews, id)));

  const clearSuggestions = edit('suggestions', Suggestions.clear);

  const navigate = (state, value) => {
    const uri = URI.read(value);
    const webViews = state.mode === 'edit-web-view' ?
      WebView.load(state.webViews, {uri}) :
      WebView.open(state.webViews, {uri});

    return state.set('webViews', webViews);
  };

  const submit = compose(
    showWebViewQuick,
    clearSuggestions,
    clearInput,
    navigate
  );

  const showPreview = compose(
    state =>
      state.mode != 'show-web-view' ? state :
      state.set('mode', 'edit-web-view'),
    state =>
      setInputToURIByID(state, '@selected'));


  const updateByWebViewAction = (state, id, source, action) =>
    action instanceof Focusable.Focus ?
      showWebViewByID(state, id) :
    action instanceof Focusable.Focused ?
      showWebViewByID(state, id) :
    action instanceof WebView.Close ?
      closeWebViewByID(state, id) :
    (action instanceof WebView.Open && source === 'keyboard') ?
      createWebViewQuick(state) :
    (action instanceof WebView.Open && !action.uri) ?
      createWebView(state) :
    action instanceof WebView.SelectNext ?
      selectNext(state) :
    action instanceof WebView.SelectPrevious ?
      selectPrevious(state) :
    state;

  const updateByInputAction = (state, source, action) =>
    action instanceof Input.Submit ?
      submit(state, action.value) :
    action instanceof Focusable.Focus && source === 'keyboard' ?
      editWebViewByIDQuick(state, null) :
    action instanceof Focusable.Focus ?
      editWebViewByID(state, null) :
    action instanceof Focusable.Focused ?
      editWebViewByID(state, null) :
    state;

  const completeSelection = state =>
    state.mode === 'select-web-view' ? showWebViewQuick(state) : state;

  const escape = state =>
    state.mode === 'show-web-view' ? state :
    showWebViewByID(state);

  const update = (state, action) => {
    return action instanceof Navigation.Stop ?
      escape(state) :
    action instanceof WebView.Action ?
      updateByWebViewAction(state, action.id, action.source, action.action) :
    action instanceof WebView.Open ?
      updateByWebViewAction(state, null, null, action) :
    action instanceof WebView.Close ?
      updateByWebViewAction(state, null, null, action) :
    action instanceof WebView.SelectNext ?
      updateByWebViewAction(state, null, null, action) :
    action instanceof WebView.SelectPrevious ?
      updateByWebViewAction(state, null, null, action) :
    action instanceof Input.Action ?
      updateByInputAction(state, action.source, action.action) :
    action instanceof Input.Submit ?
      updateByInputAction(state, null, action) :
    action instanceof Gesture.Pinch ?
      showPreview(state) :
    action instanceof Select ?
      completeSelection(state) :
    state;
  }

  exports.update = update;
});
