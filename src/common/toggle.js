/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {merge, always, mapFX} from "../common/prelude"
import * as Unknown from "../common/unknown"
import * as Target from "../common/target"
import * as Focusable from "../common/focusable"
import * as Button from "../common/button"
import {Style} from "../common/style"
import {html, Effects, forward, Task} from "reflex"


import type {Address, DOM} from "reflex"
import type {Rules} from "../common/style"

export type StyleSheet =
  { base: Rules
  , focused?: Rules
  , blured?: Rules
  , disabled?: Rules
  , enabled?: Rules
  , over?: Rules
  , out?: Rules
  , active?: Rules
  , inactive?: Rules
  , checked?: Rules
  , unchecked?: Rules
  }

export type ContextStyle = Rules

export type Model =
  { isDisabled: boolean
  , isFocused: boolean
  , isActive: boolean
  , isPointerOver: boolean
  , isChecked: boolean
  , text: string
  }

export type Action =
  | { type: "Press" }
  | { type: "Check" }
  | { type: "Uncheck" }
  | { type: "Focusable"
    , focusable: Focusable.Action
    }
  | { type: "Target"
    , target: Target.Action
    }
  | { type: "Button"
    , button: Button.Action
    }


export const init =
  ( isDisabled:boolean=false
  , isFocused:boolean=false
  , isActive:boolean=false
  , isPointerOver:boolean=false
  , isChecked:boolean=false
  , text:string=""
  ):[Model, Effects<Action>] =>
  [
    { isDisabled,
      isFocused,
      isActive,
      isPointerOver,
      isChecked,
      text
    }
  , Effects.none
  ];

export const Press:Action = {type: "Press"};
export const Check:Action = {type: "Check"};
export const Uncheck:Action = {type: "Uncheck"};

const TargetAction =
  (action:Target.Action):Action =>
  ({type: "Target", target: action});

const FocusableAction =
  (action:Focusable.Action):Action =>
  ({type: "Focusable", focusable: action});

const ButtonAction =
  (action:Button.Action):Action =>
  ({type: "Button", button: action });

export const Focus:Action = FocusableAction(Focusable.Focus);
export const Blur:Action = FocusableAction(Focusable.Blur);

export const Over:Action = TargetAction(Target.Over);
export const Out:Action = TargetAction(Target.Out);

export const Down:Action = ButtonAction(Button.Down);
export const Up:Action = ButtonAction(Button.Up);


export const update =
  (model:Model, action:Action):[Model, Effects<Action>] =>
  ( action.type === "Press"
  ? [ merge(model, {isChecked: !model.isChecked})
    , ( model.isChecked
      ? Effects.perform(Task.succeed(Uncheck))
      : Effects.perform(Task.succeed(Check))
      )
    ]

  : action.type === "Check"
  ? [ merge(model, {isChecked: true })
    , Effects.none
    ]
  : action.type === "Uncheck"
  ? [ merge(model, {isChecked: false })
    , Effects.none
    ]
  : action.type === "Button"
  ? mapFX(ButtonAction, Button.update(model, action.button))
  : action.type === "Target"
  ? mapFX(TargetAction, Target.update(model, action.target))
  : action.type === "Focusable"
  ? mapFX(FocusableAction, Focusable.update(model, action.focusable))
  : Unknown.update(model, action)
  );


export function view(key:string,
                     styleSheet:StyleSheet):(model:Model, address:Address<Action>, contextStyle?:ContextStyle) => DOM {
  return ( model
         , address
         , contextStyle
  ):DOM =>
  html.button({
    key: key,
    className: key,
    style: Style
      ( styleSheet.base

      ,   model.isFocused
        ? styleSheet.focused
        : styleSheet.blured

      ,   model.isDisabled
        ? styleSheet.disabled
        : styleSheet.enabled


      ,  model.isPointerOver
        ? styleSheet.over
        : styleSheet.out

      ,  model.isActive
        ? styleSheet.active
        : styleSheet.inactive

      ,   model.isChecked
        ? styleSheet.checked
        : styleSheet.unchecked

      , contextStyle
    ),

    onFocus: forward(address, always(Focus)),
    onBlur: forward(address, always(Blur)),

    onMouseOver: forward(address, always(Over)),
    onMouseOut: forward(address, always(Out)),

    onMouseDown: forward(address, always(Down)),
    onMouseUp: forward(address, always(Up)),

    onClick: forward(address, always(Press))
  });
}
