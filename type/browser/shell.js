/* @flow */

import * as Focusable from "../common/focusable"
import * as Hoverable from "../common/focusable"

export type Model
  = Focusable.Model
  & Hoverable.Model

export type Action
  = Focusable.Action
  | Hoverable.Action
