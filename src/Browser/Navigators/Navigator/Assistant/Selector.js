/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, thunk, forward} from 'reflex'
import type {Address, DOM} from 'reflex'
import * as Style from '../../../../Common/Style'

// This module helps you create selectors similar to HTML `<select>` but without
// restrictions of `<select>` and `<option>` and in particular to the way they
// are displayed. The crucial feature is that it lets you own your data
// separately and keep it in whatever format is best for you. This way you are
// free to change your data without worrying about the table
// “getting out of sync” with the data. Having a single source of truth is
// pretty great!

// ## Configuration

// Function is used to create a `Configuration` for your selectors `view`
// function. It contains details on how you want to render your options,
// how seleced / deselected options should be styled etc...

export const configure = <option, outerMessage, innerMessage>
  (settings:Configuration<option, outerMessage, innerMessage>):Configuration<option, outerMessage, innerMessage> =>
  settings

// You must provide the following information to configure selector:
export type Configuration <option, outerMessage, innerMessage> =
  // Turn an `option` into unique `ID`, so we can efficiently figure out updates.
  { toID: (item:option) => string,
  // Turn an `option` into Virtual DOM (it will be wrapped in `<li>`).
    viewOption: (item:option, address:Address<innerMessage>) => DOM,

  // Style of the selector which will be an `<ul>` element.
    selectorStyle: Style.Rules,
  // Style of the option `<li>` element that isn't selected.
    deselectedOptionStyle: Style.Rules,
  // Style of the option `<li>` element that is selected.
    selectedOptionStyle: Style.Rules,

  // Message to send into update when option with the given `id` gets selected.
    onSelect: (id:string) => outerMessage,
  // Message to send into update when option with the given `id` gets activated
  // (more specifically clicked).
    onActivate: (id:string) => outerMessage,
  // Message to send it to an update when message inside option for given `id`
  // occurs. As selector itself is unaware of children or kind messages they
  // produce, it requires this option to translate child messages to a parent
  // messages.
    onOptionMessage: (id:string, input:innerMessage) => outerMessage
  }

// # Model

// Model just tracks which option is currently selected if any.
export class Model {
  selected: ?string;
  static deselected: Model;
  constructor (selected:?string) {
    this.selected = selected
  }
}
Model.deselected = new Model(null)

// Creates a Selector with  given `id` selected.
export const initSelected =
 (id:string):Model =>
 new Model(id)

// Create a Selector where option with given `id` selected, or if `id` is
// omitted  a Selector where no option is selected.
export const init =
  (id:?string=null):Model =>
  (id == null
  ? Model.deselected
  : new Model(id)
  )

// Selects next option.
export const selectNext = <option, message, inner>
  (config:Configuration<option, message, inner>, state:Model, items:Array<option>):Model =>
  init(nthFrom(items
    , state.selected
    , 1
    , config.toID
    )
  )

// Selects previous option.
export const selectPrevious = <option, message, inner>
  (config:Configuration<option, message, inner>, state:Model, items:Array<option>):Model =>
  init(nthFrom(items
    , state.selected
    , -1
    , config.toID
   )
  )

// Figures out which option if any should be selected given the array of options,
// id of currently selected option, an offset from currently selected option to
// be selected & function to identify `option`.
const nthFrom = <option>
  (items:Array<option>
  , id:?string
  , offset:number
  , toID:(item:option) => string
  ):?string => {
  const index = items.findIndex(item => toID(item) === id) + offset
  const position = index - Math.trunc(index / items.length) * items.length
  const item =
      (position < 0
      ? items[position + items.length]
      : items[position]
      )
  const result =
      (item == null
      ? null
      : toID(item)
      )
  return result
}

// Deselects all options.
export const deselect =
  (state:Model):Model =>
  (state.selected == null
  ? state
  : Model.deselected
  )

// Selects an option with a given `id`.
export const select =
  (state:Model, id:string):Model =>
  (state.selected === id
  ? state
  : init(id)
  )

export const viewOption = <option, outer, inner>
  (config:Configuration<option, outer, inner>
  , selected: boolean
  , item: option
  , address: Address<outer>
  ):DOM =>
  thunk(config.toID(item)
  , renderOption
  , config
  , selected
  , item
  , address
  )

export const renderOption = <option, outer, inner>
  (config:Configuration<option, outer, inner>
  , selected: boolean
  , item: option
  , address: Address<outer>
  ):DOM =>
  html.li({ style:
        (selected
        ? config.selectedOptionStyle
        : config.deselectedOptionStyle
        ),
      onMouseOver: forward(address, () => config.onSelect(config.toID(item))),
      onClick: forward(address, () => config.onActivate(config.toID(item)))
    },
    [ config.viewOption(item, forward(address, inner => config.onOptionMessage(config.toID(item), inner)))
    ]
  )

// Turns given options into a selector. Extra arguments are required to describe
// selector configuration, state describing which option is currently selected &
// address to send messages to.
// Note: The `state` and `items` should live in your `Model`. Selector
// configuration on the other hand should not, it is a just `view` configuration
// and should be defined statically similar to how your styles are defined.
export const view = <option, message, inner>
  (config:Configuration<option, message, inner>
  , state: Model
  , options: Array<option>
  , address: Address<message>
  ):DOM =>
  html.ul({style: config.selectorStyle}
  , options.map(option =>
      viewOption(config
        , config.toID(option) === state.selected
        , option
        , address
        )
    )
  )
