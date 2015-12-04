/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import type {VirtualTree} from "reflex/type"
import type {Effects} from "reflex/type/effects"
import type {Time} from "../common/prelude"
import type {Animation} from "../common/animation"

export type Visible = 0.1
export type Invisible = 0

export type Model = {
  opacity: Visible | Invisible,
  isCapturing: boolean,
  animation: ?Animation
}

export type Show = {type: "Overlay.Show", time: Time}
export type Hide = {type: "Overlay.Hide", time: Time}
export type Fade = {type: "Overlay.Fade", time: Time}
export type Click = {type: "Overlay.Click"}

export type asShow = (time:Time) => Show
export type asHide = (time:Time) => Hide
export type asFade = (time:Time) => Fade

export type Action
  = Show
  | Hide
  | Fade
  | Animation.Tick | Animation.End

export type Effect
  = Effects<Animation.Tick | Animation.End>

export type show = (model:Model, time:Time) =>
  [Model, Effect]

export type hide = (model:Model, time:Time) =>
  [Model, Effect]

export type fade = (model:Model, time:Time) =>
  [Model, Effect]

export type tick = (model:Model, action:Animation.Tick) =>
  [Model, Effect]

export type step = (model:Model, action:Action) =>
  [Model, Effect]
