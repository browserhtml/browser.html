/* @flow */

import type {Address, VirtualTree, Effects} from "reflex/type"
import * as History from "../common/history"
import * as Search from "../common/search"

export type Model = {
  query: string,
  selected: number,
  
  topHit: ?History.TopHit,
  page: Array<History.PageMatch>,
  search: Array<Search.Match>
}

export type Response
  = History.QueryResult
  | Search.QueryResult


export type Query = {
  type: "Assistant.Query",
  input: string
}

export type SelectRelative = {
  type: "Assistant.SelectRelative",
  offset: 0
}

export type Unselect = {
  type: "Assistant.Unselect",
}

export type Clear = {
  type: "Assistant.Clear"
}

export type Action
  = Response
  | Query
  | SelectRelative
  | Unselect
  | Clear


// Creates a search query task, when run completion side effect is
// Result action.
export type query = (input:string, limit:number) => Effects<Response>


export type step = (model:Model, action:Action) => [Model, Effects<Response>]
