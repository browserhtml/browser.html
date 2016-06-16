/* @flow */

import {html, thunk, forward} from 'reflex'
import * as Style from '../../../../common/style'
import {always} from '../../../../common/prelude'
import * as Title from '../Title'

/*::
import type {Address, DOM} from "reflex"
export type Action =
  | { type: "Click" }
*/

const Click = always({ type: "Click" })

export const render =
  ( isEnabled:boolean
  , address:Address<Action>
  ) =>
  html.button
  ( { className: 'go-back-button'
    , style: Style.mix
      ( styleSheet.base
      , ( isEnabled
        ? styleSheet.enabled
        : styleSheet.disabled
        )
      )
    , onClick: forward(address, Click)
    }
  , ["\uf053"]
  )

export const view =
  ( isEnabled:boolean
  , address:Address<Action>
  ) =>
  thunk
  ( 'Browser/NavigatorDeck/Navigator/Header/BackButton'
  , render
  , isEnabled
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
      , left: '50%'
      , marginLeft: `-${Title.innerWidth / 2 + 14 + 4}px`
      , top: '7px'
      , width: '14px'
      , color: 'inherit'
      , background: 'transparent'
      , cursor: 'pointer'
      }
    , enabled: null
    , disabled:
      { display: 'none' }
    }
  )
