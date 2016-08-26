/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {Effects, Task, html} from 'reflex';
import {ease, easeOutQuart, float} from 'eased';
import * as Style from '../../../Common/Style';
import {always, nofx} from '../../../Common/Prelude';
import * as Unknown from '../../../Common/Unknown';
import * as Runtime from '../../../Common/Runtime';
import * as Ref from '../../../Common/Ref';
import * as PolyfillView from './Progress/PolyfillView';
import * as ProgressView from './Progress/ProgressView';


import type {Address, DOM} from "reflex"
import type {Time, Float} from "../../../Common/Prelude"

// Implied to be 0.0 - 1.0 range
export type LoadProgress = Float
type Percentage = number

export type Display =
  { opacity: number
  , x: number
  }

export type Action =
  | { type: "LoadStart", time: Time }
  | { type: "LoadEnd", time: Time }
  | { type: "Connect", time: Time }
  | { type: "Tick", time: Time }
  | { type: "NoOp" }


const second = 1000;

export class Model {

  ref: Ref.Model;
  value: Percentage;

  updateTime: Time;
  loadStart: Time;
  connectTime: Time;
  loadEnd: Time;

  constructor(
    ref:Ref.Model
  , value:Percentage

  , updateTime:Time
  , loadStart:Time
  , connectTime:Time
  , loadEnd:Time
  ) {
    this.ref = ref
    this.value = value
    this.updateTime = updateTime
    this.loadStart = loadStart
    this.connectTime = connectTime
    this.loadEnd = loadEnd
  }
}

const NoOp = always({ type: "NoOp" })

export const LoadStart =
  (time:Time):Action =>
  ( { type: "LoadStart"
    , time
    }
  );

export const Connect =
  (time:Time):Action =>
  ( { type: 'Connect'
    , time
    }
  );

export const LoadEnd =
  (time:Time):Action =>
  ( { type: "LoadEnd"
    , time
    }
  );

const Tick =
  (time:Time):Action =>
  ( { type: "Tick"
    , time
    }
  );

// Parameters

// Zone A is while connecting (waiting for the server to respond). This can be very fast (especially if server has beeen reached before).
// Zone B is downloading the page and loading it.
// Zone C is when the page is fully loaded and we finish the animation

const limitA = 0.2; // what is the limit for the A zone. It will never reach this point, but tend to it. 1 is 100% of the width
const limitB = 0.7;
const inflectionA = (1 * second); // After how many ms it stops accelerating to slowing approaching the limit
const inflectionB = (2 * second);
const durationC = 200;

const TAU = Math.PI / 2;

const curve = (currentTime, inflectionTime) =>
  (Math.atan((TAU / 2) * (currentTime / inflectionTime)) / TAU);

const progressConnecting =
  (loadStart, updateTime) =>
  limitA * curve(updateTime - loadStart, inflectionA);

const progressLoading =
  (loadStart, connectTime, updateTime) => {
    const padding = progressConnecting(loadStart, connectTime);
    const toFill = limitB - padding;
    return padding + toFill * curve(updateTime - connectTime, inflectionB);
  }

const progressLoaded =
  (loadStart, connectTime, loadEnd, updateTime) => {
    const padding = progressLoading(loadStart, connectTime, updateTime);
    const toFill = 1 - padding;
    return padding + toFill * (updateTime - loadEnd) / durationC;
  }

const progress =
  ( start
  , connect
  , end
  , now
  ):LoadProgress =>
  ( end > 0
  ? progressLoaded(start, connect, end, now)
  : connect > 0
  ? progressLoading(start, connect, now)
  : start > 0
  ? progressConnecting(start, now)
  : 0
  );

// Start a new progress cycle.
export const loadStart =
  ( model:Model
  , time:Time
  ):[Model, Effects<Action>] =>
  [ new Model
    ( model.ref
    , 0
    , time
    , time
    , 0
    , 0
    )
  , ( Runtime.env.progressbar !== 'standalone'
    ? Effects
      .perform(Task.requestAnimationFrame())
      .map(Tick)
    : Effects
      .perform(standalone.loadStart(model.ref, time))
      .map(NoOp)
    )
  ];


export const connect =
  ( model:Model
  , time:Time
  ):[Model, Effects<Action>] =>
  [ new Model
    ( model.ref
    , model.value
    , time
    , model.loadStart
    , time
    , model.loadEnd
    )
  , ( Runtime.env.progressbar !== 'standalone'
    ? Effects.none
    : Effects
      .perform(standalone.connect(model.ref, time))
      .map(NoOp)
    )
  ]

