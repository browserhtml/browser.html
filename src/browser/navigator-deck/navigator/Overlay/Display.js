/* @flow */

import * as Easing from "eased"

/*::
import type {Float} from "../../../../common/prelude"
*/

export class Model {
  /*::
  opacity: Float;
  */
  constructor(opacity/*:Float*/) {
    this.opacity = opacity
  }
}

export const visible = new Model(0.1)
export const invisible = new Model(0)

export const interpolate =
  ( from/*:Model*/
  , to/*:Model*/
  , progress/*:number*/
  )/*:Model*/ =>
  new Model
  ( Easing.float(from.opacity, to.opacity, progress)
  )
