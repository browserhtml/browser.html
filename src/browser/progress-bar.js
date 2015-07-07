/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {html} = require('reflex');
  const {animate} = require('common/animation');
  const {Record, Union} = require('common/typed');
  const Theme = require('./theme');
  const {StyleSheet, Style} = require('common/style');

  // Model

  const Model = Record({
    loadStarted: 0,
    connected: 0,
    loadEnded: 0,

    value: 0
  });
  exports.Model = Model;

  // Returns `true` if associated web-view is loading a page.
  const isLoading = ({loadStarted, value}) =>
    loadStarted > 0 && value < 1;
  exports.isLoading = isLoading;

  // Returns `true` if associated web-view connected to server.
  const isConnecting = ({loadStarted, connected}) =>
    loadStarted > 0 && connected <= 0;
  exports.isConnecting = isConnecting;


  // Actions

  const LoadProgress = Record({
    id: String,
    timeStamp: Number
  }, 'WebView.Progress.LoadProgress');

  const ProgressChange = Record({
    id: String,
    value: Number
  }, 'WebView.Progress.Change');

  const LoadStart = Record({
    id: String,
    uri: String,
    timeStamp: Number
  }, 'WebView.Progress.LoadStart');

  const LoadEnd = Record({
    id: String,
    uri: String,
    timeStamp: Number
  }, 'WebView.Progress.LoadEnd');


  exports.LoadProgress = LoadProgress;
  exports.LoadStart = LoadStart;
  exports.LoadEnd = LoadEnd;
  exports.Action = Union({LoadProgress, ProgressChange, LoadStart, LoadEnd});


  // Update

  const update = (state, action) =>
    !action ? state :
    action instanceof LoadStart ? state.clear().set('loadStarted', action.timeStamp) :
    action instanceof LoadEnd ? state.set('loadEnded', action.timeStamp) :
    action instanceof ProgressChange ? state.clear().set('value', action.value) :
    // Only update `connected` if web-view is connecting.
    action instanceof LoadProgress ?
      (isConnecting(state) ? state.set('connected', action.timeStamp) :
      state.set('value', computeProgress({
        now: action.timeStamp,
        loadStarted: state.loadStarted,
        connected: state.connected,
        loadEnded: state.loadEnded
      }))) :
    state;
  exports.update = update;


  // Animation parameters:
  const A = 0.2;              // Zone A size (a full progress is equal to '1'
  const B = 0.2;              // Zone B size
  const APivot = 200;         // When to reach ~80% of zone A
  const BPivot = 500;         // When to reach ~80% of zone B
  const CDuration = 200;     // Time it takes to fill zone C
  const Precision = 10000;

  const approach = (tMs, pivoMs) => 2 * Math.atan(tMs / pivoMs) / Math.PI;


   // Progress bar logic:
   // The progressbar is split in 3 zones. Called A, B and C.
   //   Zone A is slowly filled while the browser is connecting to the server.
   //   Zone B is slowly filled while the page is being downloaded.
   //   Zone C is filled once the page has loaded (fast).
   //   Zone A and B get filled slower and slower in a way that they are never
   //   100% filled.
  const computeProgress = ({now, loadStarted, connected, loadEnded}) => {
    // Inverse tangent function: [0 - inf] -> [0 - PI/2]
    // approach: [time, pivot] -> [0 - 1]
    // Pivot value is more or less when the animation seriously starts to slow down

    const a = loadStarted <= 0 ? 0 :
              A * approach(now - loadStarted, APivot);
    const b = connected <= 0 ? 0 :
              B * approach(now - connected, BPivot);
    const c = loadEnded <= 0 ? 0 :
              (1 - a - b) * (now - loadEnded) / CDuration;

    const value = Math.min(1, a + b + c);

    // Adjust a percision to avoid redundunt render cycles.
    return Math.floor(Math.round(value * Precision)) / Precision;
  };

  // Style

  const style = StyleSheet.create({
    base: {
      zIndex: 1,
      display: 'block',
      width: '100%',
      height: 4,
      marginLeft: '-100%',
      position: 'absolute',
      top: 28,
      left: 0,
      backgroundColor: null,
      opacity: null,
      transform: null
    }
  });

  // View

  const startFading = 0.8;    // When does opacity starts decreasing to 0
  const computeOpacity = progress =>
    progress < startFading ? 1 :
    1 - Math.pow((progress - startFading) / (1 - startFading), 1);

  const ProgressUpdate = (id, {timeStamp}) =>
    LoadProgress({id, timeStamp});

  const view = (id, progress, theme, address) => {
    const node = progress && html.div({
      key: 'ProgressBar',
      style: Style(style.base, {
        backgroundColor: theme.progressBar,
        opacity: computeOpacity(progress.value),
        transform: `translateX(${100 * progress.value}%)`
      })
    });

    // If `webView` is loading then animate node with `ProgressChange` actions
    // on every animatation frame.
    return !progress ? null :
           !isLoading(progress) ? node :
           animate(node, address.pass(ProgressUpdate, id));
  };
  exports.view = view;
});
