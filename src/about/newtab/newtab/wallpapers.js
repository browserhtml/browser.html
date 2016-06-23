/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, html, thunk, forward} from "reflex"
import {merge, tagged} from "../../../common/prelude"
import {Style, StyleSheet} from "../../../common/style";
import * as Unknown from "../../../common/unknown";

import hardcodedWallpaper from "../wallpaper.json";
import * as Wallpaper from "./wallpaper";


import type {Address, DOM} from "reflex"
import type {Model, Action, ID} from "./wallpapers"


export const init =
  ()/*:[Model, Effects<Action>]*/ =>
  [ hardcodedWallpaper
  , Effects.none
  ];


const ByID =
  id =>
  action =>
  WallpaperAction(id, action);

const WallpaperAction =
  (id, action) =>
  ( action.type === 'Choose'
  ? Choose(id)
  : { type: "Wallpaper"
    , id
    , action
    }
  )

const Choose =
  id =>
  ( { type: "ChooseWallpaper"
    , id
    }
  )


const notFound =
  { src: null
  , color: '#fff'
  , isDark: false
  }

export const active =
  ({entries, active}/*:Model*/)/*:Wallpaper.Model*/ =>
  ( entries[active] || notFound )

export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ =>
  ( action.type === 'ChooseWallpaper'
  ? [ merge(model, {active: action.id})
    , Effects.none
    ]
  : Unknown.update(model, action)
  );

const styleSheet = StyleSheet.create
  ( { base:
      { display: 'block'
      , color: '#999'
      , fontSize: '12px'
      , lineHeight: '20px'
      , position: 'absolute'
      , bottom: '10px'
      , left: 0
      , textAlign: 'center'
      , width: '100%'
      }
    , inner:
      {}
    }
  );

export const view =
  (model/*:Model*/, address/*:Address<Action>*/)/*:DOM*/ =>
  html.div
  ( { className: 'wallpaper'
    , style: styleSheet.base
    }
  , [ html.div
      ( { className: 'wallpaper-inner'
        , style: styleSheet.inner
        }
      , model.order.map
        ( id =>
          thunk
          ( String(id)
          , Wallpaper.view
          , model.entries[id]
          , forward(address, ByID(String(id)))
          )
        )
      )
    ]
  );
