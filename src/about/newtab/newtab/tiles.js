/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {tag} from "../../../common/prelude"
import {Effects, html, thunk, forward} from "reflex"
import {Style, StyleSheet} from "../../../common/style";
import * as Tile from './tile';
// @TODO hard-coded until we get history support in Servo.
import hardcodedTiles from '../tiles.json';
import * as Unknown from "../../../common/unknown";
import {cursor} from "../../../common/cursor";


import type {Address, DOM} from "reflex"
import type {Tagged} from "../../../common/prelude"
import type {Action, Model} from "./tiles"




export const init =
  ()/*:[Model, Effects<Action>]*/ =>
  [ hardcodedTiles
  , Effects.none
  ];

const TileAction = tag('Tile')

export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ =>
  Unknown.update(model, action)

const styleSheet = StyleSheet.create
  ( { tiles:
      { width: '840px'
      // Hardcoded until we get flexbox in Servo
      , height: '480px'
      , overflow: 'hidden'
      , position: 'absolute'
      , left: 'calc(50% - (840px / 2))'
      // Add offset for visual space taken up by location bar
      // Then offset by half of the height of the tiles.
      , top: 'calc(((100% + 60px) / 2) - (480px / 2))'
      }
    }
  );

export const view =
  (model/*:Model*/, address/*:Address<Action>*/, isDark/*:boolean*/)/*:DOM*/ =>
  html.div
  ( { className: 'tiles'
    , style: styleSheet.tiles
    }
  , model.order.map
    ( id =>
      thunk
      ( String(id)
      , Tile.view
      , model.entries[String(id)]
      , forward(address, TileAction)
      , isDark
      )
    )
  );
