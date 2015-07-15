/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Any, Union} = require('common/typed');
  const {compose} = require('lang/functional');
  const WebView = require('./web-view');
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
  const showWebViewByID = compose(showWebView, selectViewByID);

  const createWebView = compose(
    switchMode('create-web-view'),
    focusInput,
    state => state.mode === 'create-web-view' ? state :
             state.setIn(['input', 'value'], null));

  const setInputToURIByID = (state, id) => {
    const index = WebView.indexByID(state.webViews, id);
    return state.setIn(['input', 'value'],
                       state.getIn(['webViews', 'loader', index, 'uri']));
  };

  const editWebViewByID = compose(
    state => state.mode === 'edit-web-view' ? state :
             state.mode === 'create-web-view' ? state :
             state.set('mode', 'edit-web-view'),
    selectInput,
    focusInput,
    (state, id) =>
      state.mode === 'edit-web-view' ? state :
      state.mode === 'create-web-view' ? state :
      setInputToURIByID(state, id));

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
    switchMode('edit-web-view'),
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
    switchMode('show-web-view'),
    clearSuggestions,
    clearInput,
    navigate);

  const showPreview = compose(
    state =>
      state.mode != 'show-web-view' ? state :
      state.set('mode', 'edit-web-view'),
    state =>
      setInputToURIByID(state, '@selected'));


  const updateByWebViewAction = (state, id, action) =>
    action instanceof Focusable.Focus ? showWebViewByID(state, id) :
    action instanceof Focusable.Focused ? showWebViewByID(state, id) :
    action instanceof WebView.Close ? closeWebViewByID(state, id) :
    (action instanceof WebView.Open && !action.uri) ? createWebView(state) :
    action instanceof WebView.SelectNext ? selectNext(state) :
    action instanceof WebView.SelectPrevious ? selectPrevious(state) :
    state;

  const updateByInputAction = (state, action) =>
    action instanceof Input.Submit ? submit(state, action.value) :
    action instanceof Focusable.Focus ? editWebViewByID(state, null) :
    action instanceof Focusable.Focused ? editWebViewByID(state, null) :
    state;

  const completeSelection = state =>
    state.mode === 'select-web-view' ? state.set('mode', 'show-web-view') :
    state;

  const escape = state =>
    state.mode === 'show-web-view' ? state :
    showWebViewByID(state);

  const update = (state, action) =>
    action instanceof Navigation.Stop ?
      escape(state) :
    action instanceof WebView.Action ?
      updateByWebViewAction(state, action.id, action.action) :
    action instanceof WebView.Open ?
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
});
