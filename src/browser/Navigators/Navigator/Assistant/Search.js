/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {Effects, Task, html, forward, thunk} from "reflex";
import {merge, always, batch} from "../../../../common/prelude";
import {Style, StyleSheet} from '../../../../common/style';
import {indexOfOffset} from "../../../../common/selector";
import {ok, error} from '../../../../common/result';

import * as Title from "./Title";
import * as Icon from "./Icon";
import * as Suggestion from "./Suggestion";
import * as Unknown from '../../../../common/unknown';


import type {Address, DOM, Never} from "reflex";
import type {Result} from "../../../../common/result";

type URI = string

export type Match =
  { uri: URI
  , title: string
  }

export type Completion =
  { match: string
  , hint: string
  , query: string
  }

export type Model =
  { size: number
  , limit: number
  , queryID: number
  , query: ?string
  , selected: number
  , matches: {[key:URI]: Match}
  , items: Array<URI>
  }

type SearchResult =
  { queryID: number
  , matches: Array<Match>
  }

export type Action =
  | { type: "NoOp" }
  | { type: "Reset" }
  | { type: "Query", query: string }
  | { type: "Suggest", suggest: Completion }
  | { type: "Activate" }
  | { type: "Load", load: URI }
  | { type: "SelectNext" }
  | { type: "SelectPrevious" }
  | { type: "Select", select: URI }
  | { type: "Unselect" }
  | { type: "UpdateMatches", updateMatches: SearchResult }
  | { type: "SearchError", searchError: Error }
  | { type: "ByURI"
    , source:
      { uri: URI
      , action: Suggestion.Action
      }
    }
  | { type: "Abort", abort: number }



const NoOp = always({type: "NoOp"});

const Abort =
  queryID =>
  ( { type: "Abort"
    , abort: queryID
    }
  );

export const SelectNext = { type: "SelectNext" };
export const SelectPrevious = { type: "SelectPrevious" };
export const Suggest =
  (suggestion:Completion):Action =>
  ( { type: "Suggest"
    , suggest: suggestion
    }
  );

export const Query =
  (input:string):Action =>
  ( { type: "Query"
    , query: input
    }
  );

const Activate = { type: "Activate" };

const Load =
  (uri) =>
  ( { type: "Load"
    , load: uri
    }
  );

const SearchError =
  error =>
  ( { type: "SearchError"
    , searchError: error
    }
  )


const UpdateMatches =
  (searchResult) =>
  ( { type: "UpdateMatches"
    , updateMatches: searchResult
    }
  );

const byURI =
  uri =>
  action => {
    switch (action.type) {
      case "Select":
        return {
          type: "Select",
          select: uri
        }
      case "Activate":
        return Activate;
      default:
        return {
          type: "ByURI",
          source: { uri, action }
        }
    }
  };

const decodeResponseFailure =
  request =>
  error(Error(`Can not decode ${request.response} received from ${request.url || ""}`))

const decodeMatches =
  matches =>
  ( Array.isArray(matches)
  ? ok(matches.map(decodeMatch))
  : error(Error(`Can not decode non array matches ${matches}`))
  );

const decodeMatch =
  match =>
  ( { title: match
    , uri: `https://duckduckgo.com/html/?q=${encodeURIComponent(match)}`
    }
  );

const decodeResponse = (request) =>
  ( request.responseType !== 'json'
  ? error(Error(`Can not decode ${request.responseType} type response from ${request.url || ""}`))
  : request.response == null
  ? decodeResponseFailure(request)
  : request.response[1] == null
  ? decodeResponseFailure(request)
  : decodeMatches(request.response[1])
  );

const pendingRequests = Object.create(null);

const abort =
  id =>
  new Task((succeed, fail) => {
    if (pendingRequests[id] != null) {
      pendingRequests[id].abort();
      delete pendingRequests[id];
    }
  })

const search =
  ( id:number
  , input:string
  , limit:number
  ):Task<Error, SearchResult> =>
  new Task((succeed, fail) => {
    const request = new XMLHttpRequest({ mozSystem: true });
    pendingRequests[id] = request;
    const uri = `https://ac.duckduckgo.com/ac/?q=${input}&type=list`
    request.open
    ( 'GET'
    , uri
    , true
    );
    request.responseType = 'json';
    // @FlowIgnore: We need this property
    request.url = uri;

    request.onerror = event => {
      delete pendingRequests[id];
      fail(Error(`Network request to ${uri} has failed: ${request.statusText}`))
    };
    request.onload = event => {
      delete pendingRequests[id];
      const result = decodeResponse(request);
      if (result.isOk) {
        succeed({ queryID: id, matches: result.value });
      } else {
        fail(result.error);
      }
    };

    request.send();
  });


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

