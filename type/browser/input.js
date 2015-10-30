/* @flow */

import * as Editable from "../common/editable"
import * as Focusable from "../common/focusable"

export type Model
  = Editable.Model
  & Focusable.Model


export type Action
  = Editable.Action
  & Focusable.Action
