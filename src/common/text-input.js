/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, forward, Effects} from 'reflex';
import {Style} from '../common/style';
import {compose} from '../lang/functional';
import {tag, tagged, mapFX, merge, always} from '../common/prelude';
import * as Unknown from '../common/unknown';
import * as Focusable from '../common/focusable';
import * as Editable from '../common/editable';
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

export type Model =
  { value: string
  , selection: ?Editable.Selection
  , placeholder: ?string
  , isDisabled: boolean
  , isFocused: boolean
  }



export type Action
  = { type: "Focusable", focusable: Focusable.Action }
  | { type: "Editable", editable: Editable.Action }
  | { type: "Control", control: Control.Action }
  | { type: "Change"
    , value: string
    , selection: Editable.Selection
    }
  | { type: "Focus" }
  | { type: "Blur" }




const EditableAction =
  action =>
  ( { type: "Editable"
    , editable: action
    }
  );

const FocusableAction =
  (action) =>
  ( action.type === "Focus"
  ? Focus
  : action.type === "Blur"
  ? Blur
  : { type: "Focusable", focusable: action }
  );

const ControlAction =
  action =>
  ( { type: "Control"
    , control: action
    }
  )

export const Change = Editable.Change;
export const Focus:Action = { type: "Focus" };
export const Blur:Action = { type: "Blur" };
export const Enable:Action = ControlAction(Control.Enable);
export const Disable:Action = ControlAction(Control.Disable);


export const init =
  ( value:string=''
  , selection:?Editable.Selection=null
  , placeholder:string=''
  , isDisabled:boolean=false
  ):[Model, Effects<Action>] =>
  [ { value
    , placeholder
    , selection
    , isDisabled
    , isFocused: false
    }
  , Effects.none
  ];

const enable =
  model =>
  [ merge(model, {isDisabled: false})
  , Effects.none
  ];

const disable =
  model =>
  [ merge(model, {isDisabled: true})
  , Effects.none
  ];


export const update =
  (model:Model, action:Action):[Model, Effects<Action>] =>
  ( action.type === 'Change'
  ? mapFX(EditableAction, Editable.update(model, action))
  : action.type === 'Editable'
  ? mapFX(EditableAction, Editable.update(model, action.editable))
  : action.type === 'Focusable'
  ? mapFX(FocusableAction, Focusable.update(model, action.focusable))
  : action.type === 'Focus'
  ? mapFX(FocusableAction, Focusable.update(model, action))
  : action.type === 'Blur'
  ? mapFX(FocusableAction, Focusable.update(model, action))
  : action.type === 'Control'
  ? mapFX(ControlAction, Control.update(model, action.control))
  : Unknown.update(model, action)
  );

const decodeSelection =
  ({target}) =>
  ( { start: target.selectionStart
    , end: target.selectionEnd
    , direction: target.selectionDirection
    }
  );

const decodeSelect =
  compose(EditableAction, Editable.Select, decodeSelection);

const decodeChange = compose
  ( EditableAction
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
    , value: model.value
    , disabled:
      ( model.isDisabled
      ? true
      : void(0)
      )
    , isFocused: focus(model.isFocused)
    , selection: selection(model.selection)
    , onInput: on(address, decodeChange)
    , onKeyUp: on(address, decodeSelect)
    , onSelect: on(address, decodeSelect)
    , onFocus: forward(address, always(Focus))
    , onBlur: forward(address, always(Blur))
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
