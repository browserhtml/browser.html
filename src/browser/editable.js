/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {isFocused} = require('./focusable');
  const {Element, BeforeAppendAttribute, VirtualAttribute, Event} = require('./element');
  const {Component, createFactory} = require('react');

  const selection = VirtualAttribute((node, current, past) => {
    if (current != past) {
      if (current === true) {
        node.select();
      } else if (current === false) {
        node.selectionStart = node.selectionEnd;
      } else if (current) {
        if ('start' in current) {
          node.selectionStart = current.start;
        }

        if ('end' in current) {
          node.selectionEnd = current.end;
        }

        if (current.direction == 'forward') {
          node.selectionDirection = 'forward';
        }

        if (current.direction == 'backward') {
          node.selectionDirection = 'backward';
        }

        if (current.direction == 'none') {
          node.selectionDirection = 'none';
        }
      }
    }
  });

  const InputElement = Element('input', {
    isFocused: isFocused,
    selection: selection
  });

  const InputVirtualAttribute = function(immutableState) {
    this.onKeyDown = this.onKeyDown.bind(this);
    Component.call(this);
  }

  InputVirtualAttribute.prototype = {
    __proto__: Component.prototype,
    constructor: InputVirtualAttribute,
    onKeyDown(event) {
      if (event.key == this.props.submitKey) {
        this.props.onSubmit(event);
      }
    },
    render() {
      return InputElement(Object.assign({onKeyDown: this.onKeyDown}, this.props));
    }
  };

  // Exports:

  exports.selection = selection;
  exports.InputVirtualAttribute = createFactory(InputVirtualAttribute);

});
