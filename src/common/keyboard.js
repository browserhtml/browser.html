/* this source code form is subject to the terms of the mozilla public
 * license, v. 2.0. if a copy of the mpl was not distributed with this
 * file, you can obtain one at http://mozilla.org/mpl/2.0/. */

define((require, exports, module) => {

  'use strict';

  const platform = require('common/os').platform();
  const {Record, Any} = require('common/typed');

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

  class KeyBinding {
    constructor({chord, metaKey, shiftKey, altKey, ctrlKey, key, action}) {
      this.chord = chord
      this.key = key
      this.metaKey = metaKey
      this.shiftKey = shiftKey
      this.altKey = altKey
      this.ctrlKey = ctrlKey
      this.action = action
    }
    toJSON() {
      const {chord, key, metaKey, shiftKey, altKey, ctrlKey} = this;
      return {chord, key, metaKey, shiftKey, altKey, ctrlKey};
    }
    toString() {
      return `KeyBinding(${JSON.stringify(this)})`
    }
  }

  class KeyboardAction {
    constructor(options) {
      this.label = options.label || 'Keyboard.Action'

      this.chord = options.chord
      this.key = options.key

      this.metaKey = options.metaKey
      this.shiftKey = options.shiftKey
      this.altKey = options.altKey
      this.ctrlKey = options.ctrlKey
      this.action = options.action || null
    }
    toJSON() {
      const {action, chord, key, metaKey, shiftKey, altKey, ctrlKey} = this;
      return {action, chord, key, metaKey, shiftKey, altKey, ctrlKey};
    }
    toString() {
      return `${this.label}(${JSON.stringify(this)})`
    }
  };

  const KeyBindings = (bindingTable, label) => {
    const bindings = Object.create(null);
    Object.keys(bindingTable).forEach(key => {
      bindings[readChord(key)] = bindingTable[key];
    });

    const Binding = (...args) => {
      const event = args[args.length - 1];
      const chord = writeChord(event);
      const read = bindings[chord] ||
                   bindings[`${event.type}: ${chord}`];

      if (read) {
        event.preventDefault();
        event.stopPropagation();
        return new KeyboardAction({
          action: read(...args),
          chord, label,

          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
          ctrlKey: event.ctrlKey,
          key: event.key
        });
      }

      return null;
    };
    Binding.Action = KeyboardAction;

    return Binding;
  }
  KeyBindings.Stop = read => {
    event.stopPropagation();
    return read(event);
  }
  KeyBindings.Cancel = read => {
    event.preventDefault();
    return read(event);
  }
  KeyBindings.Abort = read => {
    event.preventDefault();
    event.stopPropagation();
    return read(event);
  }

  const service = address => action => {
    if (action instanceof KeyboardAction) {
      address.receive(action.action);
    }
  }
  exports.service = service;

  // Exports:

  exports.readModifiers = readModifiers;
  exports.readKey = readKey;
  exports.readChord = readChord;
  exports.writeChord = writeChord;
  exports.KeyBindings = KeyBindings;

});
