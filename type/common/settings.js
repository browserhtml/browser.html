/* @flow */

import type {Address, VirtualTree, Effects} from "reflex/type"
import type {Result} from "./prelude"

export type Name = string
export type Value
  = number
  | boolean
  | string
  | void

export type Settings = {
  [key:Name]:Value
}

export type Fetched = {
  type: "Settings.Fetched",
  result: Result<string, Settings>
}

export type Updated = {
  type: "Settings.Updated",
  result: Result<string, Settings>
}

export type Changed = {
  type: "Settings.Changed",
  name: Name,
  value: Value
}

export type fetch = (names:Array<Name>) => Effects<Fetched>
export type update = (settings:Settings) => Effects<Updated>
export type notifyChange = (namePattern:string) => Effects<Changed>
