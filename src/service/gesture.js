/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

  'use strict';

  const {Record} = require('typed-immutable');
  const {LiveReload} = require('../common/runtime');

  const Pinch = Record({
    description: 'Pinch gesture'
  });
  exports.Pinch = Pinch;

  exports.Action = Pinch;

  const service = address => {

    var delta;

    const handler = event => {
      if (event.type === 'MozMagnifyGestureStart') {
        delta = event.delta;
      }

      if (event.type === 'MozMagnifyGestureUpdate') {
        delta += event.delta;
      }

      if (event.type === 'MozMagnifyGesture') {
        delta += event.delta;
      }

      if (delta < -200) {
        address(Pinch());
      }
    }

    document.addEventListener('MozMagnifyGestureStart', handler, true);
    document.addEventListener('MozMagnifyGestureUpdate', handler, true);
    document.addEventListener('MozMagnifyGesture', handler, true);

    return action => {
      if (action instanceof LiveReload) {
        document.removeEventListener('MozMagnifyGestureStart', handler, true);
        document.removeEventListener('MozMagnifyGestureUpdate', handler, true);
        document.removeEventListener('MozMagnifyGesture', handler, true);
      }
    }
  };

  exports.service = service;
