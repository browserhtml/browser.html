/* @noflow */

import {Effects, html, forward, thunk} from "reflex"
import {merge} from "../common/prelude"

import * as Card from "./deck/card"
import * as Unknown from "../common/unknown"

/*::
import type {Address, DOM} from "reflex"
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
  | { type: "Close", id: ID, close: action }
  | { type: "Remove", id: ID }
  | { type: "Select", id: ID, select: action, deselect: action }
  | { type: "Activate", id: ID, activate: action, deactivate: action, deselect: action }
  | { type: "Modify", id: ID, modify: action }

export type Transaction <action, model> =
  [model, Effects<action>]

export type Init <action, model, flags> =
  (flags:flags) =>
  Transaction<action, model>

export type Update <action, model> =
  (model:model, action:action) =>
  Transaction<action, model>
*/

export class Model /*::<model>*/ {
  /*::
  nextID: Integer;
  index: Array<ID>;
  cards: Dictionary<ID, model>;
  selected: Maybe<ID>;
  active: Maybe<ID>;
  */
  constructor(
    nextID/*:Integer*/
  , index/*:Array<ID>*/
  , cards/*:Dictionary<ID, model>*/
  , selected/*:Maybe<ID>*/
  , active/*:Maybe<ID>*/
  ) {
    this.nextID = nextID
    this.index = index
    this.cards = cards
    this.selected = selected
    this.active = active
  }
}



export const init = /*::<action, model, flags>*/
  ( nextID/*:Integer*/=0
  , index/*:Array<ID>*/=[]
  , cards/*:Dictionary<ID, model>*/={}
  , selected/*:Maybe<ID>*/=null
  , active/*:Maybe<ID>*/=null
  )/*:Transaction<Action<action, flags>, Model<model>>*/ =>
  [ new Model(nextID, index, cards, selected, active)
  , Effects.none
  ];

export const update = /*::<action, model, flags>*/
  ( initCard/*:Init<action, model, flags>*/
  , updateCard/*:Update<action, model>*/
  , model/*:Model<model>*/
  , action/*:Action<action, flags>*/
  )/*:Transaction<Action<action, flags>, Model<model>>*/ => {
    switch (action.type) {
      case "NoOp":
        return nofx(model);
      case "Open":
        return open(initCard, updateCard, action.open, model);
      case "Close":
        return close(initCard, updateCard, action.id, model);
      case "Select":
        return select(initCard, updateCard, action.id, model);
      case "Activate":
        return activate(initCard, updateCard, action.id, model);
      case "Remove":
        return remove(initCard, updateCard, action.id, model);
      case "Modify":
        return modify(initCard, updateCard, action.id, action.modify, model)
      default:
        return Unknown.update(model, action);
    }
  }

const nofx = /*::<model, action>*/
  ( model/*:model*/ )/*:[model, Effects<action>]*/ =>
  [ model
  , Effects.none
  ]


const modify = /*::<model, action, flags>*/
  ( initCard/*:Init<action, model, flags>*/
  , updateCard/*:Update<action, model>*/
  , id/*:ID*/
  , action/*:action*/
  , model/*:Model<model>*/
  )/*:Transaction<Action<action, flags>, Model<model>>*/ => {
    if (id in model.cards) {
      const [card, $card] = updateCard(model.cards[id], action);
      const cards = merge(model.cards, {[id]: card});
      return [
        new Model
        ( model.nextID
        , model.index
        , cards
        , model.selected
        , model.active
        )
      , $card.map(Tag.modify(id))
      ]
    }
    else {
      return [model, Effects.none]
    }
  }

export const open = /*::<action, model, flags>*/
  ( initCard/*:Init<action, model, flags>*/
  , updateCard/*:Update<action, model>*/
  , flags/*:flags*/
  , model/*:Model<model>*/
  )/*:Transaction<Action<action, flags>, Model<model>>*/ => {
    const id = `${model.nextID}`;
    const [model2, fx2] =
      ( model.active == null
      ? nofx(model)
      : deactivate(initCard, updateCard, model.active, model)
      );

    const [card, $card] = initCard(flags);
    const model3 = new Model
      ( model.nextID + 1
      , (model2.index.unshift(id), model2.index)
      , (model2.cards[id] = card, model2.cards)
      , model2.selected
      , model2.active
      );

    const fx3 = Effects.batch
      ( [ fx2
        , $card.map(Tag.modify(id))
        ]
      )

    return [model3, fx3]
  }

