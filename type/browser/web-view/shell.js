/* @flow */

import * as Focusable from "../../common/focusable"

// Model extends Focusable.Model with isVisible and zoom fields
export type Model
  = Focusable.Model
  & {isVisible: boolean, zoom: number}


export type ZoomIn = {type: "WebView.Shell.ZoomIn"}
export type ZoomOut = {type: "WebView.Shell.ZoomOut"}
export type ResetZoom = {type: "WebView.Shell.ResetZoom"}

export type VisibilityChanged = {
  type: "WebView.Shell.VisibilityChanged",
  value: boolean
}

export type Action
  = Focusable.Action
  | ZoomIn | ZoomOut | ResetZoom
  | VisibilityChanged


export type resetZoom = (model:Model) => Model
export type zoomIn = (model:Model) => Model
export type zoomOut = (model:Model) => Model
export type focus = (model:Model) => Model
export type blur = (model:Model) => Model

export type updateVisibility = (value:boolean, model:Model) => Model

export type update = (model:Model, action:Action) => Model
