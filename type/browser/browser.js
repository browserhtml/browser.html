/* @flow */

import type {Address, VirtualTree, Effects} from "reflex/type"
import type {Version, For} from "../common/prelude"
import * as Devtools from "../common/devtools"
import * as PerspectiveUI from "./perspective-ui"
import * as Shell from "./shell"
import * as WebView from "./web-view"
import * as Updater from "./updater"
import * as WebViews from "./web-views"
import * as Input from "./input"
import * as Assistant from "./assistant"


export type Model = {
  version: Version,
  mode: PerspectiveUI.Model,
  shell: Shell.Model,
  input: Input.Model,
  suggestions: Assistant.Model,
  webViews: WebViews.Model,

  updates: Updater.Model,
  devtools: Devtools.Model
}

export type Action
  = For<"shell", Shell.Action>
  | For<"updates", Updater.Action>
  | For<"webViews", WebViews.Action>
  | For<"input", Input.Action>
  | For<"suggestions", Assistant.Action>
  | For<"devtools", Devtools.Action>

export type Response
  = For<"webViews", WebViews.Action>
  | For<"suggestions", Assistant.Response>
  | For<"devtools", Devtools.Response>

export type view = (model:Model, address:Address<Action>) => VirtualTree
export type step = (model:Model, action:Action) => [Model, Effects<Response>]
