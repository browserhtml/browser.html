/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {always, batch, merge, take, move} from "../../../common/prelude"
import {Effects, html, thunk, forward} from "reflex"
import * as History from "./Assistant/history"
import * as Search from "./Assistant/search"
import {StyleSheet, Style} from '../../../common/style';
import {cursor} from '../../../common/cursor';
import * as Unknown from '../../../common/unknown';


import type {Address, DOM} from "reflex";

export type Flags = boolean

export type Suggestion =
  { match: string
  , hint: string
  , query: string
  }

export type Model =
  { isOpen: boolean
  , isExpanded: boolean
  , query: string
  , selected: number
  , search: Search.Model
  , history: History.Model
  }

export type Action =
  | { type: "Open" }
  | { type: "Close" }
  | { type: "Expand" }
  | { type: "Reset" }
  | { type: "Unselect" }
  | { type: "SuggestNext" }
  | { type: "SuggestPrevious" }
  | { type: "Query", query: string }
  | { type: "Suggest", suggest: Suggestion }
  | { type: "Search", search: Search.Action }
  | { type: "History", history: History.Action }
  | { type: "Load", load: string }



export const Open:Action = { type: "Open" };
export const Close:Action = { type: "Close" };
export const Expand:Action = { type: "Expand" };
export const Unselect:Action = { type: "Unselect" };
export const Reset:Action = { type: "Reset" };
export const SuggestNext:Action = { type: "SuggestNext" };
export const SuggestPrevious:Action = { type: "SuggestPrevious" };
export const Suggest =
  (suggestion:Suggestion):Action =>
  ( { type: "Suggest"
    , suggest: suggestion
    }
  )

export const Query =
  (input:string):Action =>
  ( { type: "Query"
    , query: input
    }
  );


const SearchAction =
  action =>
  ( action.type === "Suggest"
  ? Suggest(action.suggest)
  : action.type === "Load"
  ? action
  : { type: "Search"
    , search: action
    }
  );

const HistoryAction =
  action =>
  ( { type: "History"
    , history: action
    }
  );

export const init =
  ( isOpen:boolean=false
  , isExpanded:boolean=false
  ):[Model, Effects<Action>] => {
    const query = ''
    const [search, fx1] = Search.init(query, 5);
    const [history, fx2] = History.init(query, 5);
    const fx = Effects.batch
      ( [ fx1.map(SearchAction)
        , fx2.map(HistoryAction)
        ]
      );

    const model =
      { isOpen
      , isExpanded
      , query
      , search
      , history
      , selected: -1
    };

    return [model, fx]
  };

const reset =
  state => {
    const [search, search$] = Search.reset(state.search);
    const [history, history$] = History.reset(state.history);

    const model = {
      isOpen: false,
      isExpanded: false,
      query: "",
      selected: -1,
      search,
      history
    }

    const fx = Effects.batch
      ( [ search$.map(SearchAction)
        , history$.map(HistoryAction)
        ]
      )

    return [model, fx]
  }

const clear =
  model =>
  init(model.isOpen, model.isExpanded);

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

export const update =
  ( model:Model
  , action:Action
  ):[Model, Effects<Action>] => {
    switch (action.type) {
      case "Open":
        return open(model)
      case "Close":
        return close(model)
      case "Expand":
        return expand(model)
      case "Reset":
        return reset(model)
      case "Unselect":
        return unselect(model)
      case "SuggestNext":
        return suggestNext(model)
      case "SuggestPrevious":
        return suggestPrevious(model)
      case "Query":
        return query(model, action.query)
      case "History":
        return updateHistory(model, action.history)
      case "Search":
        return updateSearch(model, action.search)
      case "Suggest":
        return [model, Effects.none]
      default:
        return Unknown.update(model, action)
    }
  };

const styleSheet = StyleSheet.create
  ( { base:
      { background: 'inherit'
      , borderColor: 'inherit'
      , left: '0px'
      , position: 'absolute'
      , top: '0px'
      , width: '100%'
      }
    , expanded:
      { height: '100%'
      }
    , shrinked:
      { minHeight: '110px'
      }

    , open:
      {
      }

    , closed:
      { display: 'none'
      }

    , results:
      { listStyle: 'none'
      , borderColor: 'inherit'
      , margin: '90px auto 40px'
      , padding: '0px'
      , width: '480px'
      }
    }
  );

export const view =
  (model:Model, address:Address<Action>):DOM =>
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
