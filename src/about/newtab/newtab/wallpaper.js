/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, html, thunk, forward} from "reflex"
import {merge, always, tagged} from "../../../common/prelude"
import * as Style from "../../../common/style";
import * as Unknown from "../../../common/unknown";

import hardcodedWallpaper from "../wallpaper.json";


import type {Address, DOM} from "reflex"
import type {Model, Action, URI, Color} from "./wallpaper"


const Choose/*:Action*/ =
  { type: 'Choose'
  };

const styleSheet = Style.createSheet
  ( { base:
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

export const view =
  (model/*:Model*/, address/*:Address<Action>*/)/*:DOM*/ =>
  ( html.div
    ( { className: 'wallpaper-choice'
      , onClick: forward(address, always(Choose))
      , style: Style.mix
        ( styleSheet.base
        , { backgroundColor: model.color
          }
        )
      }
    )
  );
