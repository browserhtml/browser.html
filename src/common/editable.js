/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {isFocused, focus, blur} = require('./focusable');
  const {Element, BeforeAppendAttribute, VirtualAttribute, Event} = require('./element');
  const {Component, createFactory} = require('react');
  const {Record} = require('typed-immutable/index');

  // Model

  const Editable = Record({
    isFocused: Boolean(false),
    selectionStart: Number(0),
    selectionEnd: Number(0),
    selectionDirection: String('forward'),
    value: String('')
  });

  // Actions

  Editable.select = (range={}) => editable => editable.merge({
    selectionStart: range.selectionStart,
    selectionEnd: range.selectionEnd,
    selectionDirection: range.selectionDirection
  });

  Editable.selectAll = Editable.select({selectionStart:0,
                                        selectionEnd: Infinity});

  Editable.focus = focus;
  Editable.blur = blur;

  // View

  const updateSelection = field => (node, current, past) => {
    if (current != past) {
      node[field] = current === Infinity ? node.value.length : current
    }
  };

  const InputElement = Element('input', {
    isFocused,
    selectionStart: VirtualAttribute(updateSelection('selectionStart')),
    selectionEnd: VirtualAttribute(updateSelection('selectionEnd')),
    selectionDirection: VirtualAttribute((node, current, past) => {
      if (current !== past) {
        node.selectionDirection = current
      }
    }),
  });

  class InputField extends Component {
    constructor() {
      this.onKeyDown = this.onKeyDown.bind(this);
    }
    onKeyDown(event) {
      if (this.props.onKeyDown) {
        this.props.onKeyDown(event);
      }
      if (event.key == this.props.submitKey) {
        this.props.onSubmit(event);
      }
    }
    render() {
      return InputElement(Object.assign({}, this.props, {onKeyDown: this.onKeyDown}));
    }
  };

  Editable.renderInput = InputElement
  Editable.renderField = createFactory(InputField)

  // Exports:

  exports.Editable = Editable;
});
