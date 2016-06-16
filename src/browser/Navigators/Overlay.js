/* @flow */

import {always} from "../../common/prelude"
import * as Style from "../../common/style"
import {html, forward, thunk} from "reflex"

/*::
import type {Address, DOM} from "reflex"

export type Action =
  | { type: "Click" }
*/

const Click = always({ type: "Click" })

export const render =
  ( isOpen/*:boolean*/
  , address/*:Address<Action>*/
  )/*:DOM*/ =>
  html.button
  ( { className: "overlay"
    , style: Style.mix
      ( styleSheet.base
      , ( isOpen
        ? styleSheet.open
        : styleSheet.closed
        )
      )
    , onMouseDown: forward(address, Click)
    }
  )

export const view =
  ( isOpen/*:boolean*/
  , address/*:Address<Action>*/
  )/*:DOM*/ =>
  thunk
  ( "Browser/NavigatorDeck/Overlay"
  , render
  , isOpen
  , address
  )

const styleSheet = Style.createSheet
  ( { base:
      { position: "absolute"
      , width: "100%"
      , height: "100%"
      , top: 0
      , left: 0
      , zIndex: "20"
      , opacity: 0
      }
    , open:
      { pointerEvents: "auto"
      }
    , closed:
      { pointerEvents: "none"
      }
    }
  )
