/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {Effects, Task, html, forward, thunk} from "reflex";
import {merge, always, batch} from "../../../../common/prelude";
import {Style, StyleSheet} from '../../../../common/style';
import {ok, error} from '../../../../common/result';

import * as Title from "./title";
import * as URL from "./url";
import * as Icon from "./icon";
import * as Suggestion from "./suggestion";
import * as Unknown from '../../../../common/unknown';

/*::
import type {Address, DOM, Never} from "reflex";
import type {Result} from "../../../../common/result";
import type {Completion, Match, Model, Action} from "./history";
*/

const NoOp = always({type: "NoOp"});

const Abort =
  queryID =>
  ( { type: "Abort"
    , queryID: queryID
    }
  );

export const Query =
  (input/*:string*/)/*:Action*/ =>
  ( { type: "Query"
    , source: input
    }
  );

const UpdateMatches =
  (result/*:Result<Error, Array<Match>>*/)/*:Action*/ =>
  ( { type: "UpdateMatches"
    , source: result
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


const pendingRequests = Object.create(null);

const abort =
  (id/*:number*/)/*:Task<Never, number>*/ =>
  new Task(succeed => void(0))

const search =
  ( id/*:number*/
  , input/*:string*/
  , limit/*:number*/
  )/*:Task<Never, Result<Error, Array<Match>>>*/ =>
  new Task(succeed => void(0))


export const init =
  (query/*:string*/, limit/*:number*/)/*:[Model, Effects<Action>]*/ =>
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
  [ merge(model, {selected: null})
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
      ( [ Effects.perform(abort(model.queryID))
          .map(Abort)

        , Effects.perform
          (search(model.queryID + 1, query, model.limit))
          .map(UpdateMatches)
        ]
      )
    ]
  );


const updateMatches = (model, result) =>
  ( result.isOk
  ? replaceMatches(model, result.value)
  : [ model
    , Effects
      .perform(Unknown.error(result.error))
      .map(NoOp)
    ]
  )

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
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ =>
  ( action.type === "Query"
  ? updateQuery(model, action.source)
  : action.type === "SelectNext"
  ? selectNext(model)
  : action.type === "SelectPrevious"
  ? selectPrevious(model)
  : action.type === "Unselect"
  ? unselect(model)
  : action.type === "UpdateMatches"
  ? updateMatches(model, action.source)
  : Unknown.update(model, action)
  )

const innerView =
  (model, address, isSelected) =>
  [ Icon.view('', isSelected)
  , Title.view(model.title, isSelected)
  , URL.view(model.uri, isSelected)
  ];


export const render =
  (model/*:Model*/, address/*:Address<Action>*/)/*:DOM*/ =>
  html.section
  ( { style: {borderColor: 'inherit' } }
  , model.items.map
    ( (uri, index) =>
      Suggestion.view
      ( model.selected === index
      , innerView
        ( model.matches[uri]
        , forward(address, byURI(uri))
        , model.selected === index
        )
      )
    )
  )

export const view =
  (model/*:Model*/, address/*:Address<Action>*/)/*:DOM*/ =>
  thunk
  ( 'history'
  , render
  , model
  , address
  );
