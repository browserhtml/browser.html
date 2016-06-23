/* @flow */

import * as Easing from "eased";


import type {Float} from "../../../common/prelude"


export class Model {
  
  opacity: Float;
  
  constructor(
    opacity/*:Float*/
  ) {
    this.opacity = opacity
  }
}

export const selected = new Model(1)
export const deselected = new Model(0)
export const closed = new Model(0)

export const interpolate =
  ( from/*:Model*/
  , to/*:Model*/
  , progress/*:Float*/
  )/*:Model*/ =>
  new Model
  ( Easing.float(from.opacity, to.opacity, progress)
  )
