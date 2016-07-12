/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, forward, Effects} from 'reflex';
import {on, focus as isFocused, selection} from '@driver';
import {identity} from '../../../lang/functional';
import {always, merge, mapFX, appendFX, anotate} from '../../../common/prelude';
import {compose, debounce} from '../../../lang/functional';
import {cursor} from '../../../common/cursor';
import * as Focus from '../../../common/focusable';
import * as Edit from '../../../common/editable';
import * as Keyboard from '../../../common/keyboard';
import * as Unknown from '../../../common/unknown';
import * as Style from '../../../common/style';


import type {Address, DOM} from "reflex"

export type Flags =
  { isVisible?: boolean
  , isFocused?: boolean
  , value: string
  }

export class Model {
  isVisible: boolean;
  edit: Edit.Model;
  focus: Focus.Model;
  query: string;
  constructor(
    query:string
  , isVisible:boolean
  , edit:Edit.Model
  , focus:Focus.Model
  ) {
    this.query = query
    this.isVisible = isVisible
    this.edit = edit
    this.focus = focus
  }
}


export type Suggestion =
  { query: string
  , match: string
  , hint: string
  }

export type Action =
  | { type: 'Submit' }
  | { type: 'Query' }
  | { type: 'Abort' }
  | { type: 'Enter' }
  | { type: 'EnterSelection', value: string }
  | { type: 'Show' }
  | { type: 'Hide' }
  | { type: 'SuggestNext' }
  | { type: 'SuggestPrevious'}
  | { type: 'Suggest', suggest: Suggestion }
  | { type: "Change", change: Edit.Model }
  | { type: 'Edit', edit: Edit.Action }
  | { type: 'Focus', focus: Focus.Action }


// Create a new input submit action.
export const Query:()=>Action = always({ type: 'Query' });
export const Suggest =
  (suggestion:Suggestion):Action =>
  ( { type: "Suggest"
    , suggest: suggestion
    }
  );

const FocusAction = action =>
  ( { type: 'Focus'
    , focus: action
    }
  );

const EditAction =
  (action:Edit.Action):Action =>
  ( action.type === 'Change'
  ? action
  : { type: 'Edit'
    , edit: action
    }
  );

export const SuggestNext = { type: 'SuggestNext' };
export const SuggestPrevious = { type: 'SuggestPrevious' };
export const Submit = {type: 'Submit'};
export const Abort = {type: 'Abort'};
export const Enter = {type: 'Enter'};
export const Activate = FocusAction(Focus.Focus)
export const Blur = FocusAction(Focus.Blur)
export const Show = {type: 'Show'};
export const Hide = {type: 'Hide'};
export const EnterSelection =
  (value:string):Action =>
  ( { type: 'EnterSelection'
    , value
    }
  );


export const Clear = EditAction(Edit.Clear);


const defaultFlags =
  { isFocused: false
  , isVisible: false
  , value: ""
  }

const assemble =
  ( query
  , isVisible
  , [edit, edit$]
  , [focus, focus$]
  ) =>
  [ new Model(query, isVisible, edit, focus)
  , Effects.batch
    ( [ focus$.map(FocusAction)
      , edit$.map(EditAction)
      ]
    )
  ]

export const init =
  (flags:Flags=defaultFlags):[Model, Effects<Action>] =>
  assemble
  ( flags.value
  , !!flags.isVisible
  , Edit.init(flags.value)
  , Focus.init(!!flags.isFocused)
  )


const suggest = (model, {query, match, hint}) =>
  ( model.query !== query
  ? nofx(model)
  : enterSelectionRange
    ( model
    , match
    , ( match.toLowerCase().startsWith(query.toLowerCase())
      ? query.length
      : match.length
      )
    , match.length
    , 'backward'
    )
  )

export const update =
  (model:Model, action:Action):[Model, Effects<Action>] => {
    switch (action.type) {
      case 'Abort':
        return abort(model);
      // We don't really do anything on submit action for now
      // although in a future we may clear the value or do blur
      // the input.
      case 'Submit':
        return submit(model);
      case 'Enter':
        return enter(model);
      case 'EnterSelection':
        return enterSelection(model, action.value);
      case 'Focus':
        return delegateFocusUpdate(model, action.focus);
      case 'Edit':
        return delegateEditUpdate(model, action.edit);
      case 'Change':
        return change(model, action.change.value, action.change.selection);
      case 'Show':
        return show(model);
      case 'Hide':
        return hide(model);
      case 'SuggestNext':
        return suggestNext(model);
      case 'SuggestPrevious':
        return suggestPrevious(model);
      case 'Suggest':
        return suggest(model, action.suggest);
      case 'Query':
        return query(model);
      default:
        return Unknown.update(model, action);
    }
  };

