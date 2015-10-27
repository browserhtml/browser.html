/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const React = require('./react');

  class Animation extends React.Component {
    static run(timeStamp) {
      Animation.id = null;
      Animation.frame = null;
      const event = Animation.Event || (Animation.Event = {
        type: 'AnimationFrame',
      });
      event.timeStamp = timeStamp;

      const handlers = Animation.handlers.splice(0);
      const count = handlers.length;
      var index = 0;

      while (index < count) {
        const handler = handlers[index];
        handler.onAnimationFrame(event);
        index  = index + 1;
      }
    }
    static schedule(element) {
      const handlers = Animation.handlers ||
                       (Animation.handlers = []);

      if (handlers.indexOf(element) < 0) {
        handlers.push(element);
      }

      if (!Animation.frame) {
        const node = React.findDOMNode(element);
        const window = node.ownerDocument.defaultView;
        Animation.id = window.requestAnimationFrame(Animation.run);
      }
    }
    constructor(props, context) {
      super(props, context);
      this.onAnimationFrame = this.onAnimationFrame.bind(this);
      this.state = {isPending: false}
    }
    componentDidMount() {
      this.componentDidUpdate();
    }
    componentDidUpdate() {
      if (this.props.isActive) {
        Animation.schedule(this);
      }
    }
    onAnimationFrame(event) {
      if (this.props.onAnimationFrame) {
        event.target = React.findDOMNode(this);
        this.props.onAnimationFrame(event)
      }
    }
    render() {
      return this.props.target
    }
  }

  // Utility for re-rendering `target` on every animation frame. This is useful
  // when components need to react to passed time and not some user event.
  const animate = (target, onAnimationFrame, isActive=true) => {
    if (typeof(onAnimationFrame) != 'function') {
      throw TypeError('animate must be given function as a second argument');
    }

    return React.createElement(Animation, {
      key: target.key, target,
      onAnimationFrame,
      isActive
    });
  }

  exports.animate = animate;
