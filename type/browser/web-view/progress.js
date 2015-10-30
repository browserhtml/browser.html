/* @flow */

import type {Effects, VirtualTree} from "reflex/type"
import type {Time} from "../../common/prelude"

export type Model = {
  // Updated when load starts.
  loadStartTime: Time,
  // Updated when load ends.
  loadEndTime: Time,
  // Updated on every animation frame while loading.
  updateTime: Time
}


export type Start = {
  type: "WebView.Progress.Start",
  timeStamp: Time
}

export type End = {
  type: "WebView.Progress.End",
  timeStamp: Time
}

export type Change = {
  type: "WebView.Progress.Change",
  timeStamp: Time
}

export type Tick = {
  type: "WebView.Progress.Tick",
  timeStamp: Time
}


export type Response
  = Tick

export type Action
  = Start
  | Change
  | End
  | Tick


export type asStart = (time:Time) => Start
export type asChange = (time:Time) => Change
export type asEnd = (time:Time) => End
export type asTick = (time:Time) => Tick


// Invoked on Start action and returns starting state tick requesting effect:
//  [
//    {
//      loadStart: timeStamp,
//      loadEnd: timeStamp + (10 * second),
//      updateTime: timeStamp
//    },
//    Effects.tick(asTick)
//  ]
export type start = (timeStamp:Time) => [Model, Effects<Response>]

// Invoked on End action and returns model with updated `timeStamp`:
//  [
//    {...model, loadEnd: timeStamp},
//    Effects.none
//  ]
export type end = (timeStamp:Time, model:Model) => [Model, Effects<Response>]


// Invoked on every animation frame after load is started and returns
// [
//    {...model, updateTime: timeStamp},
//    Effects.tick(asTick)
// ]
export type tick = (timeStamp:Time, model:Model) => Model


export type Progress = number // Implied to be 0 - 100 range
// Invoked from the view function and returns calculated progress:
//  ease(bezier(0, 0.5, 0, 0.5),
//        float, 0, 100,
//        model.loadEnd - model.loadStart,
//        model.updateTime)
export type progress = (model:Model) => Progress


export type step = (model:Model, action:Action) => [Model, Effects<Response>]


export type view = (model:Model) => VirtualTree
