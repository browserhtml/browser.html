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
  html.button({ className: 'new-tab-button',
     style: styleSheet.base,
     onClick: forward(address, Click)
    },
   ['\uf067']
  )

export const view =
  (address:Address<Action>
  ) =>
  thunk('Browser/NavigatorDeck/Navigator/Header/NewTabButton',
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
       right: '30px',
       top: '0',
       width: '30px',
       color: 'inherit',
       background: 'transparent',
       cursor: 'pointer'
      }
    }
  )
