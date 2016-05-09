/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, forward, Effects} from 'reflex';
import {on, focus, selection} from '@driver';
import {identity} from '../lang/functional';
import {always, merge} from '../common/prelude';
import {cursor} from "../common/cursor";
import {compose, debounce} from '../lang/functional';
import * as Focusable from '../common/focusable';
import * as Editable from '../common/editable';
import * as Keyboard from '../common/keyboard';
import * as Unknown from '../common/unknown';
import * as Style from '../common/style';


/*::
import type {Address, DOM} from "reflex"
import type {Suggestion, Model, Action} from "./input"
*/

// Create a new input submit action.
export const Query/*:()=>Action*/ = always({ type: 'Query' });
export const Suggest =
  (suggestion/*:Suggestion*/)/*:Action*/ =>
  ( { type: "Suggest"
    , source: suggestion
    }
  );

export const SuggestNext/*:Action*/ = { type: 'SuggestNext' };
export const SuggestPrevious/*:Action*/ = { type: 'SuggestPrevious' };
export const Submit/*:Action*/ = {type: 'Submit'};
export const Abort/*:Action*/ = {type: 'Abort'};
export const Enter/*:Action*/ = {type: 'Enter'};
export const Focus/*:Action*/ = {type: 'Focus', source: Focusable.Focus };
export const Blur/*:Action*/ = {type: 'Blur', source: Focusable.Blur };
export const Show/*:Action*/ = {type: 'Show'};
export const Hide/*:Action*/ = {type: 'Hide'};
export const EnterSelection =
  (value/*:string*/)/*:Action*/ =>
  ( { type: 'EnterSelection'
    , value
    }
  );

const FocusableAction = action =>
  ( action.type === 'Focus'
  ? Focus
  : action.type === 'Blur'
  ? Blur
  : { type: 'Focusable'
    , source: action
    }
  );

const EditableAction =
  (action) =>
  ( { type: 'Editable'
    , source: action
    }
  );

const Clear/*:Action*/ = EditableAction(Editable.Clear);

const updateFocusable = cursor({
  tag: FocusableAction,
  update: Focusable.update
});

const updateEditable = cursor({
  tag: EditableAction,
  update: Editable.update
});

const enter = (model) => {
  const [next, focusFx] = updateFocusable(model, Focusable.Focus);
  const [result, editFx] = updateEditable(next, Editable.Clear);
  return [result, Effects.batch([focusFx, editFx])];
}

const enterSelection = (model, value) =>
  enterSelectionRange(model, value, 0, value.length);

const enterSelectionRange = (model, value, start, end) => {
  const [next, focusFx] = updateFocusable(model, Focusable.Focus);
  const [result, editFx] = updateEditable(next, Editable.Change(value, {
    start, end, direction: 'forward'
  }));


  return [result, Effects.batch([focusFx, editFx])];
}

export const init =
  ( isVisible/*:boolean*/=false
  , isFocused/*:boolean*/=false
  , value/*:string*/=''
  )/*:[Model, Effects<Action>]*/ =>
  [ ( { value
      , isFocused
      , isVisible
      , selection: null
      }
    )
  , Effects.none
  ];

const suggest = (model, {query, match, hint}) =>
  enterSelectionRange
  ( model
  , match
  , ( match.toLowerCase().startsWith(query.toLowerCase())
    ? query.length
    : match.length
    )
  , match.length
  )

