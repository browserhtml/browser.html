/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*::
import * as Match from "./match"
*/

export const escape =
  (input/*:string*/)/*:string*/ =>
  input.replace(/[\.\?\*\+\^\$\|\(\)\{\[\]\\]/g, '\\$&');

export const pattern =
  (input/*:string*/, flags/*:Match.Flags*/="i")/*:RegExp*/ => {
    try {
      return RegExp(input, flags);
    } catch (error) {
      return RegExp(escape(''), flags)
    }
  };

// Calculates the score for use in suggestions from
// a result array `match` of `RegExp#exec`.
export const score =
  ( pattern/*:RegExp*/
  , input/*:string*/
  , base/*:number*/=0.3
  , length/*:number*/=0.25
  )/*:number*/ => {
    const index = 1 - base - length;
    const count = input.length;
    const match = pattern.exec(input);

    const score =
      ( match == null
      ? -1
      : ( base
        + length * Math.sqrt(match[0].length / count)
        + index * (1 - match.index / count)
        )
      );

    return score;
}
