/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {html, forward, thunk} from "reflex";
import {always} from "../../../../common/prelude";
import * as StyleSheet from "./Suggestion/StyleSheet"


import type {Address, DOM} from "reflex"

export type Action =
  | { type: "Select" }
  | { type: "Activate" }




export const render =
  (isSelected:boolean, content:Array<DOM>, address:Address<Action>):DOM =>
  html.li
  ( { className: 'assistant suggestion'
    , style:
        ( isSelected
        ? StyleSheet.selected
        : StyleSheet.deselected
        )
    , onMouseOver: forward(address, always(Select))
    , onClick: forward(address, always(Activate))
    }
  , content
  );

const Select = { type: "Select" }
const Activate = { type: "Activate" }

export const view = render
