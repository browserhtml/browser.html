/* @flow */

import * as Easing from "eased";

export class Model {
  /*::
  rightOffset: number;
  depth: number;
  */
  constructor(depth/*:number*/, rightOffset/*:number*/=0) {
    this.depth = depth
    this.rightOffset = rightOffset
  }
}



export const normal = new Model(0, 0)
export const shrinked = new Model(0, 50)
export const expose = new Model(-200, 0)
export const exposeShrinked = new Model(-200, 50)

export const interpolate =
  ( from/*:Model*/
  , to/*:Model*/
  , progress/*:number*/
  )/*:Model*/ =>
  new Model
  ( Easing.float(from.depth, to.depth, progress)
  , Easing.float(from.rightOffset, to.rightOffset, progress)
  )
