/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {
  'use strict';

  const React = require('react');

  class Animation extends React.Component {
    static Frame() {
      Animation.id = null;
      Animation.frame = null;
      const event = Animation.Event || (Animation.Event = {
        type: 'animation-frame'
      });
      event.timeStamp = performance.now();
      return event;
    }
    constructor() {
      React.Component.apply(this, arguments);
      this.onAnimationFrame = this.onAnimationFrame.bind(this);
    }
    componentDidMount() {
      this.componentDidUpdate();
    }
    componentDidUpdate() {
      if (!Animation.frame) {
        const node = React.findDOMNode(this);
        const window = node.ownerDocument.defaultView;
        const request = respond =>
          Animation.id = window.requestAnimationFrame(respond);

        Animation.frame = new Promise(request).then(Animation.Frame);
      }

      Animation.frame.then(this.onAnimationFrame);
    }
    onAnimationFrame(event) {
      if (this.props.onAnimationFrame) {
        this.props.onAnimationFrame(event)
      }
    }
    render() {
      return this.props.target
    }
  }

  // Utitily for re-rendering `target` on eveny animation frame. This is useful
  // when component need to react to passed time and not some user event.
  const animate = (target, onAnimationFrame) =>
    React.createElement(Animation, {
      key: target.key, target,
      onAnimationFrame
    });

  exports.animate = animate;
});
