/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const {Record, Union, Maybe} = require('typed-immutable');
  const Focusable = require('./focusable');

  // Model

  const Selection = Record({
    start: 0,
    end: 0,
    direction: 'forward'
  }, 'Editable.Selection');
  exports.Selection = Selection;

  const Model = Record({
    isFocused: false,
    value: Maybe(String),
    selection: Selection
  }, 'Editable.Model');
  exports.Model = Model;

  // Actions

  const Select = Record({
    range: Selection
  }, 'Editable.Select');
  Select.All = () => Select({end: Infinity});
  exports.Select = Select;


  const Change = Record({
    description: 'Input value / selection has changed',
    value: String,
    selection: Selection
  }, 'Editable.Change');
  exports.Change = Change;

  const Action = Union(Change, Select);
  exports.Action = Action;

  // Update

  const select = (state, range) =>
    state.set('selection', Selection(range));
  exports.select = select;

  const selectAll = state =>
    state.set('selection', Selection({end: Infinity, direction: 'backward'}));
  exports.selectAll = selectAll;

  const change = (state, action) =>
    state.merge({value: action.value,
                 selection: action.selection});
  exports.change = change;

  const clear = state =>
    state.remove('value');
  exports.clear = clear;

  const update = (state, action) =>
    action instanceof Change ? change(state, action) :
    action instanceof Select ? select(state, action.range) :
    action;

  exports.update = update;
