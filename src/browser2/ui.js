/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Any, Union} = require('common/typed');
  const {compose} = require('lang/functional');
  const WebView = require('browser/web-view');
  const Input = require('browser/web-input');
  const Shell = require('browser/web-input');
  const Gesture = require('service/gesture');
  const URI = require('common/url-helper');
  const Focusable = require('common/focusable');
  const Editable = require('common/editable');
  const Navigation = require('service/navigation');

  // Update

  const edit = (field, update) =>
    state => state.update(field, update);

  const focusInput = edit('input', Focusable.focus);
  const selectInput = edit('input', Editable.selectAll);
  const blurInput = edit('input', Focusable.blur);
  const clearInput = edit('input', Editable.clear);

  const focusShell = edit('shell', Focusable.focus);
  const blurShell = edit('shell', Focusable.blur);

  const selectViewByID = (state, id) =>
    state.set('webViews', WebView.selectByID(state.webViews, id));

  const createEmptyWebView = compose(
    focusInput,
    state => state.set('webViews', WebView.open(state.webViews, {})),
    state => state.setIn(['input', 'value'], null));

  const createWebView = (state, action) =>
    state.set('webViews', WebView.open(state.webViews, action))
         .setIn(['input', 'value'], null);

  const setInputToURIByID = (state, id) => {
    const index = WebView.indexByID(state.webViews, id);
    return state.setIn(['input', 'value'],
                       state.getIn(['webViews', 'loader', index, 'uri']));
  };

  const editWebViewByID = compose(
    selectInput,
    focusInput,
    (state, id) => setInputToURIByID(state, id));

  const selectByOffset = offset => state =>
    state.set('webViews', WebView.selectByOffset(state.webViews, offset));

  const selectNext = compose(
    blurInput,
    selectByOffset(1));

  const selectPrevious = compose(
    blurInput,
    selectByOffset(-1));

  const closeWebViewByID = compose(
    (state, id) =>
      state.set('webViews', WebView.closeByID(state.webViews, id)));

  const navigate = (state, value) => {
    const uri = URI.read(value);
    return state.set('webViews', WebView.load(state.webViews, {uri}));
  };

  const submit = compose(clearInput, navigate);


  const updateByWebViewAction = (state, id, action) =>
    action instanceof Focusable.Focus ? selectViewByID(state, id) :
    action instanceof Focusable.Focused ? selectViewByID(state, id) :
    action instanceof WebView.Close ? closeWebViewByID(state, id) :
    (action instanceof WebView.Open && action.uri) ? createWebView(state, action) :
    (action instanceof WebView.Open && !action.uri) ? createEmptyWebView(state) :
    action instanceof WebView.SelectNext ? selectNext(state) :
    action instanceof WebView.SelectPrevious ? selectPrevious(state) :
    state;

  const updateByInputAction = (state, action) =>
    action instanceof Input.Submit ? submit(state, action.value) :
    action instanceof Focusable.Focus ? editWebViewByID(state, null) :
    action instanceof Focusable.Focused ? editWebViewByID(state, null) :
    state;

  const update = (state, action) => {
    return action instanceof WebView.Action ?
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
    action instanceof Focusable.Focused ?
      focusShell(state, action) :
    action instanceof Focusable.Blured ?
      blurShell(state, action) :
    state;
  }

  exports.update = update;
});
