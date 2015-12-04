/* @flow */

import type {Address, VirtualTree} from "reflex/type"
import type {Effects} from "reflex/type/effects"
import type {URI, For} from "../common/prelude"
import * as WebViewList from "./web-views"
import * as Browser from "./browser"
import * as Animation from "../common/animation"
import * as Overlay from "../browser/overlay"

// Application states (or modes rather) are expressed in terms of
// model types (blue nodes from spec diagram)

export type State = {
  browser: Browser.Model,
  overlay: Overlay.Model,
  animation: ?Animation.Model
}

export type EditWebView
  = {mode: "edit-web-view"}
  & State


export type ShowWebView
  = {mode: "show-web-view"}
  & State

export type CreateWebView
  = {mode: "create-web-view"}
  & State

export type SelectWebView
  = {mode: "select-web-view"}
  & State

export type ShowTabs
  = {mode: "show-tabs"}
  & State

// Application can be in any of the above state there for it's model is union
// of every mode state.

export type Model
  = EditWebView
  | ShowWebView
  | CreateWebView
  | SelectWebView
  | ShowTabs

export type Action
  = Browser.Action
  | For<"animation", Animation.Action>
  | For<"overlay", Overlay.Action>

export type ActionPredicate = (action:Action) => boolean

export type isInputAction = ActionPredicate
export type isWebViewAction = ActionPredicate
export type isFocusAction = ActionPredicate
export type isAbort = ActionPredicate
export type isSubmit = ActionPredicate
export type isFocusInput = ActionPredicate
export type isKeyDown = ActionPredicate
export type isKeyUp = ActionPredicate
export type isCreateTab = ActionPredicate
export type isShowTabs = ActionPredicate
export type isEscape = ActionPredicate
export type isActivateSelected = ActionPredicate
export type isActivateSelectedWebView = ActionPredicate
export type isFocusWebView = ActionPredicate
export type isActivateWebView = ActionPredicate
export type isEditWebview = ActionPredicate
export type isSelectRelativeWebView = ActionPredicate
export type isSwitchSelectedWebView = ActionPredicate




export type initilize = () => [Model, Effects<Action>]
export type step = (model:Model, action:Action) => [Model, Effects<Action>]

export type View <Model> = (model:Model, address:Address<Action>) => VirtualTree

export type view = View<Model>
export type viewAsEditWebView = View<EditWebView>
export type viewAsShowWebView = View<ShowWebView>
export type viewAsCreateWebView = View<CreateWebView>
export type viewAsSelectWebView = View<SelectWebView>
export type viewAsShowTabs = View<ShowTabs>