const setVisibility =
  (model, isVisible) =>
  nofx
  ( new Model
    ( model.query
    , false
    , model.edit
    , model.focus
    )
  )

const updateFocus =
  (query, isVisible, edit, [focus, fx]) =>
  [ new Model
    ( query
    , isVisible
    , edit
    , focus
    )
  , fx.map(FocusAction)
  ]


const delegateFocusUpdate =
  ( model, action ) =>
  swapFocus(model, Focus.update(model.focus, action))

const delegateEditUpdate =
  ( model, action ) =>
  swapEdit(model, Edit.update(model.edit, action))

const swapEdit =
  (model, edit) =>
  swapEditAndQuery(model, model.query, edit)

const swapEditAndQuery =
  (model, query, [edit, fx]) =>
  [ new Model
    ( query
    , model.isVisible
    , edit
    , model.focus
    )
  , fx.map(EditAction)
  ]


const swapFocus =
  ( model
  , [focus, fx]
  ) =>
  [ new Model
    ( model.query
    , model.isVisible
    , model.edit
    , focus
    )
  , fx.map(FocusAction)
  ]


const abort =
  (model) =>
  setVisibility(model, false)

const show =
  model =>
  setVisibility(model, true);

const hide =
  model =>
  setVisibility(model, true);

const nofx =
  model =>
  [model, Effects.none];

const submit = nofx;
const suggestNext = nofx;
const suggestPrevious = nofx;
const query = nofx;

const blur =
  model =>
  swapFocus(model, Focus.blur(model.focus))

const focus =
  model =>
  swapFocus(model, Focus.focus(model.focus))

const enter =
  model =>
  assemble
  ( ""
  , true
  , Edit.clear(model.edit)
  , Focus.focus(model.focus)
  )

const enterSelectionRange =
  (model, value, start, end, direction) =>
  assemble
  ( model.query
  , true
  , Edit.change
    ( model.edit
    , value
    , new Edit.Selection(start, end, direction)
    )
  , Focus.focus(model.focus)
  );

const enterSelection =
  (model, value, direction='backward') =>
  enterSelectionRange(model, value, 0, value.length, direction);

const change =
  (model, value, selection) =>
  // If new value isn't contained by the former one, just update input &
  // submit new query.
  ( !model.edit.value.startsWith(value)
  ? editAndQuery(model, value, value, selection)
  : model.query === value
  ? swapEdit(model, Edit.change(model.edit, value, selection))
  // If former query value contains new value then user performed a delete
  // (of the value or selection). In this case we update
  : model.query.includes(value)
  ? editAndQuery(model, value, value, selection)
  // Otherwise user typed whatever was already in selection, in which case
  // we just update selection.
  : editAndQuery
    ( model
    , value
    , model.edit.value
    , new Edit.Selection(value.length, model.edit.value.length, 'backward')
    )
  );

const editAndQuery =
  (model, query, value, selection) =>
  appendFX
  ( Effects.receive(Query())
  , swapEditAndQuery(model, query, Edit.change(model.edit, value, selection))
  )

const updateValueAndSelection =
  (model, value, selection) =>
  swapEdit(model, Edit.change(model.edit, value, selection))

const decodeKeyDown = Keyboard.bindings({
  'up': always(SuggestPrevious),
  'control p': always(SuggestPrevious),
  'down': always(SuggestNext),
  'control n': always(SuggestNext),
  'enter': always(Submit),
  'escape': always(Abort)
});


const inputWidth = 480;
const inputHeight = 40;
const inputXPadding = 32;

const style = Style.createSheet({
  combobox: {
    height: inputHeight,
    right: '50%',
    marginRight: `${-1 * (inputWidth / 2)}px`,
    position: 'absolute',
    top: '40px',
    width: `${inputWidth}px`,
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
  (model:Model, address:Address<Action>):DOM =>
  html.form({
    className: 'input-combobox',
    style: Style.mix
    ( style.combobox
    , ( model.isVisible
      ? style.visible
      : style.hidden
      )
    )
  }, [
    html.figure({
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
        , ( model.edit.value.length == 0
          ? style.fieldEmpty
          : style.fieldNotEmpty
          )
        ),
      type: 'text',
      value: model.edit.value,
      isFocused: isFocused(model.focus.isFocused),
      selection: selection(model.edit.selection),
      onInput: onChange(address),
      onSelect: onSelect(address),
      onFocus: onFocus(address),
      onBlur: onBlur(address),
      onKeyDown: on(address, decodeKeyDown)
    })
  ]);


const onFocus = anotate(Focus.onFocus, FocusAction)
const onBlur = anotate(Focus.onBlur, FocusAction)
const onSelect = anotate(Edit.onSelect, EditAction)
const onChange = anotate(Edit.onChange, EditAction)
