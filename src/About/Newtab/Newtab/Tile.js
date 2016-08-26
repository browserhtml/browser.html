/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, Effects} from "reflex";
import * as Style from "../../../Common/Style";
import * as Unknown from "../../../Common/Unknown";


import type {Address, DOM} from "reflex";

import type {URI} from "../../../Common/Prelude"

export type ID = string
export type {URI}


export type Model =
  { title: string
  , uri: URI
  , src: URI
  }

export type Action =
  | { type: "Open" }


export const init =
  (title:string, uri:URI, src:URI):[Model, Effects<Action>] =>
  [ { title
    , uri
    , src
    }
  , Effects.none
  ]

export const update =
  (model:Model, action:Action):[Model, Effects<Action>] =>
  Unknown.update(model, action)

const styleSheet = Style.createSheet
  ( { tile:
      { cursor: 'pointer'
      , float: 'left'
      , margin: '10px 25px 20px'
      , width: '160px'
      , textDecoration: 'none'
      }
    , image:
      { backgroundColor: '#fff'
      , backgroundSize: 'cover'
      , backgroundPosition: 'center center'
      , border: '1px solid rgba(0,0,0,0.15)'
      , borderRadius: '12px'
      , boxSizing: 'border-box'
      , height: '100px'
      , margin: '0 0 10px'
      , width: '160px'
      }
    , title:
      { fontSize: '14px'
      , fontWeight: 'medium'
      , lineHeight: '20px'
      , overflow: 'hidden'
      , textAlign: 'center'
      , textOverflow: 'ellipsis'
      , whiteSpace: 'nowrap'
      , width: '100%'
      }
    , titleLight:
      { color: 'rgba(0,0,0,0.8)'
      }
    , titleDark:
      { color: 'rgba(255,255,255,0.7)'
      }
    }
  );

export const view =
  (model:Model, address:Address<Action>, isDark:boolean):DOM =>
  html.a
  ( { className: 'tile'
    , style: styleSheet.tile
    , target: '_blank'
    , rel: 'noopener noreferrer'
    , href: model.uri
    }
  , [ html.div
      ( { className: 'tile-image'
        , style: Style.mix
            ( styleSheet.image,
              { backgroundImage: `url(${model.src})`
              }
            )
        }
      )
    , html.div
      ( { className: 'tile-title'
        , style: Style.mix
          ( styleSheet.title
          , ( isDark
            ? styleSheet.titleDark
            : styleSheet.titleLight
            )
          )
        }
      , [ model.title
        ]
      )
    ]
  );
