/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {html, Effects, forward} from "reflex"
import {merge, always, tag} from "../common/prelude"
import {lens} from "../common/lens"

import * as Console from "../common/Console";
import * as IO from "../common/IO";
import * as Ref from "./Control/Ref";
import * as Pointer from "./Control/Pointer";
import * as Active from "./Control/Active";
import * as Disabled from "./Control/Disabled";
import * as Focused from "./Control/Focus";
import * as Style from "../common/style"

import type {Address, DOM} from "reflex"

export type StyleSheet =
  { base: Style.Rules
  , focused?: Style.Rules
  , blured?: Style.Rules
  , enabled?: Style.Rules
  , disabled?: Style.Rules
  , over?: Style.Rules
  , out?: Style.Rules
  , active?: Style.Rules
  , inactive?: Style.Rules
  }


export class Model {
  text: string;
  disabled: Disabled.Model;
  focused: Focused.Model;
  active: Active.Model;
  pointer: Pointer.Model;
  ref: Ref.Model;
  io: IO.Model;
  constructor(
    text/*:string*/
  , disabled/*:Disabled.Model*/
  , focused/*:Focused.Model*/
  , active/*:Active.Model*/
  , pointer/*:Pointer.Model*/
  , ref/*:Ref.Model*/
  , io/*:IO.Model*/
  ) {
    this.text = text
    this.disabled = disabled
    this.focused = focused
    this.active = active
    this.pointer = pointer
    this.ref = ref
    this.io = io
  }
}

export type Action =
  | { type: "NoOp" }
  | { type: "Press" }
  | { type: "Release" }
  | { type: "Click" }
  | { type: "Enable" }
  | { type: "Disable" }
  | { type: "Focus" }
  | { type: "Blur" }
  | { type: "Over" }
  | { type: "Out" }

export const Press = { type: "Press" }
export const Click = { type: "Click" }
export const Release = { type: "Release" }
export const Over = Pointer.Over;
export const Out = Pointer.Out;
export const Blur = Focused.Blur;
export const Focus = Focused.Focus;

export const init =
  ( text/*:string*/=""
  , disabled/*:boolean*/=false
  , focused/*:boolean*/=false
  , active/*:boolean*/=false
  , pointer/*:boolean*/=false
  , ref/*:Ref.Model*/=Ref.init()
  , io/*:IO.Model*/=IO.init()
  ) =>
  new Model
  ( text
  , Disabled.init(disabled)
  , Focused.init(focused)
  , Active.init(active)
  , Pointer.init(pointer)
  , ref
  , io
  )

export const update =
  ( model/*:Model*/
  , action/*:Action*/
  )/*:Model*/ =>
  ( action.type === "NoOp"
  ? model

  : action.type === "Press"
  ? press(model)
  : action.type === "Release"
  ? release(model)
  : action.type === "Click"
  ? click(model)

  : action.type === "Enable"
  ? updateDisabled(model, action)
  : action.type === "Disable"
  ? updateDisabled(model, action)

  : action.type === "Focus"
  ? updateFocus(model, action)
  : action.type === "Blur"
  ? updateFocus(model, action)

  : action.type === "Over"
  ? updatePointer(model, action)
  : action.type === "Out"
  ? updatePointer(model, action)

  : panic(model, action)
  )

export const press =
  ( model/*:Model*/ ) => {
    const active = Active.activate(model.active)
    const next =
      ( model.active === active
      ? model
      : new Model
        ( model.text
        , model.disabled
        , model.focused
        , active
        , model.pointer
        , model.ref
        , model.io
        )
      )
    return next
  }

export const release =
  ( model/*:Model*/ )/*:Model*/ => {
    const active = Active.deactivate(model.active)
    const next =
      ( model.active === active
      ? model
      : new Model
        ( model.text
        , model.disabled
        , model.focused
        , active
        , model.pointer
        , model.ref
        , model.io
        )
      )
    return next
  }

export const click =
  ( model/*:Model*/ ) =>
  ( model )

export const updateDisabled =
  ( model/*:Model*/, action/*:Disabled.Action*/) => {
    const disabled = Disabled.update(model.disabled, action)
    const next =
      ( model.disabled === disabled
      ? model
      : new Model
        ( model.text
        , disabled
        , ( disabled
          ? false
          : model.focused
          )
        , ( disabled
          ? false
          : model.active
          )
        , model.pointer
        , model.ref
        , model.io
        )
      )
    return next
  }

export const updateFocus =
  ( model/*:Model*/, action/*:Focused.Action*/ ) => {
    const focused = Focused.update(model.focused, action)
    const next =
      ( model.focused === focused
      ? model
      : new Model
        ( model.text
        , model.disabled
        , focused
        , model.active
        , model.pointer
        , model.ref
        , model.io
        )
      )
    return next
  }

export const updatePointer =
  ( model/*:Model*/, action/*:Pointer.Action*/ ) => {
    const pointer = Pointer.update(model.pointer, action)
    const next =
      ( model.pointer === pointer
      ? model
      : new Model
        ( model.text
        , model.disabled
        , model.focused
        , model.active
        , pointer
        , model.ref
        , model.io
        )
      )
    return next
  }

export const panic = <action>
  (model/*:Model*/, action/*:action*/)/*:Model*/ =>
  new Model
  ( model.text
  , model.disabled
  , model.focused
  , model.active
  , model.pointer
  , model.ref
  , IO.perform
    ( model.io
    , Console.error(`Panic! Unknown action was passed to update`, action)
    )
  )

export const fx =
  (model/*:Model*/)/*:Effects<Action>*/ =>
  model.io

export const renderStyled =
  ( rules/*:?Style.Rules*/
  , styleSheet/*:StyleSheet*/
  , model/*:Model*/
  , address/*:Address<Action>*/
  )/*:DOM*/ =>
  html.button
  ( { style: Style.mix
        ( styleSheet.base

        , ( model.focused
          ? styleSheet.focused
          : styleSheet.blured
          )

        , ( model.disabled
          ? styleSheet.disabled
          : styleSheet.enabled
          )

        , ( model.pointer
          ? styleSheet.over
          : styleSheet.out
          )

        , ( model.active
          ? styleSheet.active
          : styleSheet.inactive
          )

        , rules
        )
    , onFocus: forward(address, always(Focus))
    , onBlur: forward(address, always(Blur))

    , onMouseOver: forward(address, always(Over))
    , onMouseOut: forward(address, always(Out))

    , onMouseDown: forward(address, always(Press))
    , onClick: forward(address, always(Click))
    , onMouseUp: forward(address, always(Release))
    }
  , [model.text]
  );

export const render =
  ( styleSheet/*:StyleSheet*/
  , model/*:Model*/
  , address/*:Address<Action>*/
  )/*:DOM*/ =>
  renderStyled(null, styleSheet, model, address);
