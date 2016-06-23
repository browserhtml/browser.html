/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {merge, always} from "../common/prelude"
import {cursor} from "../common/cursor"
import * as Unknown from "../common/unknown"
import * as Target from "../common/target"
import * as Focusable from "../common/focusable"
import * as Button from "../common/button"
import {Style} from "../common/style"
import {html, Effects, forward, Task} from "reflex"


import type {Address, DOM} from "reflex"
import type {Action, Model, StyleSheet, ContextStyle} from "./toggle"



export const init =
  ( isDisabled/*:boolean*/=false
  , isFocused/*:boolean*/=false
  , isActive/*:boolean*/=false
  , isPointerOver/*:boolean*/=false
  , isChecked/*:boolean*/=false
  , text/*:string*/=""
  )/*:[Model, Effects<Action>]*/ =>
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

export const Press/*:Action*/ = {type: "Press"};
export const Check/*:Action*/ = {type: "Check"};
export const Uncheck/*:Action*/ = {type: "Uncheck"};

const TargetAction =action => ({type: "Target", action});
const FocusableAction = action => ({type: "Focusable", action});
const ButtonAction = action => ({type: "Button", action});

export const Focus/*:Action*/ = FocusableAction(Focusable.Focus);
export const Blur/*:Action*/ = FocusableAction(Focusable.Blur);

export const Over/*:Action*/ = TargetAction(Target.Over);
export const Out/*:Action*/ = TargetAction(Target.Out);

export const Down/*:Action*/ = ButtonAction(Button.Down);
export const Up/*:Action*/ = ButtonAction(Button.Up);


const updateTarget = cursor({
  update: Target.update,
  tag: TargetAction
});

const updateFocusable = cursor({
  update: Focusable.update,
  tag: FocusableAction
});

const updateButton = cursor({
  update: Button.update,
  tag: ButtonAction
});


export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ =>
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
  ? updateButton(model, action.action)
  : action.type === "Target"
  ? updateTarget(model, action.action)
  : action.type === "Focusable"
  ? updateFocusable(model, action.action)
  : Unknown.update(model, action)
  );


export const view =
  (key/*:string*/, styleSheet/*:StyleSheet*/)/*:(model:Model, address:Address<Action>, contextStyle?:ContextStyle) => DOM*/ =>
  ( model/*:Model*/
  , address/*:Address<Action>*/
  , contextStyle/*?:ContextStyle*/
  )/*:DOM*/ =>
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