export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ =>
  ( action.type === 'Abort'
  ? updateFocusable(model, Focusable.Blur)
  // We don't really do anything on submit action for now
  // although in a future we may clear the value or do blur
  // the input.
  : action.type === 'Submit'
  ? [model, Effects.none]
  : action.type === 'Enter'
  ? enter(merge(model, {isVisible: true}))
  : action.type === 'Focus'
  ? updateFocusable
    ( merge(model, {isFocused: true, isVisible: true})
    , action.source
    )
  : action.type === 'Blur'
  ? updateFocusable(model, action.source)

  : action.type === 'EnterSelection'
  ? enterSelection(merge(model, {isVisible: true}), action.value)
  : action.type === 'Focusable'
  ? updateFocusable(model, action.source)
  : action.type === 'Editable'
  ? updateEditable(model, action.source)
  : action.type === 'Change'
  ? updateEditable(model, Editable.Change(action.value, action.selection))
  : action.type === 'Show'
  ? [merge(model, {isVisible: true}), Effects.none]
  : action.type === 'Hide'
  ? [merge(model, {isVisible: false}), Effects.none]
  : action.type === 'SuggestNext'
  ? [model, Effects.none]
  : action.type === 'SuggestPrevious'
  ? [model, Effects.none]
  : action.type === 'Suggest'
  ? suggest(model, action.source)
  : Unknown.update(model, action)
  );


const decodeKeyDown = Keyboard.bindings({
  'up': always(SuggestPrevious),
  'control p': always(SuggestPrevious),
  'down': always(SuggestNext),
  'control n': always(SuggestNext),
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
const readChange =
  ({target}) =>
  ( { type: "Change"
    , value: target.value
    , selection: readSelection(target)
    }
  );

// Read select action from a dom event.
// @TODO type signature
const readSelect = compose
  ( EditableAction
  , ({target}) =>
      Editable.Select(readSelection(target))
  );

const inputWidth = 480;
const inputHeight = 40;
const inputXPadding = 32;

const style = Style.createSheet({
  combobox: {
    height: inputHeight,
    left: '50%',
    marginLeft: `${-1 * (inputWidth / 2)}px`,
    position: 'absolute',
    top: '40px',
    width: `${inputWidth}px`
  },
  field: {
    backgroundColor: '#EBEEF2',
    borderRadius: '5px',
    borderWidth: '3px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    display: 'block',
    fontSize: '14px',
    MozAppearance: 'none',
    height: `${inputHeight - 6}px`,
    lineHeight: `${inputHeight - 6}px`,
    margin: 0,
    padding: `0 ${inputXPadding}px`,
    width: `${(inputWidth - 6) - (inputXPadding * 2)}px`
  },
  fieldFocused: {
    backgroundColor: '#fff',
    borderColor: '#3D91F2'
  },
  fieldBlured: {

  },
  fieldEmpty: {
    // Temporary fix until Servo has a better placeholder style:
    // https://github.com/servo/servo/issues/10561
    color: '#A9A9A9',
  },
  fieldNotEmpty: {

  },
  inactive: {
    opacity: 0,
    pointerEvents: 'none'
  },
  searchIcon: {
    color: 'rgba(0,0,0,0.7)',
    fontFamily: 'FontAwesome',
    fontSize: '16px',
    left: '13px',
    lineHeight: '40px',
    position: 'absolute',
    top: 0
  },
  hidden: {
    opacity: 0,
    pointerEvents: 'none'
  },
  visible: {

  }
});


export const view =
  (model/*:Model*/, address/*:Address<Action>*/)/*:DOM*/ =>
  html.div({
    className: 'input-combobox',
    style: Style.mix
    ( style.combobox
    , ( model.isVisible
      ? style.visible
      : style.hidden
      )
    ),
    // Note we submit new query only on `onInput` that's when we expect
    onInput: forward(address, Query)
  }, [
    html.span({
      className: 'input-search-icon',
      style: style.searchIcon
    }, ['']),
    html.input({
      className: 'input-field',
      placeholder: 'Search or enter address',
      style: Style.mix
        ( style.field
        , ( model.isFocused
          ? style.fieldFocused
          : style.fieldBlured
          )
        , ( model.value.length == 0
          ? style.fieldEmpty
          : style.fieldNotEmpty
          )
        ),
      type: 'text',
      value: model.value,
      isFocused: focus(model.isFocused),
      selection: selection(model.selection),
      onInput: on(address, readChange),
      onSelect: on(address, readSelect),
      onFocus: on(address, always(Focus)),
      onBlur: on(address, always(Blur)),
      onKeyDown: on(address, decodeKeyDown)
    })
  ]);
