/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, html, thunk, forward} from "reflex"
import {merge, tagged} from "../../common/prelude"
import {Style, StyleSheet} from "../../common/style";
import * as Unknown from "../../common/unknown";

import hardcodedWallpaper from "../../../wallpaper.json";

export const init = () =>
  [ hardcodedWallpaper
  , Effects.none
  ];

const Choose = {type: 'Choose'};

// Open a tile as webview
const ChooseWallpaper = (id) =>
  ( { type: 'ChooseWallpaper'
    , id
    }
  );

const ChoiceAction = (id, action) =>
  ( action.type === 'Choose'
  ? ChooseWallpaper(id)
  : { type: "Wallpaper"
    , id
    , action
    }
  );

const ByID =
  id =>
  action =>
  ChoiceAction(id, action);

const WallpaperAction = action =>
  ( action.type === "Choose"
  ? action
  : tagged('Wallpaper', action)
  );

export const active = ({entries, active}) =>
  ( entries[active] );

export const update = (model, action) =>
  ( action.type === 'ChooseWallpaper'
  ? [ merge(model, {active: action.id})
    , Effects.none
    ]
  : Unknown.update(model, action)
  );

const styleSheet = StyleSheet.create
  ( { container:
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
    , choice:
      { border: '1px solid rgba(0,0,0,0.15)'
      , cursor: 'pointer'
      , borderRadius: '50%'
      , display: 'inline-block'
      , width: '10px'
      , height: '10px'
      , margin: '0 2px'
      }
    }
  );

const viewChoice = (model, address) =>
  ( html.div
    ( { className: 'wallpaper-choice'
      , onClick: () => address(Choose)
      , style: Style(styleSheet.choice, {backgroundColor: model.color})
      }
    )
  );

export const view = (model, address) =>
  html.div
  ( { className: 'wallpaper'
    , style: styleSheet.container
    }
  , [ html.div
      ( { className: 'wallpaper-inner'
        , style: styleSheet.inner
        }
      , model.order.map
        ( id =>
          thunk
          ( String(id)
          , viewChoice
          , model.entries[String(id)]
          , forward(address, ByID(String(id)))
          )
        )
      )
    ]
  );
