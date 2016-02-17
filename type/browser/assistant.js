/* @flow */

import type {Address, VirtualTree} from "reflex/type"
import type {Effects} from "reflex/type/effects"
import type {Tagged} from "../common/prelude"
import * as History from "./assistant/history"
import * as Search from "./assistant/search"

export type Suggestion =
  { match: string
  , hint: ?string
  }

export type Model =
  { isOpen: boolean
  , isExpanded: boolean
  , query: string
  , selected: number
  , history: History.Model
  , search: Search.Model
  }

export type Query =
  (input:string) =>
  Tagged<"Query", string>

export type SelectNext = Tagged<"SelectNext", void>
export type SelectPrevious = Tagged<"SelectPrevious", void>
export type Unselect = Tagged<"Unselect", void>
export type Open = Tagged<"Open", void>
export type Close = Tagged<"Close", void>
export type Expand = Tagged<"Expand", void>
export type Reset = Tagged<"Reset", void>
export type Activate = Tagged<"Activate", void>
export type Trigger = Tagged<"Trigger", void>


export type Action
  = Tagged<"History", History.Action>
  | Tagged<"Search", Search.Action>
  | Tagged<"Query", string>
  | Tagged<"Suggest", Suggestion>
  | Trigger
  | Activate
  | SelectNext
  | SelectPrevious
  | Unselect
  | Open
  | Close
  | Expand
  | Reset


// Creates a search query task, when run completion side effect is
// Result action.
export type query =
  (input:string, limit:number) =>
  Effects<Action>

export type init =
  () =>
  [Model, Effects<Response>]

export type update =
  (model:Model, action:Action) =>
  [Model, Effects<Response>]
