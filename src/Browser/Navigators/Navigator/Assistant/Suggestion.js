/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, Task, html, forward, thunk} from "reflex"
import * as Unknown from "../../../../Common/Unknown"
import {port, always, mapFX, nofx} from "../../../../Common/Prelude"
import * as StyleSheet from "./Suggestion/StyleSheet"
import type {Address, DOM} from "reflex"

import * as History from "./History"
import * as Search from "./Search"

export type Completion =
  { match: string
  , hint: string
  , query: string
  }

export type Model =
  | { type: "History", history: History.Model }
  | { type: "Search", search: Search.Model }

export type Message =
  | { type: "History", history: History.Message }
  | { type: "Search", search: Search.Message }

export const isSearch =
  (model:Model):boolean =>
  model.type === "Search"

export const isHistory =
  (model:Model):boolean =>
  model.type === "History"

export const toID =
  (model:Model):string => {
    switch (model.type) {
      case "Search":
        return `?${Search.id(model.search)}`
      case "History":
      default:
        return `^${History.id(model.history)}`
    }
  }

export const isMatch =
  (query:string, model:Model):boolean => {
    switch (model.type) {
      case "Search":
        return Search.isMatch(query, model.search)
      case "History":
      default:
        return History.isMatch(query, model.history)
    }
  }

export const completion =
  (query:string, model:Model):Completion => {
    switch (model.type) {
      case "Search":
        return {
          query
        , match: Search.getMatch(query, model.search)
        , hint: Search.getHint(query, model.search)
        }
      case "History":
      default:
        return {
          query
        , match: History.getMatch(query, model.history)
        , hint: History.getHint(query, model.history)
        }
    }
  }

export const update =
  (model:Model, message:Message):[Model, Effects<Message>] => {
    switch (model.type) {
      case "Search":
        return updateSearch(model.search, message)
      case "History":
      default:
        return updateHistory(model.history, message)
    }
  }

const updateHistory =
  (model:History.Model, message:Message) => {
    switch (message.type) {
      case "History":
        const [history, fx] = History.update(model, message.history)
        return [tagHistory(history), fx.map(tagHistory)]
      default:
        return nofx(model)
    }
  }

const updateSearch =
  (model:Search.Model, message:Message) => {
    switch (message.type) {
      case "Search":
        const [search, fx] = Search.update(model, message.search)
        return [tagSearch(history), fx.map(tagSearch)]
      default:
        return nofx(model)
    }
  }

export const view =
  (model:Model, address:Address<Message>):DOM => {
    switch (model.type) {
      case "Search":
        return Search.render(model.search, forward(address, tagSearch))
      case "History":
      default:
        return History.render(model.history, forward(address, tagHistory))
    }
  }

export const tagSearch = <value>
  (search:value):{type: "Search", search:value} =>
  ( { type: "Search"
    , search
    }
  )

export const tagHistory = <value>
  (history:value):{type: "History", history:value} =>
  ( { type: "History"
    , history
    }
  )
