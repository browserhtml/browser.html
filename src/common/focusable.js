/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {merge} from "../common/prelude";
import * as Unknown from "../common/unknown";
import {Effects} from "reflex";


import type {Model, Action} from "./focusable"


export const Focus/*:Action*/ =
  { type:"Focus"
  };

export const Blur/*:Action*/ =
  { type: "Blur"
  };


export const update = /*::<model:Model>*/
  ( model/*:model*/, action/*:Action*/)/*:[model, Effects<Action>]*/ =>
  ( action.type === "Focus"
  ? [ merge
      ( model
      , { isFocused: true
        }
      )
    , Effects.none
    ]
  : action.type === "Blur"
  ? [ merge
      ( model
      , { isFocused: false
        }
      )
    , Effects.none
    ]
  : Unknown.update(model, action)
  );