const suggest = model =>
  ( model.query == null
  ? [ model, Effects.none ]
  : model.items.length === 0
  ? [ model, Effects.none ]
  : [ model
    , Effects.receive
      ( Suggest
        ( { query: model.query
          , match: model.matches[model.items[model.selected]].title
          , hint: ''
          }
        )
      )
    ]
  );

const selectNext =
  model =>
  suggest
  ( merge
    ( model
    , { selected:
        indexOfOffset
        ( model.selected
        , 1
        , model.size
        , true
        )
      }
    )
  )

const select =
  (model, uri) => {
    const index = model.items.indexOf(uri)
    const selected =
      ( index < 0
      ? model.selected
      : index
      )
    return suggest(merge(model, {selected}))
  }

const selectPrevious =
  model =>
  suggest
  ( merge
    ( model
    , { selected:
        indexOfOffset
        ( model.selected
        , -1
        , model.size
        , true
        )
      }
    )
  )

const updateQuery =
  (model, query) =>
  ( model.query === query
  ? [ model, Effects.none ]
  : query.trim() === ""
  ? [ merge
      ( model
      , { queryID: model.queryID + 1
        , query: ""
        , selected: -1
        , matches: {}
        , items: []
        }
      )
    , Effects.perform
      (abort(model.queryID))
      .map(Abort)
    ]
  : [ merge(model, {query, queryID: model.queryID + 1 })
    , Effects.batch
      ( [ Effects.perform
          (abort(model.queryID))
          .map(Abort)

        , Effects.perform
          ( search(model.queryID + 1, query, model.limit)
            .map(UpdateMatches)
            .recover(SearchError)
          )
        ]
      )
    ]
  );

const updateMatches = (model, result) =>
  ( result.queryID !== model.queryID
  ? [ model, Effects.none ]
  : replaceMatches(model, result.matches)
  );

const replaceMatches = (model, results) => {
  const top = results[0]
  const query = model.query
  if (top != null && query != null) {
    if (!top.title.toLowerCase().startsWith(query.toLowerCase())) {
      results.unshift(decodeMatch(query))
    }
  }

  const items = results.map(match => match.uri);
  const matches = {};
  results.forEach(match => matches[match.uri] = match);
  // With new suggestions code retaining suggestions does not seems
  // to make much sense. So disabling it for now.
  // return [retainSelected(model, {matches, items}), Effects.none]
  const size = Math.min(model.limit, items.length);
  const selected = 0;
  return suggest(merge(model, {matches, items, size, selected}));
}

// If updated entries no longer have item that was selected we reset
// a selection  . Otherwise we update a selection to have it keep the item
// which was selected.
const retainSelected = (model, {matches, items}) => {
  // If there was no selected entry there is nothing to retain so
  // return as is.
  let selected = model.selected
  if (model.selected >= 0) {
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

const updateByURI =
  (model, {uri, action}) =>
  [model, Effects.none];

const activate =
  model =>
  [ model
  , ( model.selected < 0
    ? Effects.none
    : Effects.receive
      ( Load(model.matches[model.items[model.selected]].uri)
      )
    )
  ]

export const update =
  (model:Model, action:Action):[Model, Effects<Action>] => {
    switch (action.type) {
      case "Query":
        return updateQuery(model, action.query);
      case "Reset":
        return reset(model);
      case "SelectNext":
        return selectNext(model);
      case "SelectPrevious":
        return selectPrevious(model);
      case "Select":
        return select(model, action.select);
      case "Unselect":
        return unselect(model);
      case "UpdateMatches":
        return updateMatches(model, action.updateMatches);
      case "SearchError":
        return reportError(model, action.searchError);
      case "ByURI":
        return updateByURI(model, action.source);
      case "Activate":
        return activate(model);
      default:
        return Unknown.update(model, action);
    }
  }

export const reset =
  (state:Model):[Model, Effects<Action>] => {
    const model =
      { query: ""
      , size: 0
      , queryID: 0
      , limit: state.limit
      , selected: -1
      , matches: {}
      , items: []
      }

    const fx =
      Effects.perform(abort(state.queryID))
      .map(Abort)

    return [model, fx]
  }

const reportError =
  (model, error) =>
  [ model
  , Effects.perform(Unknown.error('Search error occured', error))
  ]


const innerView =
  (model, isSelected) =>
  [ Icon.view('', isSelected)
  , Title.view(model.title, isSelected)
  ];

export const render =
  (model:Model, address:Address<Action>):DOM =>
  html.section
  ( { style: {borderColor: 'inherit' } }
  , model
    .items
    .slice(0, model.limit)
    .map
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
  ( 'search'
  , render
  , model
  , address
  );
