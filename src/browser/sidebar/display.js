/* @flow */

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


export const closed = new Model
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

export const open = new Model
  ( 0
  , 0.5
  , 16
  , 1
  , 1
  , 288
  )
