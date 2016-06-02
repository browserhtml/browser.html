/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as Easing from "eased";

/*::
import type {Integer, Float} from "../../common/prelude"
*/

export class Model {
  /*::
  x: Integer;
  shadow: Float;
  spacing: Integer;
  toolbarOpacity: Float;
  titleOpacity: Float;
  tabWidth: Integer;
  */
  constructor(
    x/*: Integer*/
  , shadow/*: Float*/
  , spacing/*: Integer*/
  , toolbarOpacity/*: Float*/
  , titleOpacity/*: Float*/
  , tabWidth/*: Integer*/
  ) {
    this.x = x
    this.shadow = shadow
    this.spacing = spacing
    this.toolbarOpacity = toolbarOpacity
    this.titleOpacity = titleOpacity
    this.tabWidth = tabWidth
  }
}


export const collapsed = new Model
  ( 550
  , 0.5
  , 16
  , 1
  , 1
  , 288
  )

export const attached = new Model
  ( 270
  , 0
  , 9
  , 0
  , 0
  , 32
  )

export const expanded = new Model
  ( 0
  , 0.5
  , 16
  , 1
  , 1
  , 288
  )

export const interpolate =
  ( from/*:Model*/
  , to/*:Model*/
  , progress/*:Float*/
  )/*:Model*/ =>
  new Model
  ( Easing.float(from.x, to.x, progress)
  , Easing.float(from.shadow, to.shadow, progress)
  , Easing.float(from.spacing, to.spacing, progress)
  , Easing.float(from.toolbarOpacity, to.toolbarOpacity, progress)
  , Easing.float(from.titleOpacity, to.titleOpacity, progress)
  , Easing.float(from.tabWidth, to.tabWidth, progress)
  )
