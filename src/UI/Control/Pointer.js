/* @flow */

export type Model = boolean

export type Action =
  | { type: "Over" }
  | { type: "Out" }

export const Over = { type: "Over" }
export const Out = { type: "Out" }

export const init =
  (isPointerOver:boolean=false):Model =>
  isPointerOver

export const update =
  ( model:Model
  , action:Action
  ):Model =>
  ( action.type === "Over"
  ? over(model)
  : action.type === "Out"
  ? out(model)
  : model
  )

export const over =
  (model:Model):Model =>
  true

export const out =
  (model:Model):Model =>
  false
