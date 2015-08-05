/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const {Record, Union, List, Maybe, Any} = require('../common/typed');
  const Editable = require('../common/editable');
  const Focusable = require('../common/focusable');

  // Model
  exports.Model = Editable.Model;


  // Action

  const {Focus, Blur, Focused, Blured} = Focusable;
  const {Change, Select} = Editable;

  const Submit = Record({
    value: String,
    description: 'Submit input field'
  }, 'WebInput.Submit');
  exports.Submit = Submit;

  const InputAction = Union({
    Focus, Focused, Blur, Blured, Change, Select, Submit
  }, 'InputAction');

  const Action = Record({
    description: 'Action targeted web-input',
    action: InputAction
  }, 'WebInput.Action');
  exports.Action = Action;

  // Update

  const updateByAction = (state, action) =>
    action instanceof Focus ? Focusable.focus(state) :
    action instanceof Blur ? Focusable.blur(state) :
    action instanceof Focused ? Focusable.focus(state) :
    action instanceof Blured ? Focusable.blur(state) :
    action instanceof Change ? Editable.change(state, action) :
    action instanceof Select ? Editable.select(state, action.range) :
    action instanceof Submit ? Editable.clear(state) :
    state;

  const update = (state, action) =>
    action instanceof Action ? updateByAction(state, action.action) :
    state;

  exports.update = update;
