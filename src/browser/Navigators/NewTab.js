/* @flow */

import * as Navigator from "./Navigator"
import {Effects} from "reflex"
/*::
import type {Action, Flags} from "./Navigator"

export type {Action, Flags}
*/

export class Model {
  /*::
  navigator: Navigator.Model;
  */
  consturtor(navigator/*:Navigator.Model*/) {
    this.navigator = navigator
  }
}

const nofx = /*::<model, action>*/
  (model/*:model*/)/*:[model, Effects<action>]*/ =>
  [model, Effects.none]

export const init =
  (flags/*:Flags*/)/*:[Model, Effects<Action>]*/ => {
    const [navigator, fx] = Navigator.init(flags)
    return [new Model(navigator), fx]
  }

export const update =
  ( model/*:Model*/
  , action/*:Action*/
  )/*:[Model, Effects<Action>]*/ => {
    const [navigator, fx] = Navigator.update(model.navigator, action)
    return [new Model(navigator), fx]
  }

export const select = nofx
export const deselect = nofx
export const close = nofx
