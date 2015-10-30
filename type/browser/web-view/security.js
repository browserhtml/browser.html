/* @flow */

export type Model = {
  state: string,
  secure: boolean,
  extendedValidation: boolean
}

export type Changed = {
  type: "WebView.Security.Changed",
  state: string,
  extendedValidation: boolean
}

export type Action = Changed

export type initialize = () => Model
export type update = (model:Model, action:Action) => Model
