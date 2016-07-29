/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {Effects, forward} from "reflex";
import {always, port} from "../common/prelude";
import * as Unknown from "../common/unknown";

import type {Address} from "reflex";

export class Model {
  isPointerOver: boolean;
  static over: Model;
  static out: Model;
  constructor(isPointerOver:boolean) {
    this.isPointerOver = isPointerOver
  }
}
Model.over = new Model(true)
Model.out = new Model(false)

export type Action
  = { type: "Over" }
  | { type: "Out" }


export const Over = { type: "Over" };
export const Out = { type: "Out" };

export const init =
  (isPointerOver:boolean=false):[Model, Effects<Action>] =>
  [ ( isPointerOver
    ? Model.over
    : Model.out
    )
  , Effects.none
  ]

export const update =
  (model:Model, action:Action):[Model, Effects<Action>] => {
    switch (action.type) {
      case "Over":
        return over(model);
      case "Out":
        return out(model);
      default:
        return Unknown.update(model, action);
    }
  }

export const over =
  (model:Model):[Model, Effects<Action>] =>
  [ Model.over
  , Effects.none
  ];

export const out =
  (model:Model):[Model, Effects<Action>] =>
  [ Model.out
  , Effects.none
  ];


export const onMouseOver = port(always(Over));
export const onMouseOut = port(always(Out));
