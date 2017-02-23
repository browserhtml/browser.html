/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as Unknown from '../Common/Unknown'
import {Effects} from 'reflex'

export class Model {
  isDisabled: boolean;
  static enabled: Model;
  static disabled: Model;
  constructor (isDisabled:boolean) {
    this.isDisabled = isDisabled
  }
}
Model.enabled = new Model(false)
Model.disabled = new Model(true)

export type Action =
  | { type: "Disable" }
  | { type: "Enable" }

export const Disable = { type: 'Disable' }
export const Enable = { type: 'Enable' }

export const init =
  (isDisable:boolean=false):[Model, Effects<Action>] =>
  [ (isDisable
    ? Model.disabled
    : Model.enabled
    ),
   Effects.none
  ]

export const update =
  (model:Model, action:Action):[Model, Effects<Action>] => {
    switch (action.type) {
      case 'Enable':
        return enable(model)
      case 'Disable':
        return disable(model)
      case 'Toggle':
        return toggle(model)
      default:
        return Unknown.update(model, action)
    }
  }

export const enable =
  (model:Model):[Model, Effects<Action>] =>
  [ Model.enabled,
   Effects.none
  ]

export const disable =
  (model:Model):[Model, Effects<Action>] =>
  [ Model.disabled,
   Effects.none
  ]

export const toggle =
  (model:Model):[Model, Effects<Action>] =>
  [ (model.isDisabled
    ? Model.enabled
    : Model.disabled
    ),
   Effects.none
  ]
