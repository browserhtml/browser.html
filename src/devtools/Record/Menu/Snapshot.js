/* @flow */

import {html, thunk} from "reflex"
import * as Style from "../../../common/style"
import * as Button from "../../../UI/Button"

/*::
import type {Address, DOM} from "reflex"
export type Model = Button.Model
export type Action = Button.Action
*/

export const init = Button.init
export const update = Button.update
export const press = Button.press
export const release = Button.release
export const fx = Button.fx

export const render =
  (model/*:Model*/, address/*:Address<Action>*/)/*:DOM*/ =>
  html.li
  ( null
  , [ Button.render
      ( styleSheet
      , model
      , address
      )
    ]
  );

export const view =
  (model/*:Model*/, address/*:Address<Action>*/)/*:DOM*/ =>
  thunk
  ( "Devtools/Record/Menu/SnapshotButton"
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
    , active:
      { color: 'green' }
    }
  );
