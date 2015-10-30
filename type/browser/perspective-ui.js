/* @flow */

import type {Address, VirtualTree, Effects} from "reflex/type"
import type {URI} from "../common/prelude"
import * as WebViewList from "./web-view-list"
import * as Browser from "./browser"

// Application states (or modes rather) are expressed in terms of
// model types (blue nodes from spec diagram)

export type EditWebView
  = {mode: "edit-web-view"}
  & Browser.Model

export type ShowWebView
  = {mode: "show-web-view"}
  & Browser.Model

export type CreateWebView
  = {mode: "create-web-view"}
  & Browser.Model

export type SelectWebView
  = {mode: "select-web-view"}
  & Browser.Model

export type ShowTabs
  = {mode: "show-tabs"}
  & Browser.Model

// Application can be in any of the above state there for it's model is union
// of every mode state.

export type Model
  = EditWebView
  | ShowWebView
  | CreateWebView
  | SelectWebView
  | ShowTabs


// Corresponds to "Esc" nodes in the diagram. This action will be received
// once escape key will be released on the browser root node.
export type Abort = {
  type: "PerspectiveUI.Abort"
}

// Action will be received once user clicks "create tab button" or invokes "Command T"
// key binding.
export type Create = {
  type: "PerspectiveUI.Create"
}

// Action is triggered by:
// - 3D Touch: Pop
// - Click on tabs button
export type ZoomOut = {
  type: "PerspectiveUI.ZoomOut"
}

export type ZoomIn = {
  type: "PerspectiveUI.ZoomIn"
}




// Application mode transitions are expressed in form of functions that take
// application model in one state and return application model in other state
// (green nodes from spec diagram)

// Note: In diagram this is "Hide search" at top left area.
export type abortEdit = (model:EditWebView) => ShowWebView
// Note: In diagram this is "change page and hide search" at top middle area.
export type loadPage = (model:EditWebView, uri:URI) => ShowWebView

// Note: In diagram this is "Hide search" in bottom left corner.
export type abortOpen = (model:CreateWebView) => ShowWebView
// Note: In diagram this is "Change page & hide search" at bottom left area.
export type openPage = (model:CreateWebView, options:WebViewList.NewWebViewOptions) => ShowWebView


export type showTabs = (model:ShowWebView) => ShowTabs
export type selectWebView = (model:ShowWebView) => SelectWebView

export type hideTabs = (model:ShowTabs) => ShowWebView
export type activateTab = (model:ShowTabs) => ShowWebView

export type activateWebView = (model:SelectWebView) => ShowWebView
