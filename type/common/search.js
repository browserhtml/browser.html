/* @flow */

import type {Address, VirtualTree, Effects} from "reflex/type"
import type {URI} from "./prelude"


export type Match = {
  type: "Search.Match",
  title: ?string,
  uri: URI
}

export type QueryResult = {
  type: "Search.Result",
  matches: Array<Match>
}

// Creates a search query task, when run completion side effect is
// Result action.
export type query = (input:string, limit:number) => Effects<QueryResult>
