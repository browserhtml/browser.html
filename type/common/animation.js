/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type {Effects} from "reflex/type/effects"
import type {Time} from "../../common/prelude"

export type Model = {
  start: Time,
  now: Time,
  end: Time
}

export type Tick = {
  type: "Animation.Tick"
  time: Time
}

export type End = {
  type: "Animation.End"
}

export type Action
  = Tick
  | End

export type create = (time:Time, duration:Time) => Model

export type initialize = (time:Time, duration:Time) =>
  [Model, Effects<Tick>]

export type step = (model:Model, action:Tick) =>
  [Model, Effects<Action>]

export type progress = (model:Model) => number
