/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Progress bar logic:
 * The progressbar is split in 3 zones. Called A, B and C.
 *   Zone A is slowly filled while the browser is connecting to the server.
 *   Zone B is slowly filled while the page is being downloaded.
 *   Zone C is filled once the page has loaded (fast).
 * Zone A and B get filled slower and slower in a way that they are never 100% filled.
 */

define((require, exports, module) => {

  'use strict';

  const {Element, Field} = require('./element');
  const Component = require('omniscient');

  const ProgressBarElement = Element('div', {
    progressBarColor: Field((node, current, past) => {
      if (current != past) {
        node.style.setProperty('--progressbar-color', current);
      }
    }),
  });

  const PI = 3.1416; // > PI

  // Animation parameters:
  const A = 0.2;              // Zone A size (a full progress is equal to '1'
  const B = 0.3;              // Zone B size
  const APivot = 200;         // When to reach ~80% of zone A
  const BPivot = 500;         // When to reach ~80% of zone B
  const CSpeed = 0.002;       // Speed to fill zone C (how fast we reach '1')
  const StartFading = 0.8;    // When does opacity starts decreasing to 0

  // Inverse tangent function: [0 - inf] -> [0 - PI/2]
  // ApproachFunc: [time, pivot] -> [0 - 1]
  // Pivot value is more or less when the animation seriously starts to slow down
  const ApproachFunc = (tMs, pivoMs) => 2 * Math.atan(tMs / pivoMs) / PI;

  // rfa and before are global and not associated to any state. They are used
  // to drive the progressbar animation. There's only one animation to play
  // at the same time.
  let rfa = -1;
  let before = 0;

  const ProgressBar = Component([{
    step(now) {
      const viewer = this.props.webViewerCursor;

      let progress; // value between 0 and 1

      if (viewer.get('isLoading')) {                                            // Zone A
        const startLoadingTime = viewer.get('startLoadingTime');
        if (viewer.get('isConnecting')) {
          progress = A * ApproachFunc(now - startLoadingTime, APivot);
        } else {                                                                // Zone B
          const connectedAt = viewer.get('connectedAt');
          const A_offset = A * ApproachFunc(connectedAt - startLoadingTime, APivot);
          progress = A_offset + B * ApproachFunc(now - connectedAt, BPivot);
        }
      } else {                                                                  // Zone C
        let lastProgress = viewer.get('progress');
        if (lastProgress < 1) {
          progress = lastProgress + (now - before) * CSpeed;
        } else {
          progress = 1;
        }
      }

      progress = Math.min(1, progress);
      if (progress < 1) {
        rfa = requestAnimationFrame(now => this.step(now));
      } else {
        rfa = -1;
      }
      before = now;
      this.props.webViewerCursor = viewer.merge({progress});
    },
    componentDidUpdate() {
      if (this.props.webViewerCursor.get('progress') < 1) {
        if (rfa < 0) {
          rfa = requestAnimationFrame(now => this.step(now));
        }
      } else {
        cancelAnimationFrame(rfa);
        rfa = -1;
      }
    }
  }], ({key, webViewerCursor, theme}) => {
    const progress = webViewerCursor.get('progress');
    const translateX = 500 * (progress - 1);
    const opacity = progress < StartFading  ? 1 : 1 - Math.pow( (progress - StartFading) / (1 - StartFading), 1);
    return ProgressBarElement({
      key,
      className: 'progressbar',
      progressBarColor: theme.progressbar.color,
      style: {
        transform: `translateX(${translateX}px)`,
        opacity: opacity
      }});
  })


  // Exports:

  exports.ProgressBar = ProgressBar;

});
