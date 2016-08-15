/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, thunk, forward, Effects} from "reflex"
import {port, always, nofx} from "../common/prelude"
import * as Style from '../common/style';
import * as Unknown from "../common/unknown";


import type {Address, DOM} from "reflex"
import type {Rules} from "../common/style"

export class Model {
  url: string;
  constructor(url:string) {
    this.url = url
  }
}


export type Message =
  | { type: "Error" }
  | { type: "Load" }

export const update =
  (model:Model, message:Message):[Model, Effects<Message>] => {
    switch (message.type) {
      case "Error":
        return nofx(model)
      case "Load":
        return nofx(model)
      default:
        return Unknown.update(model, message)
    }
  }


export type StyleSheet = { base: Rules }
export type ContextStyle = Rules

const baseStyleSheet:StyleSheet = Style.createSheet
  ( { base:
      { backgroundSize: 'cover'
      , backgroundPosition: 'center center'
      , backgroundRepeat: 'no-repeat'
      , border: 'none'
      , content: `'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>'`
      }
    }
  );

export const view =
  (key:string, styleSheet:StyleSheet) =>
  (model:Model, address:Address<Message>, contextStyle?:ContextStyle):DOM =>
  html.img
  ( { style: Style.mix
      ( baseStyleSheet.base
      , styleSheet.base
      , { backgroundImage: `url(${model.url})`
        }
        , contextStyle
      )
    , src: model.url
    , onError: onError(address)
    , onLoad: onLoad(address)
    }
  )

export const onError = port(always({type: "Error"}))
export const onLoad = port(always({type: "Load"}))
