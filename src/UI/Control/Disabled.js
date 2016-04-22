/* @flow */

/*::
export type Model = boolean

export type Action =
  | { type: "Enable" }
  | { type: "Disable" }
*/

export const Enable = { type: "Enable" }
export const Disable = { type: "Disable" }

export const init =
  (disabled/*:boolean*/=false)/*:Model*/ =>
  disabled

export const update =
  ( model/*:Model*/
  , action/*:Action*/
  ) =>
  ( action.type === "Enable"
  ? enable(model)
  : action.type === "Disable"
  ? disable(model)
  : model
  )

export const enable =
  (model/*:Model*/) =>
  true

export const disable =
  (model/*:Model*/) =>
  false
