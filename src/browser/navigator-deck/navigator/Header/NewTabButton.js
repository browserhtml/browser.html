/* @flow */

import {html, thunk, forward} from 'reflex'
import * as Style from '../../../../common/style'
import {always} from '../../../../common/prelude'

/*::
import type {Address, DOM} from "reflex"
export type Action =
  | { type: "Click" }
*/

const Click = always({ type: "Click" })

export const render =
  (address:Address<Action>) =>
  html.button
  ( { className: 'new-tab-button'
    , style: styleSheet.base
    , onClick: forward(address, Click)
    }
  , ["\uf067"]
  )

export const view =
  ( address:Address<Action>
  ) =>
  thunk
  ( 'Browser/NavigatorDeck/Navigator/Header/NewTabButton'
  , render
  , address
  )

const styleSheet = Style.createSheet
  ( { base:
      { MozWindowDragging: 'no-drag'
      , WebkitAppRegion: 'no-drag'
      , position: 'absolute'
      , height: '14px'
      , lineHeight: '14px'
      , fontFamily: 'FontAwesome'
      , fontSize: '14px'
      , right: `${14 + 8 + 4}px`
      , top: '7px'
      , width: '14px'
      , color: 'inherit'
      , background: 'transparent'
      , cursor: 'pointer'
      }
    }
  )
