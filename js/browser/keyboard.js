/* this source code form is subject to the terms of the mozilla public
 * license, v. 2.0. if a copy of the mpl was not distributed with this
 * file, you can obtain one at http://mozilla.org/mpl/2.0/. */

define((require, exports, module) => {

'use strict';

const os = navigator.platform.startsWith('Win') ? 'windows' :
           navigator.platform.startsWith('Mac') ? 'osx' :
           navigator.platform.startsWith('Linux') ? 'linux' :
           '';

const readModifiers = ({metaKey, shiftKey, altKey, ctrlKey}) => {
  const modifiers = [];
  if (metaKey) {
    modifiers.push("Meta");
  }
  if (ctrlKey) {
    modifiers.push("Control");
  }
  if (altKey) {
    modifiers.push("Alt");
  }
  if (shiftKey) {
    modifiers.push("Shift");
  }
  return modifiers;
};
exports.readModifiers = readModifiers;


const readKey = key => readKey.table[key] || key;
readKey.table = Object.assign(Object.create(null), {
  'ctrl': 'control',
  'accel': os == 'osx' ? 'meta' : 'control',
  'ArrowLeft': 'left',
  'ArrowRight': 'right',
  'ArrowUp': 'up',
  'ArrowDown': 'down',
  'esc': 'escape'
});
exports.readKey = readKey;

const readChord = input =>
  input.trim().
  toLowerCase().
  split(/\s+/).
  map(readKey).
  sort().
  join(" ");
exports.readChord = readChord;

const writeChord = event =>
  [...new Set([...readModifiers(event), readKey(event.key)])].
    join(" ").
    toLowerCase().
    split(" ").
    sort().
    join(" ");
exports.writeChord = writeChord;


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
      }
    }
    return event;
  }
}
exports.KeyBindings = KeyBindings;

});
