/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {
  const inspect = (f, inspector) => (...input) => {
    let output, error;
    try {
      output = f(...input);
      return output;
    } catch (exception) {
      error = exception;
      throw error;
    } finally {
      inspector(input, output, error);
    }
  }
  exports.inspect = inspect;
});
