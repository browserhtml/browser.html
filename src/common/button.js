/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {merge, always, tag} from "../common/prelude"
import {cursor} from "../common/cursor"
import * as Unknown from "../common/unknown"
import * as Target from "../common/target"
import * as Focusable from "../common/focusable"
import * as Control from "../common/control"
import {Style} from "../common/style"
import {html, Effects, forward} from "reflex"


import type {Model, Action, StyleSheet, ContextStyle} from "./button"
import type {Address, DOM} from "reflex"


const TargetAction =
  action =>
  ( { type: "Target"
    , source: action
    }
  );

const FocusableAction =
  action =>
  ( { type: "Focusable"
    , source: action
    }
  );

const ControlAction =
  action =>
  ( { type: "Control"
    , source: action
    }
  );

export const Down = { type: "Down" };
export const Press = { type: "Press" };
export const Up = { type: "Up" };

export const Disable = ControlAction(Control.Disable);
export const Enable = ControlAction(Control.Enable);


export const Focus = FocusableAction(Focusable.Focus);
export const Blur = FocusableAction(Focusable.Blur);

export const Over = TargetAction(Target.Over);
export const Out = TargetAction(Target.Out);

const updateFocusable = cursor
  ( { tag: FocusableAction
    , update: Focusable.update
    }
  );

const updateTarget = cursor
  ( { tag: TargetAction
    , update: Target.update
    }
  );

const updateControl = cursor
  ( { tag: ControlAction
    , update: Control.update
    }
  );

export const init =
  ( isDisabled/*:boolean*/
  , isFocused/*:boolean*/
  , isActive/*:boolean*/
  , isPointerOver/*:boolean*/
  , text/*:string*/=''
  )/*:[Model, Effects<Action>]*/ =>
  [ ({isDisabled: false
    , isFocused: false
    , isActive: false
    , isPointerOver: false
    , text
    })
  , Effects.none
  ]

export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ =>
  ( action.type === "Down"
  ? [merge(model, {isActive: true}), Effects.none]
  : action.type === "Up"
  ? [merge(model, {isActive: false}), Effects.none]
  : action.type === "Press"
  ? [model, Effects.none]
  : action.type === "Control"
  ? updateControl(model, action.source)
  : action.type === "Target"
  ? updateTarget(model, action.source)
  : action.type === "Focusable"
  ? updateFocusable(model, action.source)
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
      (  styleSheet.base

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

      , contextStyle
      ),

    onFocus: forward(address, always(Focus)),
    onBlur: forward(address, always(Blur)),

    onMouseOver: forward(address, always(Over)),
    onMouseOut: forward(address, always(Out)),

    onMouseDown: forward(address, always(Down)),
    onClick: forward(address, always(Press)),
    onMouseUp: forward(address, always(Up))
  }, [model.text || '']);
