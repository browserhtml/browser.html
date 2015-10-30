/* @flow */


import type {Address, VirtualTree, Effects} from "reflex/type"
import type {Time} from "../../common/prelude"
import type {GoBack, GoForward} from "./navigation"

export type Model = {
  isForced: boolean,

  // Value in range of -1 to 1 where negative
  // value is for left tilt and positive for right tilt.
  value: number,

  x: number,
  z: number,
  angle: number,

  releaseDuration: number,
  releaseTime: number
}


export type StartForce = {
  type: "WebView.Motion.StartForce",
  delta: number,
  timeStamp: Time
}

export type StopForce = {
  type: "WebView.Motion.StopForce",
  delta: number,
  timeStamp: Time
}

export type ContinueForce = {
  type: "WebView.Motion.ContinueForce",
  delta: number,
  timeStamp: Time
}

export type Animate = {
  type: "WebView.Motion.Animate",
  timeStamp: Time
}

export type Response
  = Animate
  | GoBack
  | GoForward

export type Action
  = StartForce
  | StopForce
  | ContinueForce
  | Animate

// Model updates on physical interactions
export type move = (model:Model, action:ContinueForce) => Model
export type drag = (model:Model, action:StartForce) => Model
export type release = (model:Model, action:StopForce) => Model

// Model position data is updated on animiation frames.

export type animate = (model:Model, action:Animate) => [Model, Effects<Response>]

export type step = (model:Model, action:Action) => [Model, Effects<Response>]

// Takes model, target view to be rotated and returns a view that wraps target
// into a div which that reports actions to the address and updates model on
// animation frames. Returned div is roteted on animation frames based on
// interaction.
export type view = (model:Model, target:VirtualTree, address:Address<Action>) => VirtualTree
