/* @flow */

import type {Address, VirtualTree, Effects} from "reflex/type"
import type {Version, For} from "../common/prelude"
import * as Devtools from "../common/devtools"
import * as Shell from "./shell"
import * as WebView from "./web-view"
import * as Updater from "./updater"
import * as WebViewList from "./web-view-list"
import * as Input from "./input"
import * as Assistant from "./assistant"


export type Model = {
  version: Version,
  shell: Shell.Model,
  updates: Updater.Model,
  webViews: WebViewList.Model,
  input: Input.Model,
  suggestions: Assistant.Model,
  devtools: Devtools.Model
}

export type Action
  = For<"Shell", Shell.Action>
  | For<"Updater", Updater.Action>
  | For<"WebViews", WebViewList.Action>
  | For<"Input", Input.Action>
  | For<"Assistant", Assistant.Action>
  | For<"Devtools", Devtools.Action>

export type Response
  = For<"WebViews", WebViewList.Action>
  | For<"Assistant", Assistant.Response>
  | For<"Devtools", Devtools.Response>

export type view = (model:Model, address:Address<Action>) => VirtualTree
export type step = (model:Model, action:Action) => [Model, Effects<Response>]
