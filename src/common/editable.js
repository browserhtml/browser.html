/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Union} = require('common/typed');
  const {Element, VirtualAttribute} = require('./element');
  const Focusable = require('./focusable');

  // Model

  const Selection = Record({
    start: 0,
    end: 0,
    direction: 'forward'
  }, 'Editable.Selection');

  const Model = Record({
    isFocused: false,
    value: '',
    selection: Selection
  }, 'Editable.Model');
  exports.Model = Model;

  // Actions

  const Select = Record({
    range: Selection
  }, 'Editable.Select');
  Select.All = () => Select({end: Infinity});


  const Change = Record({
    value: String
  }, 'Editable.Change');

  const Action = Union({Change, Select});
  exports.Action = Action;

  // Update

  const select = (state, range) =>
    state.set('selection', Selection(range));
  exports.select = select;

  const selectAll = state =>
    state.set('selection', Selection({end: Infinity}));
  exports.selectAll = selectAll;

  const change = (state, action) =>
    state.set('value', action.value);
  exports.change = change;

  const update = (state, action) =>
    action instanceof Change ? change(state, action) :
    action instanceof Select ? select(state, action.range) :
    Focusable.Action.isTypeOf(action) ? Focusable.update(state, action) :
    action;

  exports.update = update;

  // Field

  const Field = {
    selection: VirtualAttribute((node, current, past) => {
      if (current !== past) {
        const {start, end, direction} = current;
        node.setSelectionRange(start === Infinity ? node.value.length : start,
                               end === Infinity ? node.value.length : end,
                               direction);
      }
    })
  };
  exports.Field = Field;

  // View

  const view = Element('input', {
    isFocused: Focusable.Field.isFocused,
    selection: Field.selection
  });
  exports.view = view;
});
