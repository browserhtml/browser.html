/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, Task, html, forward, thunk} from "reflex";
import * as Suggestion from "./Suggestion"
import * as Icon from "./Suggestion/Icon"
import * as Title from "./Suggestion/Title"
import * as Unknown from "../../../../common/unknown"
import {nofx} from "../../../../common/prelude"
import type {Address, DOM} from "reflex"
export type URL = string

export class Model {
  url: URL;
  title: string;
  constructor(url:URL, title:string) {
    this.url = url
    this.title = title
  }
}

export const id =
  (model:Model):string =>
  model.url

export const isMatch =
  (query:string, model:Model):boolean =>
  model.title.toLowerCase().startsWith(query.toLowerCase())

export const getMatch =
  (query:string, model:Model):string =>
  model.title

export const getHint =
  (query:string, model:Model):string =>
  ""

export type Message =
  | { type: "NoOp" }
  | { type: "Select" }
  | { type: "Deselect" }
  | { type: "Activate" }

export const update =
  (model:Model, action:Message) => {
    switch (action.type) {
      case 'Select':
        return select(model)
      case 'Deselect':
        return deselect(model)
      case 'Activate':
        return activate(model)
      case 'NoOp':
        return nofx(model)
      default:
        return Unknown.update(model, action)
    }
  }

const select = nofx
const deselect = nofx
const activate = nofx

export const render =
  (model:Model, address:Address<Message>) =>
  html.div
  ( null
  , [ Icon.view('\uf002')
    , Title.view(model.title)
    ]
  )

export const view =
  (model:Model, address:Address<Message>) =>
  thunk
  ( 'Search'
  , render
  , model
  , address
  )
