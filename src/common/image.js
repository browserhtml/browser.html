/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, thunk, forward, Effects} from 'reflex';
import * as Style from '../common/style';


import type {Address, DOM} from "reflex"
import type {Action, Model, StyleSheet, ContextStyle} from "./image"


const baseStyleSheet:StyleSheet = Style.createSheet
  ( { base:
      { backgroundSize: 'cover'
      , backgroundPosition: 'center center'
      , backgroundRepeat: 'no-repeat'
      , border: 'none'
      }
    }
  );

export const view =
  (key:string, styleSheet:StyleSheet)/*:(model:Model, address:Address<Action>, contextStyle?:ContextStyle) => DOM*/ =>
  ( model:Model
  , address:Address<Action>
  , contextStyle/*?:ContextStyle*/
  ):DOM =>
  html.figure
  ( { style: Style.mix
        ( baseStyleSheet.base
        , styleSheet.base
        , { backgroundImage: `url(${model.uri})`
          }
        , contextStyle
        )
    }
  )
