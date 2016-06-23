/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {merge, always} from "../common/prelude"
import {cursor} from "../common/cursor"
import * as Unknown from "../common/unknown"
import * as Target from "../common/target"
import * as Focusable from "../common/focusable"
import {Style} from "../common/style"
import {html, Effects, forward} from "reflex"


import type {Model, Action} from "./control"


export const Disable:Action =
  { type: "Disable"
  };

export const Enable:Action =
  { type: "Enable"
  };

const enable = /*::<model:Model>*/
  (model:model):[model, Effects<Action>] =>
  [ merge(model, {isDisabled: false})
  , Effects.none
  ];

const disable = /*::<model:Model>*/
  (model:model):[model, Effects<Action>] =>
  [ merge(model, {isDisabled: true})
  , Effects.none
  ];

export const update = /*::<model:Model>*/
  (model:model, action:Action):[model, Effects<Action>] =>
  ( action.type === "Enable"
  ? enable(model)
  : action.type === "Disable"
  ? disable(model)
  : Unknown.update(model, action)
  );
