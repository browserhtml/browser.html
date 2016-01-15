/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type {Address, VirtualTree} from "reflex/type"
import type {Effects} from "reflex/type/effects"

export type Model <model> =
  { component: model
  , isEnabled: boolean
  }

export type Enable =
  { type: "Enable"
  }

export type Disable =
  { type: "Disable"
  }

export type Toggle =
  { type: "Toggle"
  }

type Component <action> =
  { type: "Component"
  , source: action
  }

export type Action <action>
  = Enable
  | Disable
  | Toggle
  | Component<action>

export type Init <model, action> =
  () =>
  [model, Effects<action>];

export type initializer = <model, action, init:Init<model, action>>
  (init:init) =>
  Init<Model<model>, Action<action>>

export type Update <model, action> =
  (model:model, action:action) =>
  [model, Effects<action>]

export type updater = <model, action, update:Update<model, action>>
  (update:update) =>
  Update<Model<model>, Action<action>>

export type View <model, action> =
  (model:model, address:Address<action>) =>
  VirtualTree

export type view = <model, action, view:View<model, action>>
  (view:view) =>
  View<Model<model>, Action<action>>
