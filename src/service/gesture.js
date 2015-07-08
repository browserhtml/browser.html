/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const Input = require('browser/web-input');

  const service = address => {

    var delta;
    var refSize;

    const checkScale = () => {
      const scale = (refSize + delta) / refSize;
      if (delta < 0 && scale < 0.5) {
        address.receive(Input.Action.Enter({id:"@selected"}));
      }
      if (delta > 0) {
        address.receive(Input.Action.Blur({id:"@selected"}));
      }
    }

    document.body.addEventListener('MozMagnifyGestureStart', (e) => {
      refSize = window.innerWidth / 2;
      delta = e.delta;
      checkScale();
    }, true);

    document.body.addEventListener('MozMagnifyGestureUpdate', (e) => {
      delta += e.delta;
      checkScale();
    }, true);

    document.body.addEventListener('MozMagnifyGesture', (e) => {
      delta += e.delta;
      checkScale();
    }, true);
  };

  exports.service = service;
});
