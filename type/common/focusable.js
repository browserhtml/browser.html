/* @flow */

export type Model = {
  isFocused: boolean
}


export type RequestFocus = {
  type: "Focusable.RequestFocus"
}

export type Focus = {
  type: "Focusable.Focus"
}

export type Blur = {
  type: "Focusable.Blur"
}

export type Action
  = RequestFocus
  | Focus
  | Blur

type Focusable = Model


export type focus <Model:Focusable> = (model:Model) => Model
export type blur <Model:Focusable> = (model:Model) => Model
export type update <Model:Focusable> = (model:Model, action:Action) => Model
