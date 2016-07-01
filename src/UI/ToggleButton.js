/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {html, Effects, forward} from "reflex"
import {merge, always, tag} from "../common/prelude"
import {lens} from "../common/lens"

import * as Style from "../common/style"
import * as Console from "../common/Console";
import * as IO from "../common/IO";
import * as Ref from "./Control/Ref";
import * as Toggle from "./Control/Toggle";
import * as Button from "./Button";

/*::
import type {Address, DOM} from "reflex"

export type StyleSheet =
  { base: Style.Rules
  , checked?: Style.Rules
  , unchecked?: Style.Rules
  , focused?: Style.Rules
  , blured?: Style.Rules
  , enabled?: Style.Rules
  , disabled?: Style.Rules
  , over?: Style.Rules
  , out?: Style.Rules
  , active?: Style.Rules
  , inactive?: Style.Rules
  }
*/


export class Model {
  /*::
  button: Button.Model;
  checked: Toggle.Model;
  ref: Ref.Model;
  io: IO.Model;
  */
  constructor(
    checked/*:Toggle.Model*/
  , button/*:Button.Model*/
  , ref/*:Ref.Model*/=Ref.init()
  , io/*:IO.Model*/=IO.init()
  ) {
    this.checked = checked
    this.button = button
    this.ref = ref
    this.io = io
  }
}

/*::
export type Action =
  | { type: "NoOp" }
  | { type: "Button", button: Button.Action }
  | { type: "Toggle" }
  | { type: "Check" }
  | { type: "Uncheck" }
*/

const Tag =
  { button:
      ( action ) =>
      ( { type: "Button"
        , button: action
        }
      )
  };

const button = lens
  ( ({button}) => button
  , (model, button) =>
    ( model.button === button
    ? model
    : new Model
      ( model.checked
      , button
      , model.ref
      , model.io
      )
    )
  )

const checked = lens
  ( ({checked}) => checked
  , (model, checked) =>
    ( model.checked === checked
    ? model
    : new Model
      ( checked
      , model.button
      , model.ref
      , model.io
      )
    )
  )

export const Click = { type: "Toggle" }
export const Check = { type: "Check" }
export const Uncheck = { type: "Uncheck" }

export const init =
  ( text/*:string*/=""
  , checked/*:boolean*/=false
  , disabled/*:boolean*/=false
  , focused/*:boolean*/=false
  , active/*:boolean*/=false
  , pointer/*:boolean*/=false
  , ref/*:Ref.Model*/=Ref.init()
  , fx/*:IO.Model*/=IO.init()
  ) =>
  new Model
  ( Toggle.init(checked)
  , Button.init
    ( text
    , disabled
    , focused
    , active
    , pointer
    , ref
    )
  , ref
  , fx
  )

export const update =
  ( model/*:Model*/
  , action/*:Action*/
  )/*:Model*/ =>
  ( action.type === "NoOp"
  ? model

  : action.type === "Toggle"
  ? toggle(model)

  : action.type === "Button"
  ? button.swap(Button.update, model, action.button)

  : action.type === "Check"
  ? check(model)
  : action.type === "Uncheck"
  ? uncheck(model)

  : panic(model, action)
  )

export const check =
  (model/*:Model*/)/*:Model*/ =>
  checked.swap(Toggle.check, model)

export const uncheck =
  (model/*:Model*/)/*:Model*/ =>
  checked.swap(Toggle.uncheck, model)

export const toggle =
  ( model/*:Model*/ )/*:Model*/ => {
    const checked = Toggle.toggle(model.checked)
    const button = Button.click(model.button)
    const next =
      ( ( checked !== model.checked ||
          button !== model.button
        )
      ? new Model
        ( checked
        , button
        , model.ref
        , model.io
        )
      : model
      )
    return next
  }


export const panic = <action>
  (model/*:Model*/, action/*:action*/)/*:Model*/ =>
  new Model
  ( model.checked
  , model.button
  , model.ref
  , IO.perform
    ( model.io
    , Console.error(`Panic! Unknown action was passed to update`, action)
    )
  )

export const fx =
  (model/*:Model*/)/*:Effects<Action>*/ =>
  Effects.batch
  ( [ model.io
    , Button.fx(model.button).map(Tag.button)
    ]
  )


export const renderStyled =
  ( rules/*:?Style.Rules*/
  , styleSheet/*:StyleSheet*/
  , model/*:Model*/
  , address/*:Address<Action>*/
  )/*:DOM*/ =>
  html.button
  ( { style: Style.mix
        ( styleSheet.base

        , ( model.checked
          ? styleSheet.checked
          : styleSheet.unchecked
          )

        , ( model.button.focused
          ? styleSheet.focused
          : styleSheet.blured
          )

        , ( model.button.disabled
          ? styleSheet.disabled
          : styleSheet.enabled
          )

        , ( model.button.pointer
          ? styleSheet.over
          : styleSheet.out
          )

        , ( model.button.active
          ? styleSheet.active
          : styleSheet.inactive
          )

        , rules
        )
    , onFocus: forward(forward(address, Tag.button), always(Button.Focus))
    , onBlur: forward(forward(address, Tag.button), always(Button.Blur))

    , onMouseOver: forward(forward(address, Tag.button), always(Button.Over))
    , onMouseOut: forward(forward(address, Tag.button), always(Button.Out))

    , onMouseDown: forward(forward(address, Tag.button), always(Button.Press))
    , onClick: forward(address, always(Click))
    , onMouseUp: forward(forward(address, Tag.button), always(Button.Release))
    }
  , [model.button.text]
  );

export const render =
  ( styleSheet/*:StyleSheet*/
  , model/*:Model*/
  , address/*:Address<Action>*/
  )/*:DOM*/ =>
  renderStyled(null, styleSheet, model, address);
