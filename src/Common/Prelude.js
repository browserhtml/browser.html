/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, forward} from 'reflex'
import type {Address} from 'reflex'

export type ID = string
export type URI = string
export type Time = number
export type Version = string
export type Integer = number
export type Float = number

export type Tagged <tag, kind>
  = { type: tag
    , source: kind
    }

// Misterious `$Shape` polymorphic type is an experimental flow feature that
// will likely be replaced in the future with something more generally useful.
// Type `$Shape<t>` is the type of the objects which include all or a part of
// the fields of `t` type. In this context this will tell flow to make sure
// that fields of `patch` are type compatible with a corresponding fields of
// a `model`.
export const merge = <model:{}, patch:$Shape<model>>
  (model:model
  , changes:patch
  ):model => {
  let result = model
  for (let key in changes) {
    if (changes.hasOwnProperty(key)) {
      const value = changes[key]

      if (model[key] !== value) {
        if (result === model) {
          result = {}
          for (let key in model) {
            if (model.hasOwnProperty(key)) {
              result[key] = model[key]
            }
          }
        }

        if (value === void (0)) {
          delete result[key]
        } else {
          result[key] = value
        }
      }
    }
  }

  // @FlowIssue: Ok just trust me on this!
  return result
}

export const take = <item>
  (items:Array<item>, n:number):Array<item> =>
  (items.length <= n
  ? items
  : items.slice(0, n)
  )

export const move = <item>
  (items:Array<item>
  , from:number
  , to:number
  ):Array<item> => {
  const count = items.length
  if (from === to) {
    return items
  } else if (from >= count) {
    return items
  } else if (to >= count) {
    return items
  } else {
    const result = items.slice(0)
    const target = result.splice(from, 1)[0]
    result.splice(to, 0, target)
    return result
  }
}

export const remove = <item>
  (items:Array<item>, index:number):Array<item> =>
  (index < 0
  ? items
  : index >= items.length
  ? items
  : index === 0
  ? items.slice(1)
  : index === items.length - 1
  ? items.slice(0, index)
  : items.slice(0, index).concat(items.slice(index + 1))
  )

export const setIn = <item> (items:Array<item>, index:number, item:item):Array<item> => {
  if (items[index] === item) {
    return items
  } else {
    const next = items.slice(0)
    next[index] = item
    return next
  }
}

const Always = {
  toString () {
    return `always(${this.value})`
  }
}

const alwaysSymbol =
  (typeof (Symbol.for) === 'function'
  ? Symbol.for('always')
  : Symbol('always')
  )

// @FlowIssue: #2071
const Null = () => null
// @FlowIssue: #2071
const Void = () => void (0)

export const always = <a> (a:a):(...args:Array<any>) => a => {
  const value = a
  if (value === null) {
    return Null
  } else if (value === void (0)) {
    return Void
  // @FlowIssue: Frow does not know we can access property on all other types.
  } else if (value[alwaysSymbol] != null) {
    return value[alwaysSymbol]
  } else {
    const f = () => value
    f.value = value
    f.toString = Always.toString
    // @FlowIssue: Flow guards against property assignements on primitives, we know they're ignored and it's fine.
    value[alwaysSymbol] = f
    return f
  }
}

// @TODO: Optimze batch by avoiding intermidiate states.
// batch performs a reduction over actions building up a [model, fx]
// pair containing all updates. In the process we create a intermidiate
// model instances that are threaded through updates cycles, there for
// we could implement clojure like `transient(model)` / `persistent(model)`
// that would mark `model` as mutable / immutable allowing `merge` to mutate
// in place if `modlel` is "mutable". `batch` here wolud be able to take
// advantage of these to update same model in place.
export const batch = <model, action>
  (update:(m:model, a:action) => [model, Effects<action>]
  , model:model
  , actions:Array<action>
  ):[model, Effects<action>] => {
  let effects = []
  let index = 0
  const count = actions.length
  while (index < count) {
    const action = actions[index]
    let [state, fx] = update(model, action)
    model = state
    effects.push(fx)
    index = index + 1
  }

  return [model, Effects.batch(effects)]
}

export const tag = <tag:string, kind>
  (tag:tag):(value:kind) => Tagged<tag, kind> =>
  value =>
  ({ type: tag, source: value })

export const tagged = <tag:string, kind>
  (tag:tag, value:kind):Tagged<tag, kind> =>
  ({ type: tag, source: value })

export const mapFX = <model, from, to>
  (f:(input:from) => to
  , [state, fx]:[model, Effects<from>]
  ):[model, Effects<to>] =>
  [state, fx.map(f)]

export const nofx = <model, action>
  (state:model):[model, Effects<action>] =>
  [ state, Effects.none ]

export const appendFX = <model, action>
  (extraFX: Effects<action>
  , [model, fx]:[model, Effects<action>]
  ):[model, Effects<action>] =>
  [model, Effects.batch([fx, extraFX])]

type Port <event, message> =
  (address:Address<message>) =>
  Address<event>

export const anotate = <tagged, message, event>
  (port: Port<event, message>
  , tag: (input:message) => tagged
  ):Port<event, tagged> =>
  (address:Address<tagged>):Address<event> =>
  port(forward(address, tag))

export const port = <input, message>
  (decoder: (incoming:input) => message):Port<input, message> =>
  (address: Address<message>) =>
  forward(address, decoder)
