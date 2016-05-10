/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, html, forward} from "reflex";
import {merge, always} from "../common/prelude";
import {cursor} from "../common/cursor";
import * as Style from "../common/style";
import * as Easing from "eased";
import * as Stopwatch from "../common/stopwatch";
import * as Unknown from "../common/unknown";

/*::
import type {Address, DOM} from "reflex"
import type {Model, Action} from "./overlay"
*/

const visible = 0.1;
const invisible = 0;
const duration = 300;

export const Click/*:() => Action*/ = always({type: "Click"});
export const Show/*:Action*/ = {type: "Show"};
export const Hide/*:Action*/ = {type: "Hide"};
export const Fade/*:Action*/ = {type: "Fade"};

const AnimationAction = action => ({type: "Animation", action});
const Shown = always({type: "Shown"});
const Hidden = always({type: "Hidden"});
const Faded = always({type: "Faded"});


export const init =
  ( isVisible/*:boolean*/
  , isCapturing/*:boolean*/
  )/*:[Model, Effects<Action>]*/ =>
  [ { isCapturing
    , isVisible
    , animation: null
    , display
        : isVisible
        ? {opacity: visible}
        : {opacity: invisible}
    }
  , Effects.none
  ];


const updateStopwatch = cursor({
  tag: AnimationAction,
  get: model => model.animation,
  set: (model, animation) => merge(model, {animation}),
  update: Stopwatch.update
});


const animationUpdate = (model, action) => {
  const [{animation}, fx] = updateStopwatch(model, action.action);

  // @TODO: We should not be guessing what is the starnig point
  // that makes no sense & is likely to be incorrect at a times.
  // To fix it we need to ditch this easing library in favor of
  // something that will give us more like spring physics.
  const [begin, end]
    = model.isVisible
    ? [invisible, visible]
    : [visible, invisible];

  return (animation && duration > animation.elapsed)
    ? [ merge(model, {
          animation,
          display: {
            opacity:
              Easing.ease
              ( Easing.easeOutQuad
              , Easing.float
              , begin
              , end
              , duration
              , animation.elapsed
              )
          }
        })
      , fx
      ]
    : [ merge(model, {animation, display: {opacity: end}})
      , fx.map
          ( model.isVisible
          ? Shown
          : model.isCapturing
          ? Faded
          : Hidden
          )
      ]
}


export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ =>
  ( action.type === "Animation"
  ? animationUpdate(model, action)
  : action.type === "Shown"
  ? updateStopwatch(model, Stopwatch.End)
  : action.type === "Hidden"
  ? updateStopwatch(model, Stopwatch.End)
  : action.type === "Faded"
  ? updateStopwatch(model, Stopwatch.End)
  : action.type === "Show"
  ? ( model.isVisible
    ? [merge(model, {isCapturing: true}), Effects.none]
    : updateStopwatch(merge(model, {isVisible: true, isCapturing: true}),
                Stopwatch.Start)
    )
  : action.type === "Hide"
  ? ( model.isVisible
    ? updateStopwatch(merge(model, {isVisible: false, isCapturing: false}),
                Stopwatch.Start)
    : [merge(model, {isCapturing: false}), Effects.none]
    )
  : action.type === "Fade"
  ? ( model.isVisible
    ? updateStopwatch(merge(model, {isVisible: false, isCapturing: true}),
                Stopwatch.Start)
    : [merge(model, {isCapturing: true}), Effects.none]
    )
  : action.type === "Click"
  ? [model, Effects.none]
  : Unknown.update(model, action)
  );

const style = Style.createSheet({
  overlay: {
    background: 'rgb(0, 0, 0)',
    position: 'absolute',
    width: '100vw',
    height: '100vh'
  },
  capturing: {
    pointerEvents: 'auto'
  },
  passing: {
    pointerEvents: 'none'
  }
});

export const view =
  (model/*:Model*/, address/*:Address<Action>*/)/*:DOM*/ =>
  html.div({
    className: 'overlay',
    style: Style.mix
      ( style.overlay
      , ( model.isCapturing
        ? style.capturing
        : style.passing
        )
      , { opacity: model.display.opacity
        }
      ),
    onClick: forward(address, Click)
  });
