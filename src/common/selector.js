/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import type {Integer} from "../common/prelude"


// Returns position that is `offset` by given number from the given `index` if
// total number of items is equal to given `size`. If `loop` is true and offset
// is out of bounds position is calculated by looping. Otherwise last / first
// index is retuned.
export const indexOfOffset =
  ( index/*:Integer*/
  , offset/*:Integer*/
  , size/*:Integer*/
  , loop/*:boolean*/
  )/*:Integer*/ => {
  const position = index + offset;
  if (size === 0) {
    return index
  } else if (loop) {
    const index = position - Math.trunc(position / size) * size
    return index < 0 ? index + size :  index
  } else {
    return Math.min(size - 1, Math.max(0, position))
  }
}
