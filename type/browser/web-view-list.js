/* @flow */

import type {Address, VirtualTree, Effects} from "reflex/type"
import type {ID, URI} from "../common/prelude"
import * as WebView from "./web-view"

export type Model = {
  nextID: ID,
  selected: number,
  active: number,
  entries: Array<WebView.Model>
}

export type ByID = {
  type: "WebViewList.ByID",
  id: ID,
  action: WebView.Action
}

export type ByActive = {
  type: "WebViewList.ByActive",
  action: WebView.Action
}

export type NewWebViewOptions = {
  uri: URI,
  inBackground: boolean,
  name: string,
  features: string
}

export type Open
  = {type: "WebViewList.Open"}
  & NewWebViewOptions

export type CloseActive = {
  type: "WebViewList.CloseActive"
}

export type CloseByID = {
  type: "WebViewList.CloseByID",
  id: ID
}

export type SelectByID = {
  type: "WebViewList.SelectByID",
  id: ID
}

export type ActivateSelected = {
  type: "WebViewList.ActivateSelected"
}

export type ActivateByID = {
  type: "WebViewList.ActivateByID",
  id: ID
}

export type Action
  = ByID | ByActive
  | Open
  | CloseByID | CloseActive
  | SelectByID
  | ActivateSelected | ActivateByID


export type indexByID = (model:Model, id:ID) => number
export type open = (model:Model, options:NewWebViewOptions) => Model

export type closeActive = (model:Model) => Model
export type closeByIndex = (model:Model, index:number) => Model
export type closeByID = (model:Model, id:ID) => Model

export type selectByID = (model:Model, id:ID) => Model

export type activateSelected = (model:Model) => Model
export type activateByID = (model:Model, id:ID) => Model

export type step = (model:Model, action:Action) => [Model, Effects<Action>]
export type stepByID = (model:Model, id:ID, action:WebView.Action) => [Model, Effects<Action>]

export type view = (model:Model, address:Address<Action>) => VirtualTree
