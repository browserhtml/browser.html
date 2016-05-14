/* @flow */

import {html, thunk, forward} from 'reflex';
import * as Style from '../../../common/style';
import {always} from '../../../common/prelude';
import * as Title from './Header/Title';
import * as ShowTabsButton from './Header/ShowTabsButton';

/*::
import type {Address, DOM} from "reflex"

export type Model = string
export type Action =
  | { type: "EditInput" }
  | { type: "ShowTabs" }
*/

const tagTitle = always({ type: "EditInput" });
const tagShowTabs = always({ type: "ShowTabs" });

export const height = Title.outerHeight;

export const render =
  ( title/*:string*/
  , secure/*:boolean*/
  , address/*:Address<Action>*/
  )/*:DOM*/ =>
  html.header
  ( { className: 'topbar'
    , style: styleSheet.base
    }
  , [ Title.view
      ( title
      , secure
      , forward(address, tagTitle)
      )
    , ShowTabsButton.view
      ( forward(address, tagShowTabs)
      )
    ]
  );

export const view =
  ( title/*:string*/
  , secure/*:boolean*/
  , address/*:Address<Action>*/
  )/*:DOM*/ =>
  thunk
  ( 'Browser/NavigatorDeck/Navigator/Header'
  , render
  , title
  , secure
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
      , zIndex: 12
      }
    }
  )
