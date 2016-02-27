/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {always, batch, merge, tag, tagged} from "../common/prelude"
import {Effects, html, thunk, forward} from "reflex"
import * as History from "./assistant/history"
import * as Search from "./assistant/search"
import {StyleSheet, Style} from '../common/style';
import {cursor} from '../common/cursor';
import {prettify} from '../common/url-helper';
import * as Unknown from '../common/unknown';

/*::
import * as type from "../../type/browser/assistant"
import type {Model, Action} from "../../type/browser/assistant"
*/

export const Terminate = tagged("Terminate");
export const Open = tagged("Open");
export const Close = tagged("Close");
export const Expand = tagged("Expand");
export const Unselect = tagged("Unselect");
export const Reset = tagged("Reset");
export const SuggestNext = tagged("SuggestNext");
export const SuggestPrevious = tagged("SuggestPrevious");
export const Suggest = tag("Suggest");
export const Query = tag("Query");
export const Execute = tag("Execute");
export const Activate = tag("Activate");


const SearchAction =
  action =>
  ( action.type === "Suggest"
  ? Suggest(action.source)
  : tagged("Search", action)
  );

const HistoryAction = tag("History");

export const init =
  ()/*:[Model, Effects<Action>]*/ => {
    const query = "";
    const [search, fx1] = Search.init(query, 5);
    const [history, fx2] = History.init(query, 5);

    const model =
      { isOpen: false
      , isExpanded: false
      , query: ""
      , selected: -1
      , search
      , history
      };

    const fx = Effects.batch
    ( [ fx1.map(SearchAction)
      , fx2.map(HistoryAction)
      ]
    )

    return [model, fx]
  }

export const terminate =
  (model/*:Model*/)/*:[Model, Effects<Action>]*/ =>
  batch
  ( update
  , model
  , [ SearchAction(Search.Terminate)
    , HistoryAction(History.Terminate)
    ]
  );

const clear =
  (model, action) =>
  batch
  ( update
  , model
  , [ SearchAction(Search.Reset(action))
    , HistoryAction(History.Reset(action))
    ]
  );

const reset =
  (model, action) =>
  clear
  ( merge
    ( model
    , { isExpanded: false
      , isOpen: false
      }
    )
  );

const expand =
  model =>
  [ merge
    ( model
    , { isOpen: true
      , isExpanded: true
      }
    )
  , Effects.none
  ];

const open =
  model =>
  [ merge
    ( model
    , { isOpen: true
      , isExpanded: false
      }
    )
  , Effects.none
  ];

const close =
  model =>
  clear
  ( merge
    ( model
    , { isOpen: false
      , isExpanded: false
      }
    )
  );

const unselect =
  model =>
  [ merge
    ( model
    , { selected: -1
      }
    )
  , Effects.none
  ];

const query = (model, query) =>
  ( model.query === query
  ? [ model
    , Effects.none
    ]
  : batch
    ( update
    , merge(model, {query})
    , [ SearchAction(Search.Query(query))
      , HistoryAction(History.Query(query))
      ]
    )
  )

const updateSearch =
  cursor
  ( { get: model => model.search
    , set: (model, search) => merge(model, {search})
    , update: Search.update
    , tag: SearchAction
    }
  );

const updateHistory =
  cursor
  ( { get: model => model.history
    , set: (model, history) => merge(model, {history})
    , update: History.update
    , tag: HistoryAction
    }
  );

// TODO: This actually should work across the suggestion
// groups.
const suggestNext =
  model =>
  updateSearch(model, Search.SelectNext);

const suggestPrevious =
  model =>
  updateSearch(model, Search.SelectPrevious);

export const update/*:type.update*/ =
  (model, action) =>
  ( action.type === "Open"
  ? open(model)
  : action.type === "Close"
  ? close(model)
  : action.type === "Expand"
  ? expand(model)
  : action.type === "Reset"
  ? reset(model)
  : action.type === "Unselect"
  ? unselect(model)
  : action.type === "SuggestNext"
  ? suggestNext(model)
  : action.type === "SuggestPrevious"
  ? suggestPrevious(model)
  : action.type === "Query"
  ? query(model, action.source)
  : action.type === "History"
  ? updateHistory(model, action.source)
  : action.type === "Search"
  ? updateSearch(model, action.source)
  : action.type === "Suggest"
  ? [model, Effects.none]
  : action.type === "Terminate"
  ? terminate(model)
  : Unknown.update(model, action)
  );

const styleSheet = StyleSheet.create
  ( { base:
      { background: '#fff'
      , left: '0px'
      , position: 'absolute'
      , top: '0px'
      , width: '100%'
      }
    , expanded:
      { height: '100%'
      }
    , shrinked:
      { minHeight: '120px'
      }

    , open:
      {
      }

    , closed:
      { display: 'none'
      }

    , results:
      { listStyle: 'none'
      , margin: '90px auto 40px'
      , padding: '0px'
      , width: '480px'
      }
    }
  );

export const view/*:type.view*/ = (model, address) =>
  html.div
  ( { className: 'assistant'
    , style: Style
      ( styleSheet.base
      , ( model.isExpanded
        ? styleSheet.expanded
        : styleSheet.shrinked
        )
      , ( model.isOpen
        ? styleSheet.open
        : styleSheet.closed
        )
      )
    }
  , [ html.ol
      ( { className: 'assistant-results'
        , style: styleSheet.results
        }
      , [ History.view
          ( model.history
          , forward(address, HistoryAction)
          )
        , Search.view
          ( model.search
          , forward(address, SearchAction)
          )
        ]
      )
    ]
  );
