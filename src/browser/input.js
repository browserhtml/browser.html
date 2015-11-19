/* @flow */

import {html, forward, Effects} from 'reflex';
import {on, focus, selection} from 'driver';
import * as PerspectiveUI from './perspective-ui';
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
}

// Create a new input submit action.
export const Submit/*:type.asSubmit*/ = {
  type: 'Input.Submit'
}

export const update/*:type.update*/ = (model, action) =>
  action.type === 'Keyboard.Command' && action.action.type === 'Focusable.Blur' ?
    Focusable.update(model, action.action) :
  action.type === 'Keyboard.Command' && action.action.type === 'Input.Submit' ?
    Editable.clear(model) :
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
  'escape': always(Focusable.Blur)
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

const inputWidth = 460;

const style = StyleSheet.create({
  combobox: {
    background: '#EBEEF2',
    borderRadius: '5px',
    height: '40px',
    left: '50%',
    marginLeft: (-1 * (inputWidth / 2)) + 'px',
    position: 'absolute',
    padding: '0 32px',
    top: '40px',
    width: (inputWidth - (32 * 2)) + 'px',
  },

  field: {
    background: 'transparent',
    borderWidth: 0,
    fontSize: '14px',
    mozAppearance: 'none',
    height: '100%',
    padding: 0,
    width: '100%'
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
    position: 'absolute'
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

const isInputActive = (mode) =>
  mode === PerspectiveUI.CreateWebView || mode === PerspectiveUI.EditWebView;

const ViewMode = (modeStyle) => (model, address) =>
  html.div({
    className: 'input-combobox',
    style: modeStyle
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
      )
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
    })
  ]);

const viewAsActive = ViewMode(style.combobox);
const viewAsInactive = ViewMode(Style(style.combobox, style.inactive));

// Export modal views
export const viewAsEditWebView = viewAsActive;
export const viewAsCreateWebView = viewAsActive;
export const viewAsShowWebView = viewAsInactive;
export const viewAsSelectWebView = viewAsInactive;
export const viewAsShowTabs = viewAsInactive;
