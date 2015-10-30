/* @flow */

import type {Address, VirtualTree, Effects} from "reflex/type"
import type {URI} from "./prelude"

export type PageMatch = {
  type: "History.PageMatch",
  title: ?string,
  uri: URI,
  score: number
}

export type TopHit = {
  type: "History.TopHit",
  title: ?string,
  icon: ?URI,
  uri: URI
}

export type Match
  = TopHit
  | PageMatch

export type QueryResult = {
  type: "History.Result",
  topHit: ?TopHit,
  matches: Array<PageMatch>
}


// Creates a search query task, when run completion side effect is
// Result action.
export type query = (input:string, limit:number) => Effects<QueryResult>
