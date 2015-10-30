/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

import {Record, Union, List, Maybe, Any} from 'typed-immutable';
import {GoBack, GoForward} from './web-navigation';
import * as Effects from "reflex";

// Action

export const BeginSwipe = Record({
  description: 'Begin swiping a sheet',
  delta: Number,
  timeStamp: Number
}, 'Sheet.BeginSwipe');

export const EndSwipe = Record({
  description: 'End swiping a sheet',
  timeStamp: Number
}, 'Sheet.EndSwipe')

export const ContinueSwipe = Record({
  description: 'Continue swiping a sheet',
  timeStamp: Number,
  delta: Number
}, 'Sheet.ContinueSwipe');

export const AnimationFrame = Record({
  description: 'Animating a sheet',
  timeStamp: Number
}, 'Sheet.AnimationFrame');

export const Tick = timeStamp => AnimationFrame({timeStamp});

export const Action = Union(BeginSwipe, EndSwipe, ContinueSwipe,
                            AnimationFrame);


// Model

export const Model = Record({
  isForced: Boolean,

  // Tilt progress in range of -1 to 1 where negative
  // value is for left tilt and positive for right tilt.
  value: Number,

  // All these are derived from above value but unlike
  // value are updated on every animation frame for smooth
  // transition.
  x: Number,
  z: Number,
  angle: Number,

  // Duration of release animation in ms.
  releaseDuration: Number,
  // Timestam of when release occured.
  releaseTime: Maybe(Number)
});

export const init = () => Model({
  isForced: false,
  action: null,

  x: 0,
  z: 0,
  angle: 0,
  value: 0,

  releaseDuration: 0,
  releaseTime: null
});




const maxAngle = 15;
const maxZ = -180;
const maxX = 25;
const maxDelta = 0.8;
const maxReleaseAnimationDuration = 300;
const threshold = 0.8;

const clear = (state, _) => state.merge({
  isForced: false,
  action: null,

  x: 0,
  z: 0,
  angle: 0,
  value: 0,

  releaseDuration: 0,
  releaseTime: null
});

// Apply physical force and produce new state.
const force = (state, action) =>
  state.isForced ?
    state.set('value', Math.max(Math.min(action.delta / maxDelta * -1, 1), -1)) :
    state;

// Tilt model according to the applied force.
const tilt = (state, action) =>
  // Is force still being applied then update x, z, and angle & request next
  // animation frame.
  state.isForced ?
    [
      state.merge({
        x: Math.floor(state.value * maxX),
        z: Math.floor(Math.abs(state.value) * maxZ),
        angle: Math.floor(state.value * maxAngle * 10) / 10,
      }),
      Effects.tick(Tick)
    ] :
  // If force is no longer applied and release animation is complete
  // then clear the model and request an appropriate action.
  state.releaseTime + state.releaseDuration <= action.timeStamp ?
    [
      clear(state),
      Math.abs(state.value) < threshold) ?
          Effects.none :
        state.value < 0 ?
          GoBack() :
          GoForward()
    ] :
    // If force isn't applied leave model as is and let css transation do the
    // work.
    [state, Effects.none]
};

// Start a tilting motion.
const drag = (state, action) => state.merge({
  isForced: true,
  isInMotion: true,

  angle: 0, x: 0, z: 0,
  value: 0,

  releaseTime: null,
  releaseDuration: 0
});

// If released passed the threshold provide an action to be triggered
// otherwise just reset fields and compute release animation duration.
const release = (state, action) =>
  state.merge({
    isForced: false,

    angle: 0, x: 0, z: 0,

    releaseTime: action.timeStamp,
    releaseDuration: Math.abs(Math.floor(state.value * maxReleaseAnimationDuration))
  })

const physics = (state, action) =>
  action instanceof BeginSwipe ?
    [drag(state, action), Effects.tick(Tick)] :
  action instanceof EndSwipe ?
    [release(state, action), Effects.none] :
  action instanceof ContinueSwipe ?
    [force(state, action), Effects.none] :
  action instanceof AnimationFrame ?
    tilt(state, action) :
    [state, Effects.none];
