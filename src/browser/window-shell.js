const {Record} = require('typed-immutable');
const Focusable = require('../common/focusable');
const Pointer = require('../common/pointer');

// Model

const Model = Record({
  // Keeps track of window focus
  isFocused: Boolean,
  // Keeps track of window controls hover state
  controls: Pointer.Model,
});
exports.Model = Model;

// Update

const initialize = (isFocused) => Model({
  isFocused: isFocused,
  controls: Pointer.Model({isHovering: false})
});
exports.initialize = initialize;

const update = (state, action) =>
  action instanceof Pointer.Out ?
    state.set('controls', Pointer.update(state.controls, action)) :
  action instanceof Pointer.Over ?
    state.set('controls', Pointer.update(state.controls, action)) :
  action instanceof Focusable.Focused ?
    Focusable.focus(state) :
  action instanceof Focusable.Blured ?
    Focusable.blur(state) :
  state;
exports.update = update;
