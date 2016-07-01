/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {html, forward, thunk} from "reflex";
import {always} from "../../../../common/prelude";
import {Style, StyleSheet} from '../../../../common/style';


import type {Address, DOM} from "reflex"

export type Action =
  | { type: "Select" }
  | { type: "Activate" }


const styleSheet = StyleSheet.create
  ( { base:
      { lineHeight: '40px'
      , overflow: 'hidden'
      , paddingLeft: '35px'
      , paddingRight: '10px'
      // Contains absolute elements.
      , position: 'relative'
      , whiteSpace: 'nowrap'
      , textOverflow: 'ellipsis'
      , borderLeft: 'none'
      , borderRight: 'none'
      , borderTop: 'none'
      , borderBottom: '1px solid'
      , color: 'inherit'
      , borderColor: 'inherit'
      , marginTop: '1px'
      }
    , unselected:
      { opacity: 0.7
      }
    , selected:
      { background: '#4A90E2'
      , borderRadius: '3px'
      }
    }
  );

export const render =
  (isSelected:boolean, content:Array<DOM>, address:Address<Action>):DOM =>
  html.li
  ( { className: 'assistant suggestion'
    , style: Style
      ( styleSheet.base
      , ( isSelected
        ? styleSheet.selected
        : styleSheet.unselected
        )
      )
    , onMouseOver: forward(address, always(Select))
    , onClick: forward(address, always(Activate))
    }
  , content
  );

const Select = { type: "Select" }
const Activate = { type: "Activate" }

export const view = render
