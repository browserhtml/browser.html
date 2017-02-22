/* @flow */

import {html, thunk, forward} from 'reflex'
import * as Style from '../../../Common/Style'
import {always} from '../../../Common/Prelude'
import * as Title from './Title'
import * as ShowTabsButton from './Header/ShowTabsButton'
import * as NewTabButton from './Header/NewTabButton'
import * as BackButton from './Header/BackButton'

import type {Address, DOM} from 'reflex'

export type Model = string
export type Action =
  | { type: "ShowTabs" }
  | { type: "OpenNewTab" }
  | { type: "GoBack" }

const tagShowTabs = always({ type: 'ShowTabs' })
const tagNewTab = always({ type: 'OpenNewTab' })
const tagGoBack = always({ type: 'GoBack' })

export const height = Title.outerHeight

export const render =
  (canGoBack:boolean,
   address:Address<Action>
  ):DOM =>
  html.header({ className: 'topbar',
     style: styleSheet.base
    },
   [ BackButton.view(canGoBack,
       forward(address, tagGoBack)
      ),
     NewTabButton.view(forward(address, tagNewTab)
      ),
     ShowTabsButton.view(forward(address, tagShowTabs)
      )
    ]
  )

export const view =
  (canGoBack:boolean,
   address:Address<Action>
  ):DOM =>
  thunk('Browser/NavigatorDeck/Navigator/Header',
   render,
   canGoBack,
   address
  )

const styleSheet = Style.createSheet({ base:
      { position: 'absolute',
       top: 0,
       left: 0,
       width: '100%',
       height: `${height}px`,
       color: 'inherit',
       background: 'inherit'
      }
    }
  )
