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

  const {DOM} = require('react');
  const Component = require('omniscient');

  // Animation parameters:
  const A = 0.2;              // Zone A size (a full progress is equal to '1'
  const B = 0.2;              // Zone B size
  const APivot = 200;         // When to reach ~80% of zone A
  const BPivot = 500;         // When to reach ~80% of zone B
  const CDuration = 200;     // Time it takes to fill zone C
  const ApproachFunc = (tMs, pivoMs) => 2 * Math.atan(tMs / pivoMs) / Math.PI;

  function ComputeProgress(viewer) {
    // Inverse tangent function: [0 - inf] -> [0 - PI/2]
    // ApproachFunc: [time, pivot] -> [0 - 1]
    // Pivot value is more or less when the animation seriously starts to slow down
    let progress = 0; // value between 0 and 1

    let now = performance.now();

    if (viewer.get('readyState')) { // Not an empty viewer
      // Zone A
      const startLoadingTime = viewer.get('startLoadingTime');
      progress = A * ApproachFunc(now - startLoadingTime, APivot);

      if (!viewer.get('isConnecting')) {
        // Zone B
        const connectedTime = viewer.get('connectedTime');
        progress += B * ApproachFunc(now - connectedTime, BPivot);
        if (!viewer.get('isLoading')) {
          // Zone C
          const endLoadingTime = viewer.get('endLoadingTime');
          const C = (1 - progress);
          progress +=  C * (now - endLoadingTime) / CDuration;
        }
      }
    }
    return Math.min(1, progress);
  }

  const resetRfa = rfa => rfa.set('id', -1);

  const ProgressBar = Component([{
    step() {
      let id = requestAnimationFrame(() => this.step());
      this.props.statics.editRfa(rfa => rfa.set('id', id));
    },
    componentDidUpdate() {
      const viewer = this.props.webView;
      if (!viewer.get('readyState')) {
        // No empty web view
        this.stopRFALoop();
      } else if (!viewer.get('isLoading')) {
        // Stop if loaded and had enough time to draw the final animation
        const endLoadingTime = viewer.get('endLoadingTime');
        if ((performance.now() - endLoadingTime) > CDuration) {
          this.stopRFALoop();
        }
      }
      // Start if loading.
      if (viewer.get('isLoading')) {
        this.startRFALoopIfNeeded();
      }
    },
    startRFALoopIfNeeded() {
      if (this.props.rfa.get('id') == -1) {
        this.step();
      }
    },
    stopRFALoop() {
      if (this.props.rfa.get('id') != -1) {
        cancelAnimationFrame(this.props.rfa.get('id'));
        this.props.statics.editRfa(resetRfa);
      }
    },
    componentDidMount() {
      this.stopRFALoop(); // force rfa to be set to -1 (rfa value is restored by session restor)
      this.startRFALoopIfNeeded();
    },
  }], ({key, webView, theme}) => {
    const progress = ComputeProgress(webView);
    const StartFading = 0.8;    // When does opacity starts decreasing to 0
    const percentProgress = 100 * progress;
    const opacity = progress < StartFading  ? 1 : 1 - Math.pow((progress - StartFading) / (1 - StartFading), 1);
    return DOM.div({
      key,
      style: {
        zIndex: 99,
        display: 'block',
        width: '100%',
        height: 3,
        marginLeft: '-100%',
        position: 'absolute',
        top: 50,
        left: 0,
        backgroundColor: theme.progressbar.color,
        transform: `translateX(${percentProgress}%)`,
        opacity: opacity
      }
    });
  })


  // Exports:

  exports.ProgressBar = ProgressBar;

});
