/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {Effects, Task, html, forward, thunk} from "reflex";
import {merge, always, batch} from "../../../../common/prelude";
import {Style, StyleSheet} from '../../../../common/style';
import {ok, error} from '../../../../common/result';

import * as Title from "./Title";
import * as URL from "./url";
import * as Icon from "./Icon";
import * as Suggestion from "./Suggestion";
import * as Service from "../../../../Service/History";
import * as Unknown from '../../../../common/unknown';


import type {Address, DOM, Never} from "reflex";
import type {Result} from "../../../../common/result";

type URI = string

export type Match =
  { url: URI
  , uri: URI
  , title: string
  }

export type Completion =
  { match: string
  , hint: ?string
  }

export type Model =
  { size: number
  , limit: number
  , queryID: number
  , query: string
  , selected: number
  , matches: {[key:URI]: Match}
  , items: Array<URI>
  }


export type Action =
  | { type: "NoOp" }
  | { type: "Reset" }
  | { type: "Query", query: string }
  | { type: "Suggest", suggest: Completion }
  | { type: "Activate" }
  | { type: "SelectNext" }
  | { type: "SelectPrevious" }
  | { type: "Unselect" }
  | { type: "UpdateMatches"
    , updateMatches: Array<Match>
    }
  | { type: "HistoryError", historyError: Error }
  | { type: "ByURI"
    , source:
      { uri: URI
      , action: Suggestion.Action
      }
    }
  | { type: "Abort"
    , queryID: number
    }


const NoOp = always({type: "NoOp"});

const Abort =
  queryID =>
  ( { type: "Abort"
    , queryID: queryID
    }
  );

export const Query =
  (input:string):Action =>
  ( { type: "Query"
    , query: input
    }
  );

const HistoryError =
  error =>
  ( { type: "HistoryError"
    , historyError: error
    }
  )


const UpdateMatches =
  (result:Array<Match>):Action =>
  ( { type: "UpdateMatches"
    , updateMatches: result
    }
  );

const byURI =
  uri =>
  action =>
  ( { type: "ByURI"
    , source:
      { uri
      , action
      }
    }
  );


export const init =
  (query:string, limit:number):[Model, Effects<Action>] =>
  [ { query
    , size: 0
    , queryID: 0
    , limit
    , selected: -1
    , matches: {}
    , items: []
    }
  , Effects.none
  ]

const unselect =
  model =>
  [ merge(model, {selected: -1})
  , Effects.none
  ]

const selectNext =
  model =>
  ( model.selected == null
  ? [ ( model.size === 0
      ? model
      : merge(model, {selected: 0})
      )
    , Effects.none
    ]
  : model.selected === model.size - 1
  ? unselect(model)
  : [ merge(model, {selected: model.selected + 1 })
    , Effects.none
    ]
  )

const selectPrevious =
  model =>
  ( model.selected == null
  ? [ ( model.size === 0
      ? model
      : merge(model, {selected: model.size -1 })
      )
    , Effects.none
    ]
  : model.selected == 0
  ? unselect(model)
  : [ merge(model, {selected: model.selected - 1 })
    , Effects.none
    ]
  )

const updateQuery =
  (model, query) =>
  ( model.query === query
  ? [ model, Effects.none ]
  : [ merge(model, {query, queryID: model.queryID + 1 })
    , Effects.batch
      ( [ Effects.perform(Service.abort(model.query))
          .map(Abort)

        , Effects.perform
          ( Service
            .query(query, model.limit)
            .map(UpdateMatches)
            .recover(HistoryError)
          )
        ]
      )
    ]
  );


const updateMatches = (model, result) =>
  replaceMatches(model, result)

const replaceMatches = (model, results) => {
  const items = results.map(match => match.uri)
  const matches = {}
  results.forEach(match => matches[match.uri] = match)
  return [retainSelected(model, {matches, items}), Effects.none]
}

// If updated entries no longer have item that was selected we reset
// a selection. Otherwise we update a selection to have it keep the item
// which was selected.
const retainSelected = (model, {matches, items}) => {
  // If there was no selected entry there is nothing to retain so
  // return as is.
  let selected = model.selected
  if (model.selected != null) {
    const uri = model.items[model.selected]
    if (matches[uri] == null) {
      matches[uri] = model.matches[uri]
      items.unshift(uri)
    }
    selected = items.indexOf(uri)
  }
  const size = Math.min(model.limit, items.length)
  return merge(model, {size, selected, items, matches})
};

export const update =
  (model:Model, action:Action):[Model, Effects<Action>] =>
  ( action.type === "Query"
  ? updateQuery(model, action.query)
  : action.type === "SelectNext"
  ? selectNext(model)
  : action.type === "SelectPrevious"
  ? selectPrevious(model)
  : action.type === "Unselect"
  ? unselect(model)
  : action.type === "UpdateMatches"
  ? updateMatches(model, action.updateMatches)
  : Unknown.update(model, action)
  )

export const reset =
  (model:Model):[Model, Effects<Action>] => {
    return [model, Effects.none]
  }


const innerView =
  (model, isSelected) =>
  [ Icon.view('', isSelected)
  , Title.view(model.title, isSelected)
  , URL.view(model.uri, isSelected)
  ];


export const render =
  (model:Model, address:Address<Action>):DOM =>
  html.section
  ( { style: {borderColor: 'inherit' } }
  , model.items.map
    ( (uri, index) =>
      Suggestion.view
      ( model.selected === index
      , innerView
        ( model.matches[uri]
        , model.selected === index
        )
      , forward(address, byURI(uri))
      )
    )
  )

export const view =
  (model:Model, address:Address<Action>):DOM =>
  thunk
  ( 'history'
  , render
  , model
  , address
  );
