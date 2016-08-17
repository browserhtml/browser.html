/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, thunk, forward, Effects} from 'reflex';
import {merge, setIn} from '../../common/prelude';
import {cursor} from '../../common/cursor';
import * as Style from '../../common/style';
import * as Toolbar from './Toolbar';
import * as Tab from './Tab';
import * as Unknown from '../../common/unknown';

import type {Address, DOM} from "reflex"
import type {Model as NavigatorModel} from "../Navigators/Navigator"
import * as Deck from "../../common/Deck"

export type ID = string
export type Context = Tab.Context
export type Model = Deck.Model<NavigatorModel>

export type Action =
  | { type: "Close", id: ID }
  | { type: "Select", id: ID }
  | { type: "Modify"
    , id: ID
    , modify:
      { type: "Tab"
      , tab: Tab.Action
      }
    }

const styleSheet = Style.createSheet({
  base: {
    width: '100%',
    height: `calc(100% - ${Toolbar.height})`,
    // This padding matches title bar height.
    paddingTop: '32px',
    overflowX: 'hidden',
    overflowY: 'auto',
    boxSizing: 'border-box'
  }
});

export const Close =
  (id:ID):Action =>
  ( { type: "Close"
    , id
    }
  );


export const Select =
  (id:ID):Action =>
  ( { type: "Select"
    , id
    }
  );


const ByID =
  id =>
  action =>
  ( action.type === "Close"
  ? Close(id)
  : action.type === "Select"
  ? Select(id)
  : { type: "Modify"
    , id
    , modify:
      { type: "Tab"
      , tab: action
      }
    }
  );


const settings =
  { className: 'sidebar-tabs-scrollbox'
  , style: styleSheet.base
  }

export const render =
  (model:Model, address:Address<Action>, context:Context):DOM =>
  html.div
  ( settings
  , model
    .index
    .map
    ( id =>
      Tab.view
      ( model.cards[id]
      , forward(address, ByID(id))
      , context
      )
    )
  );

export const view =
  (model:Model, address:Address<Action>, context:Context):DOM =>
  thunk
  ( 'Browser/Sidebar/Tabs'
  , render
  , model
  , address
  , context
  )
