/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {always, batch, merge, take, move} from "../common/prelude"
import {Effects, html, thunk, forward} from "reflex"
import * as History from "./assistant/history"
import * as Search from "./assistant/search"
import {StyleSheet, Style} from '../common/style';
import {cursor} from '../common/cursor';
import * as Unknown from '../common/unknown';

/*::
import type {Address, DOM} from "reflex";
import type {Suggestion, Model, Action} from "./assistant";
*/


export const Open/*:Action*/ = { type: "Open" };
export const Close/*:Action*/ = { type: "Close" };
export const Expand/*:Action*/ = { type: "Expand" };
export const Unselect/*:Action*/ = { type: "Unselect" };
export const Reset/*:Action*/ = { type: "Reset" };
export const SuggestNext/*:Action*/ = { type: "SuggestNext" };
export const SuggestPrevious/*:Action*/ = { type: "SuggestPrevious" };
export const Suggest =
  (suggestion/*:Suggestion*/)/*:Action*/ =>
  ( { type: "Suggest"
    , source: suggestion
    }
  )

export const Query =
  (input/*:string*/)/*:Action*/ =>
  ( { type: "Query"
    , source: input
    }
  );


const SearchAction =
  action =>
  ( action.type === "Suggest"
  ? Suggest(action.source)
  : { type: "Search"
    , source: action
    }
  );

const HistoryAction =
  action =>
  ( { type: "History"
    , source: action
    }
  );

export const init =
  ( isOpen/*:boolean*/=false
  , isExpanded/*:boolean*/=false
  )/*:[Model, Effects<Action>]*/ => {
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
  model =>
  init();

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
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ =>
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

export const view =
  (model/*:Model*/, address/*:Address<Action>*/)/*:DOM*/ =>
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
