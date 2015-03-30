/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {isFocused} = require('./focusable');
  const {Element, BeforeAppendAttribute, VirtualAttribute, Event} = require('./element');
  const {Component, createFactory} = require('react');

  const selection = VirtualAttribute((node, current, past) => {
    past = past || {};
    if (current !== past) {
      if (current) {
        const {start, end, direction} = current;

        if (start !== past.start) {
          node.selectionStart = start === Infinity ? node.value.length : start;
        }

        if (end !== past.end) {
          node.selectionEnd = end === Infinity ? node.value.length : end;
        }

        if (direction !== past.direction) {
          node.selectionDirection = direction;
        }
      }
    }
  });

  const InputElement = Element('input', {
    isFocused: isFocused,
    selection: selection
  });

  const InputField = function(immutableState) {
    this.onKeyDown = this.onKeyDown.bind(this);
    Component.call(this);
  }

  InputField.prototype = {
    __proto__: Component.prototype,
    constructor: InputField,
    onKeyDown(event) {
      if (this.props.onKeyDown) {
        this.props.onKeyDown(event);
      }
      if (event.key == this.props.submitKey) {
        this.props.onSubmit(event);
      }
    },
    render() {
      return InputElement(Object.assign({}, this.props, {onKeyDown: this.onKeyDown}));
    }
  };

  // Exports:

  exports.selection = selection;
  exports.InputField = createFactory(InputField);

  exports.select = (start=0, end=Infinity, direction='forward') => input =>
    input.set('selection', {start, end, direction});

});
