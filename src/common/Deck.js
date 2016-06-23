/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, Task, html, forward, thunk} from "reflex"
import {merge} from "../common/prelude"
import * as Unknown from "../common/unknown"
import {indexOfOffset} from "../common/selector"


import type {Address, DOM, Never} from "reflex"
export type Integer = number
export type ID = string

export type Dictionary <key, value> =
  {[key:key]: value}

export type Maybe <value> =
  ?value

export type Flags <flags> =
  { inBackground: boolean
  , flags: flags
  }

export type Action <action, flags> =
  | { type: "Open", open: flags }
  | { type: "Close", id: ID }
  | { type: "Remove", id: ID }
  | { type: "Select", id: ID }
  | { type: "Modify", id: ID, modify: action }
  | { type: "SelectNext" }
  | { type: "SelectPrevious" }

export type Transaction <action, model> =
  [model, Effects<action>]

export type Init <action, model, flags> =
  (flags:flags) =>
  Transaction<action, model>

export type Update <action, model> =
  (model:model, action:action) =>
  Transaction<action, model>

export type Card <action, model, flags> =
  { init: (flags:flags) => [model, Effects<action>]
  , update: (model:model, action:action) => [model, Effects<action>]
  , close: (model:model) => [model, Effects<action>]
  , select: (model:model) => [model, Effects<action>]
  , deselect: (model:model) => [model, Effects<action>]
  }


export class Model <model> {
  
  nextID: Integer;
  index: Array<ID>;
  cards: Dictionary<ID, model>;
  selected: Maybe<ID>;
  
  constructor(
    nextID:Integer
  , index:Array<ID>
  , cards:Dictionary<ID, model>
  , selected:Maybe<ID>
  ) {
    this.nextID = nextID
    this.index = index
    this.cards = cards
    this.selected = selected
  }
}


export const init = /*::<action, model, flags>*/
  ( nextID:Integer=0
  , index:Array<ID>=[]
  , cards:Dictionary<ID, model>={}
  , selected:Maybe<ID>=null
  ):Transaction<Action<action, flags>, Model<model>> =>
  [ new Model(nextID, index, cards, selected)
  , Effects.none
  ];

export const update = /*::<action, model, flags>*/
  ( card:Card<action, model, flags>
  , model:Model<model>
  , action:Action<action, flags>
  ):Transaction<Action<action, flags>, Model<model>> => {
    switch (action.type) {
      case "NoOp":
        return nofx(model);
      case "Open":
        return open(card, model, action.open);
      case "Close":
        return closeByID(card, model, action.id);
      case "Select":
        return selectByID(card, model, action.id, true);
      case "SelectNext":
        return selectNext(card, model);
      case "SelectPrevious":
        return selectPrevious(card, model);
      case "Remove":
        return removeByID(card, model, action.id);
      case "Modify":
        return updateByID(card, model, action.id, action.modify)
      default:
        return Unknown.update(model, action);
    }
  }

const nofx = /*::<model, action>*/
  ( model:model ):[model, Effects<action>] =>
  [ model
  , Effects.none
  ]


const updateByID = /*::<model, action, flags>*/
  ( api:Card<action, model, flags>
  , model:Model<model>
  , id:ID
  , action:action
  ):Transaction<Action<action, flags>, Model<model>> => {
    if (id in model.cards) {
      const [card, $card] = api.update(model.cards[id], action);
      const cards = merge(model.cards, {[id]: card});
      return [
        new Model
        ( model.nextID
        , model.index
        , cards
        , model.selected
        )
      , $card.map(Tag.modify(id))
      ]
    }
    else {
      return [model, Effects.none]
    }
  }

export const open = /*::<action, model, flags>*/
  ( api:Card<action, model, flags>
  , model:Model<model>
  , flags:flags
  ):Transaction<Action<action, flags>, Model<model>> => {
    const id = `${model.nextID}`;
    const [card, $card] = api.init(flags);

    const [model2, fx2] =
      ( model.selected == null
      ? nofx(model)
      : card.isSelected
      ? deselectByID(api, model, model.selected)
      : nofx(model)
      );


    const model3 = new Model
      ( model.nextID + 1
      , model2
        .index
        .slice(0, 1)
        .concat([id])
        .concat(model2.index.slice(1))
      , merge(model2.cards, {[id]: card})
      , ( card.isSelected
        ? id
        : model2.selected
        )
      );

    const fx3 = Effects.batch
      ( [ fx2
        , $card.map(Tag.modify(id))
        ]
      )

    return [model3, fx3]
  }

const closeByID = /*::<action, model, flags>*/
  ( api:Card<action, model, flags>
  , model:Model<model>
  , id:ID
  ):Transaction<Action<action, flags>, Model<model>> => {
    const [available, $available] =
      ( model.selected === id
      ? selectBeneficiaryByID(api, model, id)
      : [ model, Effects.none ]
      )

    if (id in available.cards) {
      const [card, $card] =
        api.close(available.cards[id]);

      const transaction =
        [ merge
          ( available
          , { cards: merge
              ( available.cards
              , {[id]: card}
              )
            }
          )
        , Effects.batch
          ( [ $available
            , $card.map(Tag.modify(id))
            ]
          )
        ]

      return transaction;
    }
    else {
      return cardNotFound(model, id);
    }
  }

