/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {Effects, Task, html, forward, thunk} from "reflex";
import {merge, always, batch} from "../../common/prelude";
import {Style, StyleSheet} from '../../common/style';
import {indexOfOffset} from "../../common/selector";
import {ok, error} from '../../common/result';

import * as Title from "./title";
import * as Icon from "./icon";
import * as Suggestion from "./suggestion";
import * as Unknown from '../../common/unknown';

/*::
import type {Address, DOM, Never} from "reflex";
import type {Result} from "../../common/result";
import type {Completion, Match, Model, Action} from "./search";
*/

const NoOp = always({type: "NoOp"});

const Abort =
  queryID =>
  ( { type: "Abort"
    , source: queryID
    }
  );

export const SelectNext = { type: "SelectNext" };
export const SelectPrevious = { type: "SelectPrevious" };
export const Suggest =
  (suggestion/*:Completion*/)/*:Action*/ =>
  ( { type: "Suggest"
    , source: suggestion
    }
  );

export const Query =
  (input/*:string*/)/*:Action*/ =>
  ( { type: "Query"
    , source: input
    }
  );

export const Activate =
  ()/*:Action*/ =>
  ( { type: "Activate"
    }
  );

const Load =
  (uri) =>
  ( { type: "Load"
    , uri
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

const decodeFailure = ({target: request}) =>
  error
  // @FlowIssue: Flow does not know about `request.url`
  (Error(`Network request to ${request.url} has failed: ${request.statusText}`));

const decodeResponseFailure =
  request =>
  // @FlowIssue: Flow does not know about `request.response`
  error(Error(`Can not decode ${request.respose} received from ${request.url}`))

const decodeMatches =
  matches =>
  ( Array.isArray(matches)
  ? ok(matches.map(decodeMatch))
  : error(Error(`Can not decode non array matches ${matches}`))
  );

const decodeMatch =
  match =>
  ( { title: match
    , uri: `https://duckduckgo.com/?q=${encodeURIComponent(match)}`
    }
  );

const decodeResponse = ({target: request}) =>
  // @FlowIssue: Flow does not know about `request.responseType`
  ( request.responseType !== 'json'
  // @FlowIssue: Flow does not know about `request.url`
  ? error(Error(`Can not decode ${request.responseType} type response from ${request.url}`))
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
  ( id/*:number*/
  , input/*:string*/
  , limit/*:number*/
  )/*:Task<Never, Result<Error, Array<Match>>>*/ =>
  Task.create(resolve => {
    const request = new XMLHttpRequest({ mozSystem: true });
    pendingRequests[id] = request;
    const uri = `http://ac.duckduckgo.com/ac/?q=${input}&type=list`
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
      resolve(decodeFailure(event));
    };
    request.onload = event => {
      delete pendingRequests[id];
      resolve(decodeResponse(event));
    };

    request.send();
  });


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
  [ merge(model, {selected: -1})
  , Effects.none
  ]

const suggest = model =>
  [ model
  , Effects.receive
    ( Suggest
      ( { match: model.matches[model.items[model.selected]].title
        , hint: ''
        }
      )
    )
  ]

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
      , { query: ""
        , selected: -1
        , matches: {}
        , items: []
        }
      )
    , Effects.task
      (abort(model.queryID))
      .map(Abort)
    ]
  : [ merge(model, {query, queryID: model.queryID + 1 })
    , Effects.batch
      ( [ Effects.task
          (abort(model.queryID))
          .map(Abort)

        , Effects.task
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
    , Effects.task(Unknown.error(result.error))
      .map(NoOp)
    ]
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
  : action.type === "ByURI"
  ? updateByURI(model, action.source)
  : action.type === "Activate"
  ? activate(model)
  : Unknown.update(model, action)
  )

const innerView =
  (model, address, isSelected) =>
  [ Icon.view('', isSelected)
  , Title.view(model.title, isSelected)
  ];

export const render =
  (model/*:Model*/, address/*:Address<Action>*/)/*:DOM*/ =>
  html.section
  ( null
  , model
    .items
    .slice(0, model.limit)
    .map
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
  ( 'search'
  , render
  , model
  , address
  );
