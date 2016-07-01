/* @flow */

import {html, thunk} from "reflex"
import * as Style from "../../../common/style"
import * as ToggleButton from "../../../UI/ToggleButton"
import type {Address, DOM} from "reflex"
export type Model = ToggleButton.Model
export type Action = ToggleButton.Action


export const init = ToggleButton.init
export const update = ToggleButton.update
export const toggle = ToggleButton.toggle
export const check = ToggleButton.check
export const uncheck = ToggleButton.uncheck
export const fx = ToggleButton.fx

export const render =
  (model:Model, address:Address<Action>):DOM =>
  html.li
  ( null
  , [ ToggleButton.render
      ( styleSheet
      , model
      , address
      )
    ]
  );

export const view =
  (model:Model, address:Address<Action>):DOM =>
  thunk
  ( "Devtools/Record/Menu/Publish"
  , render
  , model
  , address
  );

const styleSheet = Style.createSheet
  ( { base:
      { fontFamily: 'FontAwesome'
      , fontSize: '20px'
      , margin: '5px'
      , color: 'rgba(0,0,0,0.7)'
      , background: 'transparent'
      }
    , checked:
      { color: 'darkblue' }
    , unchecked:
      {}
    }
  );
