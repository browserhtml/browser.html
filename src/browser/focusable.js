/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {VirtualAttribute} = require('./element');

  const isFocused = new VirtualAttribute((node, current, past) => {
    if (current != past) {
      if (current) {
        node.focus();
      } else {
        node.blur();
      }
    }
  });

  // Exports:

  exports.isFocused = isFocused;

});
