/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, html, thunk, forward} from "reflex"
import type {Address, DOM} from "reflex";
import {always, nofx, appendFX, port, merge} from "../../../../common/prelude"
import * as Style from "../../../../common/style"

export class Model {
  selected: ?string;
  static deselected: Model;
  constructor(selected:?string) {
    this.selected = selected
  }
}
Model.deselected = new Model(null)


export type Configuration <data, outerMessage, innerMessage> =
 { toID: (item:data) => string
 , toView: (item:data, address:Address<innerMessage>) => DOM
 , receiveUpdate: (state:Model) => outerMessage
 , sendTo: (id:string, input:innerMessage) => outerMessage
 , onSelect: (id:string) => outerMessage
 , onActivate: (id:string) => outerMessage
 , style: ?Style.Rules
 }

export const configure = <data, outerMessage, innerMessage>
  (options:Configuration<data, outerMessage, innerMessage>):Configuration<data, outerMessage, innerMessage> =>
  options

export const initSelected =
 (id:string):Model =>
 new Model(id)

export const init =
  (selected:?string):Model =>
  ( selected == null
  ? Model.deselected
  : new Model(selected)
  )


export const selectNext = <data, message, inner>
  (config:Configuration<data, message, inner>, state:Model, items:Array<data>):Model =>
  init
  ( nthFrom
    ( items
    , state.selected
    , config.toID
    , 1
    )
  )

export const selectPrevious = <data, message, inner>
  (config:Configuration<data, message, inner>, state:Model, items:Array<data>):Model =>
  init
  ( nthFrom
    ( items
    , state.selected
    , config.toID
    , -1
   )
  )


const nthFrom = <data>
  ( items:Array<data>
  , id:?string
  , toID: (item:data) => string
  , offset
  ):?string => {
    const index = items.findIndex(item => toID(item) == id) + offset
    const position = index - Math.trunc(index / items.length) * items.length
    const item =
      ( position < 0
      ? items[position + items.length]
      : items[position]
      )
    const result =
      ( item == null
      ? null
      : toID(item)
      )
    return result
  }

export const deselect = <data>
  (state:Model):Model =>
  ( state.selected == null
  ? state
  : Model.deselected
  )

export const select = <data>
  (state:Model, id:string):Model =>
  ( state.selected === id
  ? state
  : init(id)
  )

type MessageTo <message> =
  { id: string
  , message: message
  }

export const viewOption = <data, outer, inner>
  ( config:Configuration<data, outer, inner>
  , selected: boolean
  , item: data
  , address: Address<outer>
  ):DOM =>
  thunk
  ( config.toID(item)
  , renderOption
  , config
  , selected
  , item
  , address
  )

export const renderOption = <data, outer, inner>
  ( config:Configuration<data, outer, inner>
  , selected: boolean
  , item: data
  , address: Address<outer>
  ):DOM =>
  html.li
  ( { style:
        ( selected
        ? selectedStyle
        : deselectedStyle
        )
    , onMouseOver: forward(address, () => config.onSelect(config.toID(item)))
    , onClick: forward(address, () => config.onActivate(config.toID(item)))
    }
  , [ config.toView(item, forward(address, inner => config.sendTo(config.toID(item), inner)))
    ]
  )

export const view = <data, message, inner>
  ( config:Configuration<data, message, inner>
  , state: Model
  , items: Array<data>
  , address: Address<message>
  ):DOM =>
  html.ul
  ( {style: config.style}
  , items.map
    ( item =>
      viewOption
        ( config
        , config.toID(item) === state.selected
        , item
        , address
        )
    )
  )

const baseStyle =
  { lineHeight: '40px'
  , overflow: 'hidden'
  , paddingLeft: '35px'
  , paddingRight: '10px'
  // Contains absolute elements.
  , position: 'relative'
  , whiteSpace: 'nowrap'
  , textOverflow: 'ellipsis'
  , borderLeft: 'none'
  , borderRight: 'none'
  , borderTop: 'none'
  , borderBottom: '1px solid'
  , color: 'inherit'
  , borderColor: 'inherit'
  , marginTop: '-3px'
  , borderRadius: '0px'
  , background: 'none'
  , opacity: 1
  }

const deselectedStyle = merge
  ( baseStyle
  , { opacity: 0.7 }
  )

const selectedStyle = merge
  ( baseStyle
  , { background: '#4A90E2'
    , color: '#fff'
    , borderRadius: '3px'
    , borderColor: 'transparent'
    }
  )
