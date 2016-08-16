/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {always, port} from "../Common/Prelude"
import * as Unknown from "../Common/Unknown"
import {Effects, forward} from "reflex"

import type {Address} from "reflex"

export class Model {
  isFocused: boolean;
  static focused: Model;
  static blured: Model;
  constructor(isFocused:boolean) {
    this.isFocused = isFocused
  }
}
Model.focused = new Model(true)
Model.blured = new Model(false)

export type Action =
  | { type: "Focus" }
  | { type: "Blur" }

export const Focus = { type:"Focus" }
export const Blur = { type: "Blur" }

export const init =
  (isFocused:boolean=false):[Model, Effects<Action>] =>
  [ ( isFocused
    ? Model.focused
    : Model.blured
    )
  , Effects.none
  ]

export const update =
  ( model:Model, action:Action):[Model, Effects<Action>] => {
    switch (action.type) {
      case "Focus":
        return focus(model)
      case "Blur":
        return blur(model)
      default:
        return Unknown.update(model, action)
    }
  };

export const focus =
  (model:Model):[Model, Effects<Action>] =>
  [ Model.focused
  , Effects.none
  ]

export const blur =
  (model:Model):[Model, Effects<Action>] =>
  [ Model.blured
  , Effects.none
  ]

export const onFocus = port(always(Focus));
export const onBlur = port(always(Blur));
