/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

// Models and actions for representing touch and mouse pointers.

const {Record, Union} = require('typed-immutable');

const Model = Record({
  isHovering: Boolean
});
exports.Model = Model;

// Action

const Over = Record({
  description: 'Pointer is being hovered over element'
}, 'Pointer.Over');
exports.Over = Over;

const Out = Record({
  description: 'Pointer stopped hovering over element'
}, 'Pointer.Out');
exports.Out = Out;

const Action = Union(Over, Out);
exports.Action = Action;

// Update

const over = state => state.set('isHovering', true);
exports.over = over;

const out = state => state.set('isHovering', false);
exports.out = out;

const update = (state, action) =>
  action instanceof Over ? over(state) :
  action instanceof Out ? out(state) :
  state;
exports.update = update;
