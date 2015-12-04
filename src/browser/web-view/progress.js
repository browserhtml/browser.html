/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*:: import * as type from "../../type/browser/web-view/progress" */

import {Effects, html} from 'reflex';
import {ease, easeOutQuart, float} from 'eased';
import {StyleSheet, Style} from '../../common/style';
import {merge} from '../../common/prelude';

const second = 1000;

export const asStart/*:type.asStart*/ = (time) => ({
  type: "WebView.Progress.Start",
  timeStamp: time,
});

// @TODO Is change supposed to be connected to http progress events from
// the browser? In this case would it modify the loadEnd estimate in the model?
export const asChange/*:type.asChange*/ = (time) => ({
  type: "WebView.Progress.Change",
  timeStamp: time,
});

export const asEnd/*:type.asEnd*/ = (time) => ({
  type: "WebView.Progress.End",
  timeStamp: time,
});

export const asTick/*:type.asTick*/ = (time) => ({
  type: "WebView.Progress.Tick",
  timeStamp: time,
});

// Start a new progress cycle.
export const start/*:type.start*/ = (timeStamp) => [
  {
    loadStart: timeStamp,
    // Predict a 5s load if we don't know.
    loadEnd: timeStamp + (7 * second),
    updateTime: timeStamp
  },
  Effects.tick(asTick)
];

// Invoked on End action and returns model with updated `timeStamp`:
//  [
//    {...model, loadEnd: timeStamp},
//    Effects.none
//  ]
export const end = (timeStamp, model) =>
  // It maybe that our estimated load time was naive and we finished load
  // animation before we received loadEnd. In such case we update both `loadEnd`
  // & `updateTime` so that load progress will remain complete. Otherwise we
  // update `loadEnd` with `timeStamp + 500` to make progressbar sprint to the
  // end in next 500ms.
  model.loadEnd > model.updateTime ?
    [merge(model, {loadEnd: timeStamp + 500}), Effects.none] :
    [merge(model, {loadEnd: timeStamp + 500,
                   updateTime: timeStamp + 500}), Effects.none];

// Update the progress and request another tick.
// Returns a new model and a tick effect.
export const tick/*:type.tick*/ = (timeStamp, model) =>
  model.loadEnd > timeStamp ?
    [merge(model, {updateTime: timeStamp}), Effects.tick(asTick)] :
    [merge(model, {updateTime: timeStamp}), Effects.none];

export const step = (model, action) =>
  action.type === 'WebView.Progress.Start' ?
    start(action.timeStamp) :
  action.type === 'WebView.Progress.End' ?
    end(action.timeStamp, model) :
  action.type === 'WebView.Progress.Tick' ?
    tick(action.timeStamp, model) :
  [model, Effects.none];

export const progress/*:type.progress*/ = (model) =>
  model ?
    ease(easeOutQuart, float, 0, 100,
      model.loadEnd - model.loadStart, model.updateTime - model.loadStart) : 0;

const style = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: '27px',
    height: '4px',
    width: '100%'
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
export const view/*:type.view*/ = (model) =>
  html.div({
    className: 'progressbar',
    style: Style(style.bar, {
      backgroundColor: '#4A90E2',
      // @TODO this progress treatment is extremely naive and ugly. Fix it.
      transform: `translateX(${-100 + progress(model)}%)`,
      visibility: progress(model) < 100 ? 'visible' : 'hidden'
    }),
  }, [html.div({
    className: 'progressbar-arrow',
    style: Style(style.arrow, {
      backgroundImage: 'linear-gradient(135deg, #4A90E2 50%, transparent 50%)',
    })
  })]);
