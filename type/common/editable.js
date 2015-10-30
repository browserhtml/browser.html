/* @flow */

import * as Focusable from "./focusable"

export type Direction
  = "forward"
  | "backward"
  | "none"

export type Selection = {
  start: number,
  end: number,
  direction: Direction
}

export type Model = {
  selection: Selection,
  value: string
}


export type Select = {
  type: "Editable.Select",
  range: Selection
}

export type Change = {
  type: "Editable.Change",
  value: string,
  selection: Selection
}

export type Action
  = Select
  | Change


export type update = (model:Model, action:Action) => Model
