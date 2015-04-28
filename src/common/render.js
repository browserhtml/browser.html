/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function(require, exports, module) {

  'use strict';

  const React = require('react');

  class Renderer {
    constructor(component, target, initial=null) {
      this.component = component;
      this.target = target;
      this.step = this.step.bind(this);
      this.state = initial;
    }
    step(transform) {
      this.state = transform(this.state);

      if (this.debug) {
        this.debug(this.state);
      }

      // This schedules another render.
      this.schedule();

      return this.state;
    }
    // Currently render is run as soon as scheduled, although
    // there is no reason why it could not be done on animation
    // frame instead.
    schedule() {
      this.render();
    }
    render() {
      React.render(this.component(this.state, {step: this.step}), this.target);

      return this;
    }
  }

  const render = (component, initial, target) =>
    new Renderer(component, target, initial).render()


  // Exports:

  exports.Renderer = Renderer;
  exports.render = render;

});
