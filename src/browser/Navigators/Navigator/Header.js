/* @flow */

import {html, thunk, forward} from 'reflex';
import * as Style from '../../../common/style';
import {always} from '../../../common/prelude';
import * as Title from './Header/Title';
import * as ShowTabsButton from './Header/ShowTabsButton';
import * as NewTabButton from './Header/NewTabButton';
import * as BackButton from './Header/BackButton';
import * as Layer from './Layer';

/*::
import type {Address, DOM} from "reflex"

export type Model = string
export type Action =
  | { type: "EditInput" }
  | { type: "ShowTabs" }
  | { type: "OpenNewTab" }
  | { type: "GoBack" }
*/

const tagTitle = always({ type: "EditInput" });
const tagShowTabs = always({ type: "ShowTabs" });
const tagNewTab = always({ type: "OpenNewTab" });
const tagGoBack = always({ type: "GoBack" });

export const height = Title.outerHeight;

export const render =
  ( title/*:string*/
  , secure/*:boolean*/
  , canGoBack/*:boolean*/
  , address/*:Address<Action>*/
  )/*:DOM*/ =>
  html.header
  ( { className: 'topbar'
    , style: styleSheet.base
    }
  , [ BackButton.view
      ( canGoBack
      , forward(address, tagGoBack)
      )
    , Title.view
      ( title
      , secure
      , forward(address, tagTitle)
      )
    , NewTabButton.view
      ( forward(address, tagNewTab)
      )
    , ShowTabsButton.view
      ( forward(address, tagShowTabs)
      )
    ]
  );

export const view =
  ( title/*:string*/
  , secure/*:boolean*/
  , canGoBack/*:boolean*/
  , address/*:Address<Action>*/
  )/*:DOM*/ =>
  thunk
  ( 'Browser/NavigatorDeck/Navigator/Header'
  , render
  , title
  , secure
  , canGoBack
  , address
  )

const styleSheet = Style.createSheet
  ( { base:
      { position: 'absolute'
      , top: 0
      , left: 0
      , width: '100%'
      , height: `${height}px`
      , color: 'inherit'
      , background: 'inherit'
      , zIndex: Layer.header
      }
    }
  )
