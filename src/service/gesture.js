/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

  'use strict';

  const {Record, Union} = require('../common/typed');

  const Pinch = Record({
    description: 'Pinch gesture'
  });
  exports.Pinch = Pinch;

  const service = address => {

    var delta;

    const checkScale = () => {
      if (delta < -200) {
        address.receive(Pinch());
      }
    }

    document.addEventListener('MozMagnifyGestureStart', (e) => {
      delta = e.delta;
      checkScale();
    }, true);

    document.addEventListener('MozMagnifyGestureUpdate', (e) => {
      delta += e.delta;
      checkScale();
    }, true);

    document.addEventListener('MozMagnifyGesture', (e) => {
      delta += e.delta;
      checkScale();
    }, true);
  };

  exports.service = service;
