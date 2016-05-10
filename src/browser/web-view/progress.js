/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*::
import type {Address, DOM} from "reflex"
import type {Time, Float} from "../../common/prelude"

// Implied to be 0.0 - 1.0 range
export type LoadProgress = Float

export type Display =
  { opacity: number
  , x: number
  }

export type Model =
  { updateTime: Time
  , loadStart: Time
  , connectTime: Time
  , loadEnd: Time
  , display: Display
  , ref: Ref.Model
  }


export type Action =
  | { type: "Start", time: Time }
  | { type: "LoadEnd", time: Time }
  | { type: "Connect", time: Time }
  | { type: "Tick", time: Time }
  | { type: "NoOp" }
*/

import {Effects, Task, html} from 'reflex';
import {ease, easeOutQuart, float} from 'eased';
import {StyleSheet, Style} from '../../common/style';
import {merge, always} from '../../common/prelude';
import * as Unknown from '../../common/unknown';
import * as Runtime from '../../common/runtime';
import * as Ref from '../../common/ref';

const second = 1000;

const NoOp = always({ type: "NoOp" })

export const Start =
  (time/*:Time*/)/*:Action*/ =>
  ( { type: "Start"
    , time
    }
  );

export const Connect =
  (time/*:Time*/)/*:Action*/ =>
  ( { type: 'Connect'
    , time
    }
  );

export const LoadEnd =
  (time/*:Time*/)/*:Action*/ =>
  ( { type: "LoadEnd"
    , time
    }
  );

const Tick =
  (time/*:Time*/)/*:Action*/ =>
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

const progressConnecting = ({loadStart, updateTime}) =>
  limitA * curve(updateTime - loadStart, inflectionA);

const progressLoading = model => {
  const {connectTime, updateTime} = model;
  const padding = progressConnecting(model);
  const toFill = limitB - padding;
  return padding + toFill * curve(updateTime - connectTime, inflectionB);
}

const progressLoaded = model => {
  const {loadEnd, updateTime} = model;
  const padding = progressLoading(model);
  const toFill = 1 - padding;
  return padding + toFill * (updateTime - loadEnd) / durationC;
}

export const progress =
  (model/*:Model*/)/*:LoadProgress*/ =>
  ( model.loadEnd > 0
  ? progressLoaded(model)
  : model.connectTime > 0
  ? progressLoading(model)
  : model.loadStart > 0
  ? progressConnecting(model)
  : 0
  );

// Start a new progress cycle.
const start = (model, time) =>
  [ merge
    ( model
    , { loadStart: time
      , loadEnd: null
      , updateTime: time
      , connectTime: null
      , display:
        { opacity: 1
        , x: 0
        }
      }
    )
  , ( Runtime.env.progressbar !== 'standalone'
    ? Effects.perform(Task.requestAnimationFrame().map(Tick))
    : Effects.perform(standalone.loadStart(model.ref, time))
      .map(NoOp)
    )
  ];


const connect = (model, time) =>
  ( [ merge
      ( model
      , { connectTime: time
        , updateTime: time
        }
      )
    , ( Runtime.env.progressbar !== 'standalone'
      ? Effects.none
      : Effects.perform(standalone.connect(model.ref, time))
        .map(NoOp)
      )
    ]
  );

// Invoked on End action and returns model with updated `timeStamp`:
const loadEnd = (model, time) =>
  ( [ merge
      ( model
      , { loadEnd: time
        , updateTime: time
        }
      )
    , ( Runtime.env.progressbar !== 'standalone'
      ? Effects.none
      : Effects.perform(standalone.loadEnd(model.ref, time))
        .map(NoOp)
      )
    ]
  );

// Update the progress and request another tick.
// Returns a new model and a tick effect.
const animate = (model, time) =>
  ( [ merge
      ( model
      , { updateTime: time
        , display:
          { opacity: 1
          , x: progress(model) * 100
          }
        }
      )
    , Effects.perform(Task.requestAnimationFrame().map(Tick))
    ]
  );


const end = (model, time) =>
  ( [ merge
      ( model
      , { loadStart: 0
        , loadEnd: 0
        , updateTime: 0
        , connectTime: 0
        , display:
          { opacity: 0
          , x: 0
          }
        }
      )
    , Effects.none
    ]
  );

const tick = (model, time) =>
  ( model.loadStart === 0
  ? [ model
    , Effects.perform
      ( Unknown.warn(`Received Tick when progress was Idle: https://github.com/servo/servo/issues/10322`)
      ).map(NoOp)
    ]
  : progress(model) < 1
  ? animate(model, time)
  : end(model, time)
  )

export const init =
  ()/*:[Model, Effects<Action>]*/ =>
  [ { loadStart: 0
    , loadEnd: 0
    , updateTime: 0
    , connectTime: 0
    , ref: Ref.create()
    , display:
      { opacity: 0
      , x: 0
      }
    }
  , Effects.none
  ];

export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ => {
    switch (action.type) {
      case "Start":
        return start(model, action.time);
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

const nofx =
  model =>
  [ model
  , Effects.none
  ]


//
const standalone =
  { loadStart:
      (ref, time) =>
      Ref
      .deref(ref)
      .chain(element => new Task((succeed, fail) => {
        const onTick =
          time => {
            // @FlowIgnore
            element.updateTime = time;
            // @FlowIgnore
            if (progress(element) < 1) {
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
        // @FlowIgnore
        const x = progress(element);
        element.style.transform = `translateX(${x * 100 - 100}%)`;
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

        element.style.transform = `translateX(-100%)`;
        element.style.opacity = `0`;
      }
  }

const style = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: '27px',
    height: '4px',
    width: '100%',
    pointerEvents: 'none'
  },
  // This is the angle that we have at the end of the progress bar
  arrow: {
    width: '4px',
    height: '4px',
    position: 'absolute',
    right: '-4px',
  },
});

// @TODO bring back color theme
export const view =
  (model/*:Model*/)/*:DOM*/ =>
  html.div({
    [model.ref.name]: model.ref.value,
    className: 'progressbar',
    style: Style(style.bar, {
      backgroundColor: '#4A90E2',
      transform: `translateX(${(model.display.x) - 100}%)`,
      opacity: model.display.opacity
    }),
  }, [html.div({
    className: 'progressbar-arrow',
    style: Style(style.arrow, {
      backgroundImage: 'linear-gradient(135deg, #4A90E2 50%, transparent 50%)',
    })
  })]);
