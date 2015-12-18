/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, forward, Effects} from 'reflex';
import * as Unknown from "../common/unknown";
import * as Stopwatch from "../common/stopwatch";
import * as Easing from "eased";
import {cursor, merge, always} from "../common/prelude";
import {Style, StyleSheet} from '../common/style';

export const init = () => [{
  isDark: false,
  isNear: true,
  animation: null,
  display: {
    opacity: 1,
    offset: 0
  },
}, Effects.none];

// Show button detached from sidebar and themed light or dark.
export const asDetach = isDark => ({type: 'Detach', isDark});
// Show button against pinned sidebar.
export const Attach = {type: "Attach"};
export const asMove = (isNear, isDark) => ({type: 'Move', isNear, isDark});

// Request webview create.
export const Click = {type: "Click"};

const Animation = action => ({type: "Animation", action});
const AnimationEnd = always({type: "AnimationEnd"});

const stopwatch = cursor({
  tag: Animation,
  get: model => model.animation,
  set: (model, animation) => merge(model, {animation}),
  update: Stopwatch.step
});

const interpolate = (from, to, progress) => ({
  opacity: Easing.float(from.opacity, to.opacity, progress),
  offset: Easing.float(from.offset, to.offset, progress)
});

// Project eventual destination of animation.
const project = model =>
  model.isNear ?
  {
    opacity: 1,
    offset: 0
  } :
  {
    opacity: 1,
    offset: 8
  };

const animate = (model, action) => {
  const [{animation}, fx] = stopwatch(model, action.action)
  const duration = 500;

  // @TODO: We should not be guessing what is the starnig point
  // that makes no sense & is likely to be incorrect at a times.
  // To fix it we need to ditch this easing library in favor of
  // something that will give us more like spring physics.
  const begin =
    model.isNear ?
    {
      opacity: 1,
      offset: 8
    } :
    {
      opacity: 1,
      offset: 0
    };

  const projection = project(model);

  return duration > animation.elapsed
    ? [ merge(model, {
          animation,
          display: Easing.ease
            ( Easing.easeOutCubic
            , interpolate
            , begin
            , projection
            , duration
            , animation.elapsed
            )
        })
      , fx
      ]
    : [merge(model, {animation, display: projection}), fx.map(AnimationEnd)]
}

const stepMove = (model, action) =>
  action.isNear !== model.isNear ?
    stopwatch(merge(model, {
      isDark: action.isDark,
      isNear: action.isNear
    }), Stopwatch.Start) :
  [model, Effects.none];

export const step = (model, action) =>
    action.type === "Animation"
  ? animate(model, action)
  : action.type === "AnimationEnd"
  ? stopwatch(model, Stopwatch.End)
  : action.type === "Move"
  ? stepMove(model, action)
  : Unknown.step(model, action);

const style = StyleSheet.create({
  button: {
    MozWindowDragging: 'no-drag',
    color: 'rgba(0,0,0,0.8)',
    fontFamily: 'FontAwesome',
    fontSize: '18px',
    lineHeight: '34px',
    position: 'absolute',
    textAlign: 'center',
    bottom: 0,
    right: 0,
    width: '34px',
    height: '34px',
  },

  buttonDark: {
    color: 'rgba(255,255,255,0.8)',
  }
});

export const view = ({isDark, display}, address) =>
  html.div({
    className: 'global-create-tab-icon',
    style: Style(
      style.button,
      isDark && style.buttonDark,
      {
        opacity: display.opacity,
        bottom: `${display.offset}px`, 
        right: `${display.offset}px`
      }
    ),
    onClick: () => address(Click)
  }, ['']);
