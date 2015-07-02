/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Union, List, Maybe, Any} = require('common/typed');
  const Editable = require('common/editable');
  const Focusable = require('common/focusable');

  // Model
  exports.Model = Editable.Model;


  // Action

  const Enter = Record({
    id: '@selected',
    value: Maybe(String)
  }, 'WebView.Input.Enter');

  const Focus = Record({
    id: '@selected',
  }, 'WebView.Input.Focus');

  const Blur = Record({
    id: '@selected'
  }, 'WebView.Input.Blur');

  const Focused = Record({
    id: '@selected',
  }, 'WebView.Input.Focused');

  const Blured = Record({
    id: '@selected'
  }, 'WebView.Input.Blured');

  const Hover = Record({
    id: '@selected'
  }, 'WebView.Input.Hover');

  const Change = Record({
    id: '@selected',
    value: String
  }, 'WebView.Input.Change');

  const Edit = Record({
    id: '@selected',
    action: Editable.Action
  }, 'WebView.Input.Edit');

  const Submit = Record({
    id: '@selected',
  }, 'WebView.Input.Sumbmit');


  const Action = Union({Enter, Focused, Blured,
                        Focus, Blur, Edit, Change, Submit});
  exports.Action = Action;

  // Update

  const {focus, blur} = Focusable;
  const {selectAll} = Editable;

  const update = (state, action) =>
    action instanceof Focus ? Focusable.focus(state) :
    action instanceof Blur ? Focusable.blur(state) :
    action instanceof Focused ? Focusable.focus(state) :
    action instanceof Blured ? Focusable.blur(state) :
    action instanceof Change ? Editable.change(state, action) :
    action instanceof Enter ? Editable.selectAll(focus(state.set('value', action.value))) :
    action instanceof Edit ? Editable.update(state, action.action) :
    action instanceof Submit ? state.remove('value') :
    state;

  exports.update = update;

});
