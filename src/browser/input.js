/* @flow */

import {html, forward, Effects} from 'reflex';
import {on, focus, selection} from 'driver';
import {identity} from '../lang/functional';
import {always} from '../common/prelude';
import * as Focusable from '../common/focusable';
import * as Editable from '../common/editable';
import * as Keyboard from '../common/keyboard';
import {Style, StyleSheet} from '../common/style';

/*:: import * as type from "../../type/browser/input" */

export const initial/*:type.Model*/ = {
  value: "",
  isFocused: false,
  selection: null
};

// Create a new input submit action.
export const Submit/*:type.Submit*/ = {
  type: 'Input.Submit'
};

export const Abort/*:type.Abort*/ = {
  type: 'Input.Abort'
};

export const Enter/*:type.Enter*/ = {
  type: 'Input.Enter'
};

export const asEditSelection/*:type.asEditSelection*/ = text =>
  ({type: 'Input.EditSelection', text});

export const update/*:type.update*/ = (model, action) =>
  action.type === 'Keyboard.Command' && action.action.type === 'Focusable.Blur' ?
    Focusable.update(model, action.action) :
  action.type === 'Keyboard.Command' && action.action.type === 'Input.Submit' ?
    Editable.clear(model) :
  action.type === 'Input.Abort' ?
    Focusable.update(model, Focusable.Blur) :
  action.type === 'Input.Enter' ?
    Editable.clear(Focusable.focus(model)) :
  action.type === 'Input.EditSelection' ?
    Editable.change(Focusable.focus(model), {
      value: action.text,
      selection: {start: 0, end: action.text.length, direction: 'forward'}
    }) :
  action.type === "Focusable.Blur" ?
    Focusable.update(model, action) :
  action.type === "Focusable.Focus" ?
    Focusable.update(model, action) :
  action.type === "Focusable.FocusRequest" ?
    Focusable.update(model, action) :
  action.type === "Editable.Clear" ?
    Editable.update(model, action) :
  action.type === "Editable.Select" ?
    Editable.update(model, action) :
  action.type === "Editable.Change" ?
    Editable.update(model, action) :
    model;

export const step = Effects.nofx(update);

const binding = Keyboard.bindings({
  // 'up': _ => Suggestions.SelectPrevious(),
  // 'control p': _ => Suggestions.SelectPrevious(),
  // 'down': _ => Suggestions.SelectNext(),
  // 'control n': _ => Suggestions.SelectNext(),
  'enter': always(Submit),
  'escape': always(Abort)
});

// Read a selection model from an event target.
// @TODO type signature
const readSelection = target => ({
  start: target.selectionStart,
  end: target.selectionEnd,
  direction: target.selectionDirection
});

// Read change action from a dom event.
// @TODO type signature
const readChange = ({target}) =>
  Editable.asChange(target.value, readSelection(target));

// Read select action from a dom event.
// @TODO type signature
const readSelect = ({target}) =>
  Editable.asSelect(readSelection(target));

const inputWidth = '460px';
const inputHeight = '40px';

const style = StyleSheet.create({
  combobox: {
    background: '#EBEEF2',
    borderRadius: '5px',
    height: inputHeight,
    left: '50%',
    marginLeft: `calc(-1 * (${inputWidth} / 2))`,
    position: 'absolute',
    padding: '0 32px',
    top: '40px',
    width: `calc(${inputWidth} - ${32 * 2}px)`
  },
  field: {
    background: 'transparent',
    borderWidth: 0,
    display: 'block',
    fontSize: '14px',
    MozAppearance: 'none',
    height: inputHeight,
    lineHeight: inputHeight,
    margin: 0,
    padding: 0,
    width: `calc(${inputWidth} - ${32 * 2}px)`
  },
  inactive: {
    opacity: 0,
    pointerEvents: 'none'
  },
  searchIcon: {
    color: 'rgba(0,0,0,0.5)',
    fontFamily: 'FontAwesome',
    fontSize: '16px',
    left: '10px',
    lineHeight: '40px',
    position: 'absolute',
    top: 0
  },
  clearIcon: {
    color: 'rgba(0,0,0,0.5)',
    fontFamily: 'FontAwesome',
    fontSize: '16px',
    right: '10px',
    lineHeight: '40px',
    position: 'absolute'
  },
  clearIconInactive: {
    opacity: 0
  }
});

export const view = (model, address, modeStyle) =>
  html.div({
    className: 'input-combobox',
    style: Style(style.combobox, modeStyle)
  }, [
    html.span({
      className: 'input-search-icon',
      style: style.searchIcon
    }, ['']),
    html.span({
      className: 'input-clear-icon',
      style: Style(
        style.clearIcon,
        model.value === '' && style.clearIconInactive
      ),
      onClick: () => address(Editable.Clear)
    }, ['']),
    html.input({
      className: 'input-field',
      placeholder: 'Search or enter address',
      style: style.field,
      type: 'text',
      value: model.value,
      isFocused: focus(model.isFocused),
      selection: selection(model.selection),
      onInput: on(address, readChange),
      onSelect: on(address, readSelect),
      onFocus: on(address, Focusable.asFocus),
      onBlur: on(address, Focusable.asBlur),
      onKeyDown: on(address, binding),
      // DOM does not fire selection events when you hit arrow
      // keys or when you click in the input field. There for we
      // need to handle those events to keep our model in sync with
      // actul input field state.

      // @HACK In servo input event does not seem to fire as expected
      // so we use onKeyUp instead here.
      onKeyUp: on(address, readChange),
      onMouseOut: on(address, readSelect)
    })
  ]);
