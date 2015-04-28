/* this source code form is subject to the terms of the mozilla public
 * license, v. 2.0. if a copy of the mpl was not distributed with this
 * file, you can obtain one at http://mozilla.org/mpl/2.0/. */

define((require, exports, module) => {

  'use strict';

  const platform = require('common/os').platform();

  const readModifiers = ({type, metaKey, shiftKey, altKey, ctrlKey}) => {
    const modifiers = [];
    // Modifier fields indicate if relevant modifier is pressed, in case
    // of 'keyup' event including those does not make sense.
    if (type != 'keyup') {
      if (metaKey) {
        modifiers.push('Meta');
      }
      if (ctrlKey) {
        modifiers.push('Control');
      }
      if (altKey) {
        modifiers.push('Alt');
      }
      if (shiftKey) {
        modifiers.push('Shift');
      }
    }
    return modifiers;
  };


  const readKey = key => readKey.table[key] || key;
  readKey.table = Object.assign(Object.create(null), {
    'ctrl': 'control',
    'accel': platform == 'darwin' ? 'meta' : 'control',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'esc': 'escape'
  });

  const readChord = input =>
    input.trim()
    .toLowerCase()
    .split(/\s+/)
    .map(readKey)
    .sort()
    .join(' ');

  const writeChord = event =>
    [...new Set([...readModifiers(event), readKey(event.key)])]
      .join(' ')
      .toLowerCase()
      .split(' ')
      .sort()
      .join(' ');


  const KeyBindings = (handlers) => {
    const bindings = Object.create(null);
    Object.keys(handlers).forEach(key => {
      bindings[readChord(key)] = handlers[key];
    });

    return (...args) => event => {
      if (event) {
        const chord = writeChord(event);
        const binding = bindings[chord];

        if (binding) {
          binding(...args);
          event.preventDefault();
          event.stopPropagation();
        }
      }
      return event;
    }
  }


  // Exports:

  exports.readModifiers = readModifiers;
  exports.readKey = readKey;
  exports.readChord = readChord;
  exports.writeChord = writeChord;
  exports.KeyBindings = KeyBindings;

});
