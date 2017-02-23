/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as Unknown from '../Common/Unknown'
import {Effects, forward} from 'reflex'

import type {Address} from 'reflex'

export type Direction =
  | "forward"
  | "backward"
  | "none"

export type Integer = number

export type EditableHTMLElement =
  | HTMLInputElement
  | HTMLTextAreaElement

export class Selection {
  start: Integer;
  end: Integer;
  direction: Direction;
  constructor (start:Integer, end:Integer, direction:Direction) {
    this.start = start
    this.end = end
    this.direction = direction
  }
}

export class Model {
  value: string;
  selection: Selection;
  static empty: Model;
  constructor (value:string, selection:Selection) {
    this.value = value
    this.selection = selection
  }
}
Model.empty = new Model('', new Selection(0, 0, 'none'))

export type Action =
  | { type: "Clear" }
  | { type: "Select", select: Selection }
  | { type: "Change", change: Model }

// Actions

export const Clear = { type: 'Clear' }
export const Select =
  (selection:Selection):Action =>
  ({ type: 'Select',
     select: selection
    }
  )

export const Change =
  (change:Model):Action =>
  ({ type: 'Change',
     change
    }
  )

const select =
  (model:Model, selection:Selection):[Model, Effects<Action>] =>
  [ new Model(model.value, selection),
   Effects.none
  ]

export const change =
  (model:Model, value:string, selection:Selection):[Model, Effects<Action>] =>
  [ new Model(value, selection),
   Effects.none
  ]

export const clear =
  (model:Model):[Model, Effects<Action>] =>
  [ Model.empty,
   Effects.none
  ]

export const init =
  (value:string='', selection:?Selection=null):[Model, Effects<Action>] =>
  [ new Model(value,
     (selection == null
      ? new Selection(value.length, value.length, 'none')
      : selection
      )
    ),
   Effects.none
  ]

export const update =
  (model:Model, action:Action):[Model, Effects<Action>] => {
    switch (action.type) {
      case 'Clear':
        return clear(model)
      case 'Select':
        return select(model, action.select)
      case 'Change':
        return change(model, action.change.value, action.change.selection)
      default:
        return Unknown.update(model, action)
    }
  }

export const onSelect = <event:{target:EditableHTMLElement}>
  (address:Address<Action>):Address<event> =>
  forward(address, decodeSelectEvent)

export const onChange = <event:{target:EditableHTMLElement}>
  (address:Address<Action>):Address<event> =>
  forward(address, decodeChangeEvent)

export const decodeChangeEvent =
  (event:{target:EditableHTMLElement}) =>
  ({ type: 'Change',
     change: new Model(event.target.value,
         readSelection(event.target)
        )
    }
  )

export const decodeSelectEvent =
  (event:{target:EditableHTMLElement}) =>
  ({ type: 'Select',
     select: readSelection(event.target)
    }
  )

export const readChange =
  (value:string, selection:Selection):Model =>
  new Model(value, selection)

export const readSelection =
  (input:EditableHTMLElement) =>
  new Selection(input.selectionStart,
   input.selectionEnd,
   input.selectionDirection || 'none'
  )
