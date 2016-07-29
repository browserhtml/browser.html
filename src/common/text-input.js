/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, forward, Effects} from 'reflex';
import {Style} from '../common/style';
import {compose} from '../lang/functional';
import {tag, tagged, anotate, mapFX, always} from '../common/prelude';
import * as Unknown from '../common/unknown';
import * as Focus from '../common/focusable';
import * as Edit from '../common/editable';
import * as Control from '../common/control';

import {on, focus, selection} from '@driver';


import type {Address, DOM} from "reflex"
import type {Rules} from "../common/style"
import type {Tagged} from "../common/prelude"

export type StyleSheet =
  { base: Rules
  , focused?: Rules
  , blured?: Rules
  , enabled?: Rules
  , disabled?: Rules
  , over?: Rules
  , out?: Rules
  , active?: Rules
  , inactive?: Rules
  }
export type ContextStyle = Rules

export class Model {
  placeholder: string;
  edit: Edit.Model;
  focus: Focus.Model;
  control: Control.Model;
  constructor(
    edit:Edit.Model
  , focus:Focus.Model
  , control:Control.Model
  , placeholder:string
  ) {
    this.edit = edit
    this.focus = focus
    this.control = control
    this.placeholder = placeholder
  }
}



export type Action
  = { type: "Focus", focus: Focus.Action }
  | { type: "Edit", edit: Edit.Action }
  | { type: "Control", control: Control.Action }


const EditAction =
  (action:Edit.Action):Action =>
  ( { type: "Edit"
    , edit: action
    }
  );

const FocusAction =
  (action:Focus.Action):Action =>
  ( { type: "Focus"
    , focus: action
    }
  )

const ControlAction =
  action =>
  ( { type: "Control"
    , control: action
    }
  )

export const Change =
  (value:string, selection:Edit.Selection):Action =>
  EditAction(Edit.Change(value, selection));
export const Activate:Action = FocusAction(Focus.Focus);
export const Deactivate:Action = FocusAction(Focus.Blur);
export const Enable:Action = ControlAction(Control.Enable);
export const Disable:Action = ControlAction(Control.Disable);


export const init =
  ( value:string=''
  , selection:?Edit.Selection=null
  , placeholder:string=''
  , isDisabled:boolean=false
  , isFocused:boolean=false
  ):[Model, Effects<Action>] => {
    const [edit, edit$] = Edit.init(value, selection);
    const [focus, focus$] = Focus.init(isFocused);
    const [control, control$] = Control.init(isDisabled);
    const model = new Model
      ( edit
      , focus
      , control
      , placeholder
      )
    const fx = Effects.batch
      ( [ edit$.map(EditAction)
        , focus$.map(FocusAction)
        , control$.map(ControlAction)
        ]
      )

    return [model, fx]
  };


export const update =
  (model:Model, action:Action):[Model, Effects<Action>] => {
    switch (action.type) {
      case 'Edit':
        return delegateEditUpdate(model, action.edit)
      case 'Focus':
        return delegateFocusUpdate(model, action.focus)
      case 'Control':
        return delegateControlUpdate(model, action.control)
      default:
        return Unknown.update(model, action)
    }
  };

export const enable =
  (model:Model):[Model, Effects<Action>] =>
  delegateControlUpdate(model, Control.Enable);

export const disable =
  (model:Model):[Model, Effects<Action>] =>
  delegateControlUpdate(model, Control.Disable);

export const edit =
  (model:Model, value:string, selection:Edit.Selection):[Model, Effects<Action>] =>
  swapEdit
  ( model
  , Edit.change(model.edit, value, selection)
  )

const delegateEditUpdate =
  ( model, action ) =>
  swapEdit(model, Edit.update(model.edit, action))

const delegateFocusUpdate =
  ( model, action ) =>
  swapFocus(model, Focus.update(model.focus, action))

const delegateControlUpdate =
  ( model, action ) =>
  swapControl(model, Control.update(model.control, action))

const swapEdit =
  ( model
  , [edit, fx]
  ) =>
  [ new Model(edit, model.focus, model.control, model.placeholder)
  , fx.map(EditAction)
  ]

const swapFocus =
  ( model
  , [focus, fx]
  ) =>
  [ new Model(model.edit, focus, model.control, model.placeholder)
  , fx.map(FocusAction)
  ]

const swapControl =
  ( model
  , [control, fx]
  ) =>
  [ new Model(model.edit, model.focus, control, model.placeholder)
  , fx.map(ControlAction)
  ]

const decodeSelection =
  ({target}) =>
  ( { start: target.selectionStart
    , end: target.selectionEnd
    , direction: target.selectionDirection
    }
  );

const decodeSelect =
  compose(EditAction, Edit.Select, decodeSelection);

const decodeChange = compose
  ( EditAction
  , event =>
    Change(event.target.value, decodeSelection(event))
  );


export function view(key:string,
                     styleSheet:StyleSheet):(model:Model, address:Address<Action>, contextStyle?:ContextStyle) => DOM {
  return ( model
         , address
         , contextStyle
  ):DOM =>
  html.input
  ( { key
    , type: 'input'
    , placeholder: model.placeholder
    , value: model.edit.value
    , disabled:
      ( model.control.isDisabled
      ? true
      : void(0)
      )
    , isFocused: focus(model.focus.isFocused)
    , selection: selection(model.edit.selection)
    , onInput: on(address, decodeChange)
    , onKeyUp: on(address, decodeSelect)
    , onSelect: on(address, decodeSelect)
    , onFocus: onFocus(address)
    , onBlur: onBlur(address)
    , style: Style
      ( styleSheet.base
      , ( model.isDisabled
        ? styleSheet.disabled
        : styleSheet.enabled
        )
      , contextStyle
      )
    }
  )
}

export const onFocus = anotate(Focus.onFocus, FocusAction)
export const onBlur = anotate(Focus.onBlur, FocusAction)
