/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, Task, html, forward, thunk} from "reflex"
import * as Unknown from "../../../../common/unknown"
import {merge, nofx} from "../../../../common/prelude"
import * as Suggestion from "./Suggestion"

import type {DOM, Address} from "reflex"

// WARNING: Flow's handling of polymorphism is little unreliable
// (For details see: https://github.com/facebook/flow/issues/2105)
// There for intuitively NoOp changes like hoisting type usend in
// `{ type: "To" }` or hoisting type parameters of `tagTo` function
// may introduce strange errors that could be hard to pin down, so
// keep that in mind when changing this code.

export type Action <message> =
  | { type: "Reset" }
  | { type: "NoOp" }
  | { type: "Select", select: string }
  | { type: "Deselect", deselect: string }
  | { type: "Activate", activate: string }
  | { type: "To", to: { index: string, message: Suggestion.Action<message> } }


export type Dictionary <key, value> =
  {[key:key]: value}

export class Model <model> {
  index: Array<string>;
  values: Dictionary<string, model>;
  constructor(index:Array<string>, values:Dictionary<string, model>) {
    this.index = index;
    this.values = values;
  }
}

const tagTo =
  (index:string) =>
  <message> (message:Suggestion.Action<message>):Action<message> => {
    switch (message.type) {
      case "Select":
        return { type: "Select", select: index }
      case "Unselect":
        return { type: "Deselect", deselect: index }
      case "Activate":
        return { type: "Activate", activate: index }
      case "Receive":
        return { type: "To", to: { index, message: message } }
      default:
        return { type: "NoOp" }
    }
  }

export const initWith = <message, model>
  ( id:(input:model) => string
  , matches:Array<model>
  ):[Model<model>, Effects<Action<message>>] => {
    const index = []
    const values = {}
    for (let model of matches) {
      const key = id(model)
      index.push(key)
      values[key] = model
    }
    return nofx(new Model(index, values))
  }

export const init = <message, model>
  ():[Model<model>, Effects<Action<message>>] =>
  nofx(new Model([], {}))


export const reset = <message, model>
  ():[Model<model>, Effects<Action<message>>] =>
  nofx(new Model([], {}))

export const query = <message, model>
  ( model:Model<model>
  , query:string
  , isMatch:(query:string, input:model) => boolean
  ):[Model<model>, Effects<Action<message>>] => {
    const index = []
    const values = {}
    for (let key of model.index) {
      const value = model.values[key]
      if (isMatch(query, value)) {
        index.push(key)
        values[key] = value
      }
    }
    return nofx(new Model(index, values))
  }

export const update = <message, model>
  ( update:Suggestion.Update<message, model>
  , model:Model<model>
  , action:Action<message>
  ):[Model<model>, Effects<Action<message>>] => {
    switch (action.type) {
      case "To":
        return receive(update, model, action.to.index, action.to.message)
      case "Select":
        return select(update, model, action.select)
      case "Deselect":
        return deselect(update, model, action.deselect)
      case "Activate":
        return activate(update, model, action.activate)
      default:
        return Unknown.update(model, action)
    }
  }

const delegate = <message, model>
  ( update:Suggestion.Update<message, model>
  , state:Model<model>
  , index:string
  , command:Suggestion.Action<message>
  ):[Model<model>, Effects<Action<message>>] => {
    const value = state.values[index]
    if (value == null) {
      return [state, Effects.perform(Unknown.error(`Item with index ${index} is not found`))]
    }
    else {
      const [next, fx] = Suggestion.update(update, value, command);
      const values = merge(state.values, {[index]: next})
      const model = new Model
        ( state.index
        , values
        )
      return [model, fx.map(tagTo(index))]
    }
  }


const receive = <message, model>
  ( update:Suggestion.Update<message, model>
  , state:Model<model>
  , index:string
  , command:Suggestion.Action<message>
  ):[Model<model>, Effects<Action<message>>] =>
  delegate(update, state, index, command)

const select = <message, model>
  ( update:Suggestion.Update<message, model>
  , state:Model<model>
  , index:string
  ):[Model<model>, Effects<Action<message>>] =>
  delegate(update, state, index, Suggestion.Select)

const deselect = <message, model>
  ( update:Suggestion.Update<message, model>
  , state:Model<model>
  , index:string
  ):[Model<model>, Effects<Action<message>>] =>
  delegate(update, state, index, Suggestion.Deselect)

const activate = <message, model>
  ( update:Suggestion.Update<message, model>
  , state:Model<model>
  , index:string
  ):[Model<model>, Effects<Action<message>>] =>
  delegate(update, state, index, Suggestion.Activate)

export const render = <message, model>
  ( view:(state:model, address:Address<message>) => DOM
  , selected:string
  , model:Model<model>
  , address:Address<Action<message>>
  ):DOM =>
  html.section
  ( { style: {borderColor: 'inherit' } }
  , model
    .index
    .map
    ( (index) =>
      Suggestion.render
      ( view
      , selected === index
      , model.values[index]
      , forward(address, tagTo(index))
      )
    )
  )
