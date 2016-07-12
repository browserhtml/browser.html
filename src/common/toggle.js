/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {merge, always, anotate, mapFX} from "../common/prelude"
import * as Unknown from "../common/unknown"
import * as Target from "../common/target"
import * as Focus from "../common/focusable"
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

export class Model {
  button: Button.Model;
  isChecked: boolean;
  constructor(isChecked:boolean, button:Button.Model) {
    this.isChecked = isChecked
    this.button = button
  }
}

export type Action =
  | { type: "Toggle" }
  | { type: "Check" }
  | { type: "Uncheck" }
  | { type: "Button", button: Button.Action }


export const init =
  ( isDisabled:boolean=false
  , isFocused:boolean=false
  , isActive:boolean=false
  , isPointerOver:boolean=false
  , isChecked:boolean=false
  , label:string=""
  ):[Model, Effects<Action>] =>
  assemble
  ( isChecked
  , Button.init(isDisabled, isFocused, isActive, isPointerOver, label)
  )

const assemble =
  ( isDisabled
  , [button, fx]
  ) =>
  [ new Model(isDisabled, button)
  , fx.map(ButtonAction)
  ]

export const Toggle = {type: "Toggle"}
export const Check = {type: "Check"}
export const Uncheck = {type: "Uncheck"}

const ButtonAction =
  (action:Button.Action):Action =>
  ( action.type === "Press"
  ? Toggle
  : { type: "Button"
    , button: action
    }
  )

export const update =
  (model:Model, action:Action):[Model, Effects<Action>] => {
    switch (action.type) {
      case "Check":
        return check(model)
      case "Uncheck":
        return uncheck(model)
      case "Toggle":
        return toggle(model)
      case "Button":
        return delegateButtonUpdate(model, action.button)
      default:
        return Unknown.update(model, action)
    }
  }

export const toggle =
  (model:Model):[Model, Effects<Action>] =>
  ( model.isChecked
  ? [ new Model(false, model.button)
    , Effects.perform(Task.succeed(Check))
    ]
  : [ new Model(true, model.button)
    , Effects.perform(Task.succeed(Uncheck))
    ]
  )

export const press = toggle

export const check =
  (model:Model):[Model, Effects<Action>] =>
  ( model.isChecked
  ? nofx(model)
  : nofx(new Model(true, model.button))
  )

export const uncheck =
  (model:Model):[Model, Effects<Action>] =>
  ( model.isChecked
  ? nofx(new Model(false, model.button))
  : nofx(model)
  )

const nofx =
  model =>
  [ model
  , Effects.none
  ]

const delegateButtonUpdate =
  (model, action) =>
  swapButton(model, Button.update(model.button, action))

const swapButton =
  (model, [button, fx]) =>
  [ new Model(model.isChecked, button)
  , fx.map(ButtonAction)
  ]


export const view =
  (key:string, styleSheet:StyleSheet) =>
  (model:Model, address:Address<Action>, contextStyle?:ContextStyle):DOM =>
  html.button({
    key: key,
    className: key,
    style: Style
      ( styleSheet.base
      , ( model.isFocused
        ? styleSheet.focused
        : styleSheet.blured
        )
      , ( model.isDisabled
        ? styleSheet.disabled
        : styleSheet.enabled
        )
      , ( model.isPointerOver
        ? styleSheet.over
        : styleSheet.out
        )
      , ( model.isActive
        ? styleSheet.active
        : styleSheet.inactive
        )
      , ( model.isChecked
        ? styleSheet.checked
        : styleSheet.unchecked
        )
      , contextStyle
      ),

    onFocus: onFocus(address),
    onBlur: onBlur(address),
    onMouseOver: onMouseOver(address),
    onMouseOut: onMouseOut(address),
    onClick: onClick(address),
    onMouseDown: onMouseDown(address),
    onMouseUp: onMouseUp(address)
  });

export const onFocus = anotate(Button.onFocus, ButtonAction)
export const onBlur = anotate(Button.onBlur, ButtonAction)
export const onMouseOver = anotate(Button.onMouseOver, ButtonAction)
export const onMouseOut = anotate(Button.onMouseOut, ButtonAction)
export const onClick = anotate(Button.onClick, ButtonAction)
export const onMouseDown = anotate(Button.onMouseDown, ButtonAction)
export const onMouseUp = anotate(Button.onMouseUp, ButtonAction)