export const removeByID = /*::<action, model, flags>*/
  ( card:Card<action, model, flags>
  , model:Model<model>
  , id:ID
  ):Transaction<Action<action, flags>, Model<model>> => {
    const [available, $available] =
      ( model.selected === id
      ? selectBeneficiaryByID(card, model, id)
      : [model, Effects.none]
      )

    if (id in available.cards) {
      const transaction =
        [ merge
          ( available
          , { index: available.index.filter(x => x !== id)
            , cards: merge
                ( available.cards
                , {[id]: void(0)}
                )
            }
          )
        , $available
        ];

      return transaction
    }
    else {
      return cardNotFound(model, id)
    }
  }

const cardNotFound = /*::<model, action>*/
  ( model:model, id:ID):[model, Effects<action>] =>
  nofx(model)

export const selectByID = /*::<action, model, flags>*/
  ( api:Card<action, model, flags>
  , model:Model<model>
  , id:ID
  , isSelectionChange:boolean=true
  ):Transaction<Action<action, flags>, Model<model>> => {
    if (id === model.selected) {
      return nofx(model)
    }
    else if (id in model.cards) {
      const [deselected, $deselected] =
        ( ( isSelectionChange && model.selected != null )
        ? deselectByID(api, model, model.selected)
        : nofx(model)
        )

      const [card, $card] = api.select(model.cards[id]);

      const transaction =
        [ merge
          ( deselected
          , { selected: id
            , cards: merge
              ( deselected.cards
              , { [id]: card }
              )
            }
          )
        , Effects.batch
          ( [ $deselected
            , $card.map(Tag.modify(id))
            ]
          )
        ]

      return transaction
    }
    else {
      return cardNotFound(model, id)
    }
  }

export const deselectByID = /*::<action, model, flags>*/
  ( api:Card<action, model, flags>
  , model:Model<model>
  , id:ID
  ):Transaction<Action<action, flags>, Model<model>> => {
    if (model.selected !== id) {
      return nofx(model)
    }
    else if (id in model.cards) {
      const [card, $card] =
        api.deselect(model.cards[id]);

      const transaction =
        [ merge
          ( model
          , { selected: null
            , cards: merge
              ( model.cards
              , { [id]: card }
              )
            }
          )
        , $card.map(Tag.modify(id))
        ]

      return transaction
    }
    else {
      return cardNotFound(model, id)
    }
  }

const selectBeneficiaryByID = /*::<action, model, flags>*/
  ( api:Card<action, model, flags>
  , model:Model<model>
  , id:ID
  ):Transaction<Action<action, flags>, Model<model>> => {
    const selected = beneficiaryOf(id, model.index);
    if (selected != null) {
      return selectByID(api, model, selected, false)
    }
    else {
      return nofx(model)
    }
  }

export const selectByOffset = /*::<action, model, flags>*/
  ( api:Card<action, model, flags>
  , model:Model<model>
  , offset:Integer
  ):Transaction<Action<action, flags>, Model<model>> =>
  ( model.index.length === 0
  ? nofx(model)
  : model.selected == null
  ? [ model
    , Effects.perform
      ( warn(Error(`Unable to change selected WebView if no WebView is seleted`))
      )
    ]
  : selectByID
    ( api
    , model
    , relativeOf(offset, model.selected, model.index)
    )
  );

export const selectNext =/*::<action, model, flags>*/
  ( api:Card<action, model, flags>
  , model:Model<model>
  ):Transaction<Action<action, flags>, Model<model>> =>
  selectByOffset(api, model, 1)

export const selectPrevious = /*::<action, model, flags>*/
  ( api:Card<action, model, flags>
  , model:Model<model>
  ):Transaction<Action<action, flags>, Model<model>> =>
  selectByOffset(api, model, -1)

const relativeOf =
  (offset, id, index) =>
  index
  [ indexOfOffset
    ( index.indexOf(id)
    , offset
    , index.length
    , true
    )
  ]

// Function is used to decide which tab should get a selection if currently
// selected tab is to be closed. The given `id` represents currently selected
// tab `id` in the given array of the tab ids (that are ordered as they appear
// to the user). The rules are chosen to follow a specific UX: If you close
// the first tab we select the next tab, otherwise we select the previous tab.
// Function presumes that the given `id` is contained by the given `array`
// & returns the `id` that supposed to get the selected once the tab with the
// given `id` is closed. Function returns:
// - `void` if the array contains only the given element (or is empty which
//    should not be the case), implying no tab should be selected.
// - The first element in the `array`, if the given `id` is not in the
//   array (should not happen but, if somehow it does we just select first tab).
// - The second element, if the given `id` is the first item in the `array`.
// - Is the tab `id` preceding the given `id` otherwise.
const beneficiaryOf =
  (id, array) => {
    const count = array.length;
    if (count === 0) {
      return undefined;
    }

    const from = array.indexOf(id);
    if (from === -1) {
      return array[0];
    }
    if (count === 1) {
      return undefined;
    }
    if (from === 0) {
      return array[1];
    }
    return array[from - 1];
  }

const Tag = {
  modify: /*::<action, flags>*/
    ( id:ID )/*:(action:action) => Action<action, flags>*/ =>
    ( action ) =>
    ( { type: "Modify"
      , id
      , modify: action
      }
    )
}

export const renderCards = /*::<action, model, flags>*/
  ( renderCard/*:(model:model, address:Address<action>) => DOM*/
  , model:Model<model>
  , address:Address<Action<action, flags>>
  ):Array<DOM> =>
  model
  .index
  .map
  ( id =>
    thunk
    ( `${id}`
    , renderCard
    , model.cards[id]
    , forward(address, Tag.modify(id))
    )
  )

const warn = /*::<message>*/
  (message:message):Task<Never, any> =>
  new Task
  ((succeed, fail) => {
    console.warn(message)
  })
