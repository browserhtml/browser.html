/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, Task, html, forward, thunk} from "reflex"
import * as Unknown from "../../../../common/unknown"
import {port, always, mapFX, nofx} from "../../../../common/prelude"
import * as StyleSheet from "./Suggestion/StyleSheet"
import type {Address, DOM} from "reflex"

export type Action <message> =
  | { type: "Select" }
  | { type: "Deselect" }
  | { type: "Activate" }
  | { type: "Receive", receive: message }

export type Update <message, model> =
  (state:model, action:message) =>
  [model, Effects<message>]

export type View <message, model> =
  (state:model, action:Address<message>) =>
  DOM


export const Select = { type: "Select" }
export const Deselect = { type: "Deselect" }
export const Activate = { type: "Activate" }
export const Receive = <message> (action:message):Action<message> =>
  ( { type: "Receive"
    , receive: action
    }
  )

export const update = <message, model>
  ( update:Update<message, model>
  , state:model
  , action:Action<message>
  ):[model, Effects<Action<message>>] => {
    switch (action.type) {
      case "Select":
        return select(state)
      case "Deselect":
        return deselect(state)
      case "Activate":
        return activate(state)
      case "Receive":
        return receive(update, state, action.receive)
      default:
        return Unknown.update(state, action)
    }
  }

export const select = nofx
export const deselect = nofx
export const activate = nofx
export const receive = <message, model>
  ( update:Update<message, model>
  , state:model
  , action:message
  ):[model, Effects<Action<message>>] =>
  mapFX(Receive, update(state, action))


export const render = <message, model>
  ( view:View<message, model>
  , isSelected:boolean
  , state:model
  , address:Address<Action<message>>
  ) =>
  html.li
  ( { className: 'assistant suggestion'
    , style:
        ( isSelected
        ? StyleSheet.selected
        : StyleSheet.deselected
        )
    , onMouseOver: onMouseOver(address)
    , onClick: onClick(address)
    }
  , [ view(state, forward(address, Receive))
    ]
  )

const onMouseOver = port(always(Select))
const onClick = port(always(Activate))
