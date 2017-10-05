/* @flow */

import {html, thunk, forward} from 'reflex'
import * as Style from '../../../../Common/Style'
import {always} from '../../../../Common/Prelude'

import type {Address} from 'reflex'
export type Action =
  | { type: "Click" }

const Click = always({ type: 'Click' })

export const render =
  (address:Address<Action>) =>
  html.button({ className: 'webview-show-tabs-button',
     style: styleSheet.base,
     onClick: forward(address, Click)
    },
   ['\uf0c9']
  )

export const view =
  (address:Address<Action>
  ) =>
  thunk('Browser/NavigatorDeck/Navigator/Header/ShowTabsButton',
   render,
   address
  )

const styleSheet = Style.createSheet({ base:
      { MozWindowDragging: 'no-drag',
       WebkitAppRegion: 'no-drag',
       position: 'absolute',
       height: '30px',
       lineHeight: '30px',
       fontFamily: 'FontAwesome',
       fontSize: '14px',
       right: '0',
       top: '0',
       width: '30px',
       color: 'inherit',
       background: 'transparent',
       cursor: 'pointer'
      }
    }
  )
