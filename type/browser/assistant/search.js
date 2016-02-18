/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type {Task, VirtualTree, Address} from "reflex/type"
import type {Effects} from "reflex/type/effects"
import type {Style} from "../../common/style";
import type {Result} from "../../common/result";
import type {Tagged} from "../../common/prelude";
import * as Title from "./title";
import * as Suggestion from "./suggestion";

type URI = string

export type Action
  = Tagged<"Query", string>
  | Tagged<"Reset", any>
  | Tagged<"SelectNext", void>
  | Tagged<"SelectPrevious", void>
  | Tagged<"Unselect", void>
  | Tagged<"UpdateMatches", Result<Error, Array<Match>>>
  | Tagged<"Abort", number>
  | Tagged<"Terminate", void>

export type Match =
  { uri: URI
  , title: ?string
  }

export type Model =
  { size: number
  , limit: number
  , queryID: 0
  , query: ?string
  , selected: ?number
  , matches: {[key:string]: Match}
  , items: Array<URI>
  }

export type view =
  (model:Model, address:Address<Action>) =>
  VirtualTree

export type search =
  (id:number, input:string, limit:number) =>
  Task<Result<Error, Array<Model>>>

export type init =
  (query:string, limit:number) =>
  [Model, Effects<Action>]

export type update =
  (model:Model, action:Action) =>
  [Model, Effects<Action>]
