/* @flow */

export type Model = boolean

export type Action =
  | { type: "Activate" }
  | { type: "Deactivate" }

export const Activate = { type: "Activate" }
export const Deactivate = { type: "Deactivate" }

export const init =
  (active:boolean=false):Model =>
  active

export const update =
  ( model:Model
  , action:Action
  ):Model =>
  ( action.type === "Activate"
  ? activate(model)
  : action.type === "Deactivate"
  ? deactivate(model)
  : model
  )

export const activate =
  (model:Model):Model =>
  true

export const deactivate =
  (model:Model):Model =>
  false
