/* @flow */

/*::
export type Model = boolean

export type Action =
  | { type: "Check" }
  | { type: "Uncheck" }
*/

export const Check = { type: "Check" }
export const Uncheck = { type: "Uncheck" }

export const init =
  (toggle/*:boolean*/=false)/*:Model*/ =>
  toggle

export const update =
  ( model/*:Model*/
  , action/*:Action*/
  )/*:Model*/ =>
  ( action.type === "Check"
  ? check(model)
  : action.type === "Uncheck"
  ? uncheck(model)
  : action.type === "Toggle"
  ? toggle(model)
  : model
  )

export const toggle =
  (model/*:Model*/)/*:Model*/ =>
  !model

export const check =
  (model/*:Model*/)/*:Model*/ =>
  true

export const uncheck =
  (model/*:Model*/)/*:Model*/ =>
  false
