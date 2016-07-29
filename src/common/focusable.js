/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {merge} from "../common/prelude";
import * as Unknown from "../common/unknown";
import {Effects} from "reflex";


export type Model =
  { isFocused: boolean
  }

export type Action =
  | { type: "Focus" }
  | { type: "Blur" }

export const Focus:Action =
  { type:"Focus"
  };

export const Blur:Action =
  { type: "Blur"
  };

export const init =
  (isFocused:boolean=false):[Model, Effects<Action>] =>
  [ { isFocused }
  , Effects.none
  ]

export const update = <model:Model>
  ( model:model, action:Action):[model, Effects<Action>] =>
  ( action.type === "Focus"
  ? focus(model)
  : action.type === "Blur"
  ? blur(model)
  : Unknown.update(model, action)
  );

export const focus = <model:Model>
  ( model:model ):[model, Effects<Action>] =>
  [ merge
    ( model
    , { isFocused: true
      }
    )
  , Effects.none
  ]

export const blur = <model:Model>
  ( model:model ):[model, Effects<Action>] =>
  [ merge
    ( model
    , { isFocused: false
      }
    )
  , Effects.none
  ]
