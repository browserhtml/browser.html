/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, html} from 'reflex';
import {merge} from '../common/prelude';
import {Style, StyleSheet} from '../common/style';
import {ease, easeOutQuad, float} from 'eased';
import * as Animation from '../common/animation';

/*:: import * as type from "../../type/browser/overlay" */

const visible/*:type.Visible*/ = 0.1;
const invisible/*:type.Invisible*/ = 0;
const duration = 300;

export const shown = {
  opacity: visible,
  isCapturing: true,
  animation: null
};

export const hidden = {
  opacity: invisible,
  isCapturing: false,
  animation: null
};

export const faded = {
  opacity: invisible,
  isCapturing: true,
  animation: null
};

export const Click/*:type.Click*/ = {type: 'Overlay.Click'};

export const asShow/*:type.asShow*/ = time =>
  ({type: 'Overlay.Show', time});

export const asHide/*:type.asHide*/ = time =>
  ({type: 'Overlay.Hide', time});

export const asFade/*:type.asFade*/ = time =>
  ({type: 'Overlay.Fade', time});


export const patch = ({isCapturing, opacity}) => (model, time) => {
  const [animation, fx] = model.opacity === opacity ?
                            [model.animation, Effects.none] :
                          // If not animating start fresh animation.
                          model.animation == null ?
                            Animation.initialize(time, duration) :
                            // If was animating towards opposite opacity then
                            // duration of inverse animation should take as much
                            // time as a duration of animation to get to this opacity.
                            // Also since animation already exists there is
                            // scheduled tick so we don't need to requset new one.
                            [
                              Animation.create(time, model.animation.now -
                                                      model.animation.start),
                              Effects.none
                            ];
  return [merge(model, {isCapturing, opacity, animation}), fx];
};

export const show/*:type.show*/ = patch(shown);
export const hide/*:type.hide*/ = patch(hidden);
export const fade/*:type.fade*/ = patch(faded);
export const tick/*:type.tick*/ = (model, action) => {
  if (action.time >= model.animation.end) {
    return [merge(model, {animation: null}), Effects.none];
  } else {
    const [animation, fx] = Animation.step(model.animation, action);
    return [merge(model, {animation}), fx];
  }
}


export const step/*:type.step*/ = (model, action) =>
  action.type === "Overlay.Show" ?
    show(model, action.time) :
  action.type === "Overlay.Hide" ?
    hide(model, action.time) :
  action.type === "Overlay.Fade" ?
    fade(model, action.time) :
  action.type === "Animation.Tick" ?
    tick(model, action) :
    // We do not handle Animation.End right now but
    // we could though.
    [model, Effects.none];

const style = StyleSheet.create({
  overlay: {
    background: 'rgb(39, 51, 64)',
    position: 'absolute',
    // @WORKAROUND use percent instead of vw/vh to work around
    // https://github.com/servo/servo/issues/8754
    width: '100%',
    height: '100%'
  }
});

const opacity = ({animation, opacity}) =>
  animation == null ?
    opacity :
    ease(easeOutQuad, float,
          opacity === visible ? invisible : visible,
          opacity,
          animation.end - animation.start,
          animation.now - animation.start);

export const view = (model, address, modeStyle) =>
  html.div({
    className: 'overlay',
    style: Style(style.overlay, {
      opacity: opacity(model),
      pointerEvents: model.isCapturing ? 'all' : 'none'
    }),
    onClick: () => address(Click)
  });