// Invoked on End action and returns model with updated `timeStamp`:
export const loadEnd =
  ( model:Model
  , time:Time
  ):[Model, Effects<Action>] =>
  [ new Model
    ( model.ref
    , model.value
    , time
    , model.loadStart
    , model.connectTime
    , time
    )
  , ( Runtime.env.progressbar !== 'standalone'
    ? Effects.none
    : Effects
      .perform(standalone.loadEnd(model.ref, time))
      .map(NoOp)
    )
  ]

// Update the progress and request another tick.
// Returns a new model and a tick effect.
export const tick =
  ( model:Model
  , time:Time
  ):[Model, Effects<Action>] => {
    if (model.loadStart === 0) {
      const fx =
        Effects
        .perform(Unknown.warn(`Received Tick when progress was Idle: https://github.com/servo/servo/issues/10322`))

      return [ model, fx ]
    }
    else {
      const value = 100 * progress
        ( model.loadStart
        , model.connectTime
        , model.loadEnd
        , time
        )

      const next =
        ( value > 100
        ? new Model
          ( model.ref
          , 0
          , 0
          , 0
          , 0
          , 0
          )
        : new Model
          ( model.ref
          , value
          , time
          , model.loadStart
          , model.connectTime
          , model.loadEnd
          )
        )

      const fx =
        ( next.updateTime > 0
        ? Effects
          .perform(Task.requestAnimationFrame())
          .map(Tick)
        : Effects.none
        )

      return [next, fx]
    }
  }


export const init =
  ():[Model, Effects<Action>] =>
  [ new Model
    ( Ref.create()
    , 0
    , 0
    , 0
    , 0
    , 0
    )
  , Effects.none
  ];

export const update =
  (model:Model, action:Action):[Model, Effects<Action>] => {
    switch (action.type) {
      case "LoadStart":
        return loadStart(model, action.time);
      case "LoadEnd":
        return loadEnd(model, action.time);
      case "Connect":
        return connect(model, action.time);
      case "Tick":
        return tick(model, action.time);
      case "NoOp":
        return nofx(model);
      default:
        return Unknown.update(model, action);
    }
  };

const standalone =
  { loadStart:
      (ref, time) =>
      Ref
      .deref(ref)
      .chain(element => new Task((succeed, fail) => {
        const onTick =
          time => {
            const value = progress
            // @FlowIgnore
            ( element.loadStart
            // @FlowIgnore
            , element.connect
            // @FlowIgnore
            , element.loadEnd
            , time
            )
            // @FlowIgnore
            element.updateTime = time;

            if (value < 1) {
              window.requestAnimationFrame(onTick);
              standalone.drawLoading(element, time);
            }
            else {
              standalone.drawIdle(element, time)
            }
          };


        // @FlowIgnore
        element.loadStart = time;
        // @FlowIgnore
        element.updateTime = time;
        // @FlowIgnore
        element.connectTime = 0;
        // @FlowIgnore
        element.loadEnd = 0;

        window.requestAnimationFrame(onTick);
      }))
  , connect:
      (ref, time) =>
      Ref
      .deref(ref)
      .chain(element => new Task((succeed, fail) => {
        // @FlowIgnore
        element.connectTime = time;
      }))
  , loadEnd:
      (ref, time) =>
      Ref
      .deref(ref)
      .chain(element => new Task((succeed, fail) => {
        // @FlowIgnore
        element.loadEnd = time;
      }))
  , drawLoading:
      (element, time) => {
        const value =
          progress
          // @FlowIgnore
          ( element.loadStart
          // @FlowIgnore
          , element.connect
          // @FlowIgnore
          , element.loadEnd
          // @FlowIgnore
          , element.updateTime
          ) * 100;
        // @FlowIgnore
        element.value = value;
        element.style.transform = `translateX(${value - 100}%)`;
        element.style.opacity = `1`;
      }
  , drawIdle:
      (element, time) => {
        // @FlowIgnore
        element.loadStart = 0;
        // @FlowIgnore
        element.updateTime = 0;
        // @FlowIgnore
        element.connectTime = 0;
        // @FlowIgnore
        element.loadEnd = 0;
        // @FlowIgnore
        element.value = 0;
        element.style.transform = `translateX(-100%)`;
        element.style.opacity = `0`;
      }
  }


export const view =
  (model:Model):DOM =>
  ( Runtime.isServo
  ? PolyfillView.view(model.ref, model.value)
  : ProgressView.view(model.ref, model.value)
  )
