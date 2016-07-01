/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {merge, always, mapFX} from "../common/prelude"
import * as Unknown from "../common/unknown"
import * as Target from "../common/target"
import * as Focusable from "../common/focusable"
import * as Control from "../common/control"
import {Style} from "../common/style"
import {html, Effects, forward} from "reflex"

import type {Address, DOM} from "reflex"
import type {Rules} from "../common/style"

export type ContextStyle = Rules

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


export type Model =
  { isDisabled: boolean
  , isActive: boolean
  , isPointerOver: boolean
  , isFocused: boolean
  , text: string
  }

export type Action =
  | { type: "Down" }
  | { type: "Press" }
  | { type: "Up" }
  | { type: "Control"
    , control: Control.Action
    }
  | { type: "Focusable"
    , focusable: Focusable.Action
    }
  | { type: "Target"
    , target: Target.Action
    }


const TargetAction =
  action =>
  ( { type: "Target"
    , target: action
    }
  );

const FocusableAction =
  action =>
  ( { type: "Focusable"
    , focusable: action
    }
  );

const ControlAction =
  action =>
  ( { type: "Control"
    , control: action
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

export const init =
  ( isDisabled:boolean
  , isFocused:boolean
  , isActive:boolean
  , isPointerOver:boolean
  , text:string=''
  ):[Model, Effects<Action>] =>
  [ ({isDisabled: false
    , isFocused: false
    , isActive: false
    , isPointerOver: false
    , text
    })
  , Effects.none
  ]

export const update = <model:Model>
  (model:model, action:Action):[model, Effects<Action>] =>
  ( action.type === "Down"
  ? [merge(model, {isActive: true}), Effects.none]
  : action.type === "Up"
  ? [merge(model, {isActive: false}), Effects.none]
  : action.type === "Press"
  ? [model, Effects.none]
  : action.type === "Control"
  ? mapFX(ControlAction, Control.update(model, action.control))
  : action.type === "Target"
  ? mapFX(TargetAction, Target.update(model, action.target))
  : action.type === "Focusable"
  ? mapFX(FocusableAction, Focusable.update(model, action.focusable))
  : Unknown.update(model, action)
  );


export const view =
  (key:string, styleSheet:StyleSheet) =>
  (model:Model, address:Address<Action>, contextStyle?:ContextStyle):DOM =>
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
