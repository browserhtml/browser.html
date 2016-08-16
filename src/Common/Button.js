/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {merge, always, nofx, mapFX, anotate, port} from "../Common/Prelude"
import * as Unknown from "../Common/Unknown"
import * as Target from "../Common/Target"
import * as Focus from "../Common/Focus"
import * as Control from "../Common/Control"
import {Style} from "../Common/Style"
import {html, Effects, forward} from "reflex"

import type {Address, DOM} from "reflex"
import type {Rules} from "../Common/Style"

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

export class Model {
  control: Control.Model;
  target: Target.Model;
  focus: Focus.Model;
  isActive: boolean;
  label: string;
  constructor(
    label:string
  , isActive:boolean
  , control:Control.Model
  , target:Target.Model
  , focus:Focus.Model
  ) {
    this.label = label;
    this.isActive = isActive;
    this.control = control;
    this.target = target;
    this.focus = focus;
  }
}

export type Action =
  | { type: "Down" }
  | { type: "Click" }
  | { type: "Up" }
  | { type: "Control", control: Control.Action }
  | { type: "Focus" , focus: Focus.Action }
  | { type: "Target", target: Target.Action }


const TargetAction =
  (action:Target.Action):Action =>
  ( { type: "Target"
    , target: action
    }
  );

const FocusAction =
  (action:Focus.Action):Action =>
  ( { type: "Focus"
    , focus: action
    }
  );

const ControlAction =
  (action:Control.Action):Action =>
  ( { type: "Control"
    , control: action
    }
  );

export const Down = { type: "Down" };
export const Click = { type: "Click" };
export const Up = { type: "Up" };
export const Disable = ControlAction(Control.Disable);
export const Enable = ControlAction(Control.Enable);
export const Activate = FocusAction(Focus.Focus);
export const Deactivate = FocusAction(Focus.Blur);
export const Over = TargetAction(Target.Over);
export const Out = TargetAction(Target.Out);

export const init =
  ( isDisabled:boolean
  , isFocused:boolean
  , isActive:boolean
  , isPointerOver:boolean
  , label:string=''
  ):[Model, Effects<Action>] =>
  assemble
  ( label
  , isActive
  , Control.init(isActive)
  , Target.init(isPointerOver)
  , Focus.init(isFocused)
  );

const assemble =
  ( label
  , isActive
  , [control, control$]
  , [target, target$]
  , [focus, focus$]
  ) =>
  [ new Model
    ( label
    , isActive
    , control
    , target
    , focus
    )
  , Effects.batch
    ( [ control$.map(ControlAction)
      , target$.map(TargetAction)
      , focus$.map(FocusAction)
      ]
    )
  ]


export const update =
  (model:Model, action:Action):[Model, Effects<Action>] => {
    switch (action.type) {
      case "Down":
        return down(model)
      case "Up":
        return up(model)
      case "Click":
        return press(model)
      case "Control":
        return delegateControlUpdate(model, action.control)
      case "Target":
        return delegateTargetUpdate(model, action.target)
      case "Focus":
        return delegateFocusUpdate(model, action.focus)
      default:
        return Unknown.update(model, action)
    }
  }

export const down =
  (model:Model):[Model, Effects<Action>] =>
  nofx
  ( new Model
    ( model.label
    , true
    , model.control
    , model.target
    , model.focus
    )
  )

export const up =
  (model:Model):[Model, Effects<Action>] =>
  nofx
  ( new Model
    ( model.label
    , false
    , model.control
    , model.target
    , model.focus
    )
  )

export const press =
  (model:Model):[Model, Effects<Action>] =>
  nofx(model)

const delegateControlUpdate =
  (model, action) =>
  swapControl(model, Control.update(model.control, action))

const swapControl =
  (model, [control, fx]) =>
  [ new Model
    ( model.label
    , model.isActive
    , control
    , model.target
    , model.focus
    )
  , fx.map(ControlAction)
  ]

const delegateTargetUpdate =
  (model, action) =>
  swapTarget(model, Target.update(model.target, action))

const swapTarget =
  (model, [target, fx]) =>
  [ new Model
    ( model.label
    , model.isActive
    , model.control
    , target
    , model.focus
    )
  , fx.map(TargetAction)
  ]


const delegateFocusUpdate =
  (model, action) =>
  swapFocus(model, Focus.update(model.focus, action))

const swapFocus =
  (model, [focus, fx]) =>
  [ new Model
    ( model.label
    , model.isActive
    , model.control
    , model.target
    , focus
    )
  , fx.map(FocusAction)
  ]


export const view =
  (key:string, styleSheet:StyleSheet) =>
  (model:Model, address:Address<Action>, contextStyle?:ContextStyle):DOM =>
  html.button({
    key: key,
    className: key,
    style: Style
      (  styleSheet.base
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
      , contextStyle
      ),

    onFocus: onFocus(address),
    onBlur: onBlur(address),

    onMouseOver: onMouseOver(address),
    onMouseOut: onMouseOut(address),

    onMouseDown: onMouseDown(address),
    onClick: onClick(address),
    onMouseUp: onMouseUp(address)
  }, [
    model.label
  ]);

export const onFocus = anotate(Focus.onFocus, FocusAction)
export const onBlur = anotate(Focus.onBlur, FocusAction)
export const onMouseOver = anotate(Target.onMouseOver, TargetAction)
export const onMouseOut = anotate(Target.onMouseOut, TargetAction)
export const onMouseDown = port(always(Down))
export const onMouseUp = port(always(Up))
export const onClick = port(always(Click))
