/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Union} = require('common/typed');
  const {VirtualAttribute} = require('./element');

  // Model

  const Model = Record({
    isFocused: Boolean
  });
  exports.Model = Model;

  // Action

  const Focus = Record({
    description: 'Request a focus'
  }, 'Focusable.Focus');
  exports.Focus = Focus;

  const Blur = Record({
    description: 'Request a blur'
  }, 'Focusable.Blur');
  exports.Blur = Blur;

  const Focused = Record({
    description: 'Element gained focus'
  }, 'Focusable.Focused');
  exports.Focused = Focused;

  const Blured = Record({
    description: 'Element lost focus'
  }, 'Focusable.Blured');
  exports.Blured = Blured;

  // Update

  const focus = state => state.set('isFocused', true);
  exports.focus = focus;

  const blur = state => state.set('isFocused', false);
  exports.blur = blur;

  const update = (state, action) =>
    action instanceof Focus ? focus(state) :
    action instanceof Focused ? focus(state) :
    action instanceof Blur ? blur(state) :
    action instanceof Blured ? blur(state) :
    state;
  exports.update = update;


  // Fields

  const Field = {
    isFocused: new VirtualAttribute((node, current, past) => {
      if (current != past) {
        if (current) {
          node.focus();
        } else {
          node.blur();
        }
      }
    })
  };
  exports.Field = Field;
});