const close = /*::<action, model, flags>*/
  ( initCard/*:Init<action, model, flags>*/
  , updateCard/*:Update<action, model>*/
  , id/*:ID*/
  , model/*:Model<model>*/
  )/*:Transaction<Action<action, flags>, Model<model>>*/ => {
    const [available, $available] =
      clear(initCard, updateCard, id, model);

    if (id in available.cards) {
      const [card, $card] =
        updateCard(available.cards[id], Card.Close);

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

const asInactive = /*::<model>*/
  (model/*:Model<model>*/)/*:Model<model>*/ =>
  merge
  ( model
  , { active: null
    , selected: null
    }
  );

const asDeselected = /*::<model>*/
  (model/*:Model<model>*/)/*:Model<model>*/ =>
  merge
  ( model
  , { selected: null }
  );

export const remove = /*::<action, model, flags>*/
  ( initCard/*:Init<action, model, flags>*/
  , updateCard/*:Update<action, model>*/
  , id/*:ID*/
  , model/*:Model<model>*/
  )/*:Transaction<Action<action, flags>, Model<model>>*/ => {
    const [available, $available] =
      clear(initCard, updateCard, id, model);

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
  ( model/*:model*/, id/*:ID*/)/*:[model, Effects<action>]*/ =>
  nofx(model)


export const select = /*::<action, model, flags>*/
  ( initCard/*:Init<action, model, flags>*/
  , updateCard/*:Update<action, model>*/
  , id/*:ID*/
  , model/*:Model<model>*/
  )/*:Transaction<Action<action, flags>, Model<model>>*/ => {
    if (id === model.selected) {
      return nofx(model)
    }
    else if (id in model.cards) {
      const [deselected, $deselected] =
        ( model.selected != null
        ? deselect(initCard, updateCard, model.selected, model)
        : nofx(model)
        )

      const [card, $card] =
        updateCard(model.cards[id], Card.Select);

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

export const deselect = /*::<action, model, flags>*/
  ( initCard/*:Init<action, model, flags>*/
  , updateCard/*:Update<action, model>*/
  , id/*:ID*/
  , model/*:Model<model>*/
  )/*:Transaction<Action<action, flags>, Model<model>>*/ => {
    if (model.selected !== id) {
      return nofx(model)
    }
    else if (id in model.cards) {
      const [card, $card] =
        updateCard(model.cards[id], Card.Deselect);

      const transaction =
        [ merge
          ( model
          , { selected: id
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

export const activate = /*::<action, model, flags>*/
  ( initCard/*:Init<action, model, flags>*/
  , updateCard/*:Update<action, model>*/
  , id/*:ID*/
  , model/*:Model<model>*/
  )/*:Transaction<Action<action, flags>, Model<model>>*/ => {
    if (model.active === id) {
      return nofx(model)
    }
    else if (id in model.cards) {
      const [deactivated, $deactivated] =
        ( model.active != null
        ? deactivate(initCard, updateCard, model.active, model)
        : nofx(model)
        )

      const [card, $card] =
        updateCard(model.cards[id], Card.Activate);

      const transaction =
        [ merge
          ( deactivated
          , { selected: null
            , active: id
            , cards: merge
              ( deactivated.cards
              , { [id]: card }
              )
            }
          )
        , Effects.batch
          ( [ $deactivated
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

export const deactivate = /*::<action, model, flags>*/
  ( initCard/*:Init<action, model, flags>*/
  , updateCard/*:Update<action, model>*/
  , id/*:ID*/
  , model/*:Model<model>*/
  )/*:Transaction<Action<action, flags>, Model<model>>*/ => {
    if (model.active !== id) {
      return nofx(model)
    }
    else if (id in model.cards) {
      const [card, $card] =
        updateCard(model.cards[id], Card.Deactivate);

      const transaction =
        [ merge
          ( model
          , { selected: null
            , active: null
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

const clear = /*::<action, model, flags>*/
  ( initCard/*:Init<action, model, flags>*/
  , updateCard/*:Update<action, model>*/
  , id/*:ID*/
  , model/*:Model<model>*/
  )/*:Transaction<Action<action, flags>, Model<model>>*/ => {
    if (model.active === id) {
      const active = beneficiaryOf(id, model.index);
      if (active != null) {
        return activate(initCard, updateCard, active, model)
      }
      else {
        return nofx(model)
      }
    }
    else if (model.selected === id) {
      const selected = beneficiaryOf(id, model.index);
      if (selected != null) {
        return select(initCard, updateCard, selected, model)
      }
      else {
        return nofx(model)
      }
    }
    else {
      return nofx(model);
    }
  }

// Takes element and an array thas supposed to contain it and returns
// neigboring element which:
// - Is `void` if array is empty or contains only given element.
// - Is first element, if given element is not in the array.
// - Is following element, if given element is a first in the array.
// - Is preceeding elemnet, otherwise.
const beneficiaryOf =
  (id, index) => {
    const count = index.length
    const from = index.indexOf(id)
    const to =
      ( count === 0
      ? -1
      : from === -1
      ? 0
      : count === 1
      ? -1
      : from === 0
      ? from + 1
      : from - 1
      );
    return index[to]
  }

const Tag = {
  modify: /*::<action, flags>*/
    ( id/*:ID*/ )/*:(action:action) => Action<action, flags>*/ =>
    ( action ) =>
    ( { type: "Modify"
      , id
      , modify: action
      }
    )
}

export const renderCards = /*::<action, model, flags>*/
  ( renderCard/*:(model:model, address:Address<action>) => DOM*/
  , model/*:Model<model>*/
  , address/*:Address<Action<action, flags>>*/
  )/*:Array<DOM>*/ =>
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
