/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {Effects, Task, html, forward, thunk} from "reflex";
import {merge, always, tag, tagged, batch} from "../../common/prelude";
import {Style, StyleSheet} from '../../common/style';
import {indexOfOffset} from "../../common/selector";
import * as Result from '../../common/result';

import * as Title from "./title";
import * as Icon from "./icon";
import * as Suggestion from "./suggestion";
import * as Unknown from '../../common/unknown';

/*::
import * as Search from "../../../type/browser/assistant/search"
import type {Model, Action} from "../../../type/browser/assistant/search"
*/


const Abort = tag("Abort");
export const Terminate = tagged("Terminate");
export const SelectNext = tagged("SelectNext");
export const SelectPrevious = tagged("SelectPrevious");
export const Suggest = tag("Suggest");
export const Query = tag("Query");
export const Reset = tag("Reset");
export const Execute = tag("Execute");
export const Activate = tag("Activate");
const UpdateMatches = tag("UpdateMatches");
const byURI =
  uri =>
  action =>
  tagged("ByURI", {uri, action});

const decodeFailure = ({target: request}) =>
  Result.error
  // @FlowIssue: Flow does not know about `request.url`
  (Error(`Network request to ${request.url} has failed: ${request.statusText}`));

const decodeResponseFailure =
  request =>
  // @FlowIssue: Flow does not know about `request.response`
  Result.error(Error(`Can not decode ${request.respose} received from ${request.url}`))

const decodeMatches =
  matches =>
  ( Array.isArray(matches)
  ? Result.ok(matches.map(decodeMatch))
  : Result.error(Error(`Can not decode non array matches ${matches}`))
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
  ? Result.error(Error(`Can not decode ${request.responseType} type response from ${request.url}`))
  : request.response == null
  ? decodeResponseFailure(request)
  : request.response[1] == null
  ? decodeResponseFailure(request)
  : decodeMatches(request.response[1])
  );

const pendingRequests = Object.create(null);

const abort =
  id =>
  Task.io(deliver => {
    if (pendingRequests[id] != null) {
      pendingRequests[id].abort();
      delete pendingRequests[id];
    }
  });

const search/*:Search.search*/ =
  (id, input, limit) =>
  Task.future(() => new Promise(resolve => {
    const request = new XMLHttpRequest({ mozSystem: true });
    pendingRequests[id] = request;
    const uri = `http://ac.duckduckgo.com/ac/?q=${input}&type=list`
    request.open
    ( 'GET'
    , uri
    , true
    );
    request.responseType = 'json';
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
  }));


export const init/*:Search.init*/ =
  (query, limit) =>
  [ { query
    , size: 0
    , queryID: 0
    , limit
    , selected: -1
    , matches: {}
    , items: []
    }
  , Effects.none
  ];

export const terminate =
  (model/*:Model*/)/*:[Model, Effects<Action>]*/ =>
  [ merge
    ( model
    , { selected: -1
      , query: null
      , queryID: 0
      , matches: {}
      , items: []
      }
    )
  , Effects.task
    (abort(model.queryID))
    .map(Abort)
  ];

export const reset =
  (model/*:Model*/)/*:[Model, Effects<Action>]*/ =>
  [ merge
    ( model
    , { selected: -1
      , query: null
      , queryID: model.queryID + 1
      , matches: {}
      , items: []
      }
    )
  , Effects.none
  ];

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
        , hint: null
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
    ]
  );

const replaceMatches = (model, results) => {
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

export const update/*:Search.update*/ =
  (model, action) =>
  ( action.type === "Query"
  ? updateQuery(model, action.source)
  : action.type === "Reset"
  ? reset(model)
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
  : action.type === "Terminate"
  ? terminate(model)
  : Unknown.update(model, action)
  )

const innerView =
  (model, address, isSelected) =>
  [ Icon.view('', isSelected)
  , Title.view(model.title, isSelected)
  ];

export const render/*:Search.view*/ =
  (model, address) =>
  html.embed
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

export const view/*:Search.view*/ =
  (model, address) =>
  thunk
  ( 'search'
  , render
  , model
  , address
  );
