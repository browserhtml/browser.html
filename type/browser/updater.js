/* @flow */

export type Model = {
  appUpdateAvailable: boolean,
  runtimeUpdateAvailable: boolean
}

export type ApplicationUpdate = {
  type: "Updater.ApplicationUpdate"
}

export type RuntimeUpdate = {
  type: "Updater.RuntimeUpdate"
}

export type Action
  = ApplicationUpdate
  | RuntimeUpdate


export type update = (model:Model, action:Action) => Model
