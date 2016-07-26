/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {always, batch, merge, take, move, nofx, appendFX} from "../../../common/prelude"
import {Effects, html, thunk, forward} from "reflex"
import * as History from "./Assist/History"
import * as Search from "./Assist/Search"
import * as Suggestions from "./Assist/Suggestions"
import * as Suggestion from "./Assist/Suggestion"
import * as HistoryService from "../../../Service/History"
import * as SearchService from "../../../Service/Search"
import * as Unknown from '../../../common/unknown'

import {StyleSheet, Style} from '../../../common/style';
import {indexOfOffset} from "../../../common/selector";



import type {Address, DOM} from "reflex";
export type Flags = boolean

export type Match =
  { match: string
  , hint: string
  , query: string
  }

export class Model {
  isOpen: boolean;
  isExpanded: boolean;
  query: string;
  selected: number
  search: Suggestions.Model<Search.Model>;
  history: Suggestions.Model<History.Model>;
  constructor(
    isOpen: boolean
  , isExpanded: boolean
  , query: string
  , selected: number
  , search: Suggestions.Model<Search.Model>
  , history: Suggestions.Model<History.Model>
  ) {
    this.isOpen = isOpen
    this.isExpanded = isExpanded
    this.query = query
    this.selected = selected
    this.search = search
    this.history = history
  }
}

const getActiveSuggestion =
  ({selected, search, history}:Model):?Search.Model|History.Model =>
  ( selected === -1
  ? null
  : selected < search.index.length
  ? search.values[search.index[selected]]
  : history.values[history.index[search.index.length + selected]]
  )


const isQueryCompatible =
  ({selected, search, history}:Model, query:string):boolean =>
  ( selected === -1
  ? false
  : selected < search.index.length
  ? Search.isMatch(query, search.values[search.index[selected]])
  : History.isMatch(query, history.values[history.index[search.index.length + selected]])
  )

export type Action =
  | { type: "Open" }
  | { type: "Close" }
  | { type: "Expand" }
  | { type: "Reset" }
  | { type: "Unselect" }
  | { type: "SuggestNext" }
  | { type: "SuggestPrevious" }
  | { type: "Query", query: string }
  | { type: "Load", load: string }
  | { type: "Suggest", suggest: Match }
  | { type: "Search", search: Suggestions.Action<Search.Message> }
  | { type: "SelectSearch", selectSearch: string }
  | { type: "SearchResult", searchResult: Array<Search.Model> }
  | { type: "SearchError", searchError: Error }
  | { type: "History", history: Suggestions.Action<History.Message> }
  | { type: "SelectHistory", selectHistory: string }
  | { type: "HistoryResult", historyResult: Array<History.Model> }
  | { type: "HistoryError", historyError: Error }



export const Open:Action = { type: "Open" };
export const Close:Action = { type: "Close" };
export const Expand:Action = { type: "Expand" };
export const Unselect:Action = { type: "Unselect" };
export const Reset:Action = { type: "Reset" };
export const SuggestNext:Action = { type: "SuggestNext" };
export const SuggestPrevious:Action = { type: "SuggestPrevious" };
export const Suggest =
  (suggestion:Match):Action =>
  ( { type: "Suggest"
    , suggest: suggestion
    }
  )

export const Query =
  (input:string):Action =>
  ( { type: "Query"
    , query: input
    }
  )


const SearchAction =
  action => {
    switch (action.type) {
      case "Select":
        return { type: "SelectSearch", selectSearch: action.select }
      default:
        return { type: "Search", search:  action }
    }
  }

const SearchResult =
  matches =>
  ( { type: "SearchResult"
    , searchResult: matches
    }
  )

const SearchError =
  error =>
  ( { type: "SearchError"
    , searchError: error
    }
  )

const HistoryAction =
  action => {
    switch (action.type) {
      case "Select":
        return { type: "SelectHistory", selectHistory: action.select }
      default:
        return { type: "History", history:  action }
    }
  }

const HistoryResult =
  matches =>
  ( { type: "HistoryResult"
    , historyResult: matches
    }
  )

const HistoryError =
  error =>
  ( { type: "HistoryError"
    , historyError: error
    }
  )


const assemble =
  ( isOpen: boolean
  , isExpanded: boolean
  , query: string
  , selected: number
  , [search, search$]
  , [history, history$]
  ) =>
  [ new Model
    ( isOpen
    , isExpanded
    , query
    , selected
    , search
    , history
    )
  , Effects.batch
    ( [ search$.map(SearchAction)
      , history$.map(HistoryAction)
      ]
    )
  ]

export const init =
  ( isOpen:boolean=false
  , isExpanded:boolean=false
  ):[Model, Effects<Action>] =>
  assemble
  ( isOpen
  , isExpanded
  , ''
  , -1
  , Suggestions.init()
  , Suggestions.init()
  )



export const reset =
  (state:Model):[Model, Effects<Action>] =>
  assemble
  ( false
  , false
  , ""
  , -1
  , Suggestions.reset(state.search)
  , Suggestions.reset(state.history)
  )

export const clear =
  (state:Model) =>
  init(state.isOpen, state.isExpanded)

export const expand =
  (state:Model) =>
  setOptions
  ( state
  , true
  , true
  , state.query
  , state.selected
  )

export const open =
  (state:Model) =>
  setOptions
  ( state
  , true
  , false
  , state.query
  , state.selected
  )

export const close =
  (state:Model) =>
  init(false, false)

const setOptions =
  (state, isOpen, isExpanded, query, selected) =>
  nofx
  ( new Model
    ( isOpen
    , isExpanded
    , query
    , selected
    , state.search
    , state.history
    )
  )

export const unselect =
  (state:Model) =>
  setOptions
  ( state
  , state.isOpen
  , state.isExpanded
  , state.query
  , -1
  )

export const query =
  (state:Model, query:string):[Model, Effects<Action>] =>
  ( state.query === query
  ? nofx(state)
  : appendFX
    ( Effects.batch
      ( [ Effects.perform
          ( SearchService
              .query(query, 5)
              .map(SearchResult)
              .recover(SearchError)
          )
        , Effects.perform
          ( HistoryService
              .query(query, 5)
              .map(HistoryResult)
              .recover(HistoryError)
          )
        ]
      )
    , assemble
      ( state.isOpen
      , state.isExpanded
      , query
      , ( isQueryCompatible(state, query)
        ? state.selected
        : -1
        )
      , nofx(state.search)
      , nofx(state.history)
      )
    )
  )

const updateSearch =
  (state, [search, fx]) =>
  [ new Model
    ( state.isOpen
    , state.isExpanded
    , state.query
    , state.selected
    , search
    , state.history
    )
  , Effects.batch
    ( [ fx.map(SearchAction)
      ]
    )
  ]

const updateSearchAndSuggest =
  (state, change) => {
    const [model, fx] = updateSearch(state, change)
    return appendFX(fx, suggest(model, 0))
  }


const delegateSearchUpdate =
  (state, action) =>
  updateSearch(state, Suggestions.update(Search.update, state.search, action))

const updateHistory =
  (state, [history, fx]) =>
  [ new Model
    ( state.isOpen
    , state.isExpanded
    , state.query
    , state.selected
    , state.search
    , history
    )
  , Effects.batch
    ( [ fx.map(HistoryAction)
      ]
    )
  ]

const delegateHistoryUpdate =
  (state, action) =>
  updateHistory(state, Suggestions.update(History.update, state.history, action))


const updateSearchResult =
  (state:Model, matches:Array<Search.Model>):[Model, Effects<Action>] =>
  ( state.selected === -1
  ? updateSearchAndSuggest(state, Suggestions.initWith(Search.id, matches))
  : updateSearch(state, Suggestions.initWith(Search.id, matches))
  )


const updateHistoryResult =
  (state:Model, matches:Array<History.Model>):[Model, Effects<Action>] =>
  updateHistory(state, Suggestions.initWith(History.id, matches))

const selectHistory =
  (state, id) =>
  suggest(state, state.history.index.indexOf(id))

const selectSearch =
  (state, id) =>
  suggest(state, state.search.index.indexOf(id))

export const suggestNext =
  (state:Model):[Model, Effects<Action>] =>
  suggest
  ( state
  , indexOfOffset
    ( state.selected
    , 1
    , state.search.index.length + state.history.index.length
    , true
    )
  )

export const suggestPrevious =
  (state:Model):[Model, Effects<Action>] =>
  suggest
  ( state
  , indexOfOffset
    ( state.selected
    , -1
    , state.search.index.length + state.history.index.length
    , true
    )
  )

export const suggest =
  ( state:Model
  , index:number
  ):[Model, Effects<Action>] => {
    const model = new Model
      ( state.isOpen
      , state.isExpanded
      , state.query
      , index
      , state.search
      , state.history
      )

    const suggestion =
      ( index < 0
      ? null
      : index < state.search.index.length
      ? state.search.values[state.search.index[index]]
      : state.history.values[state.history.index[index - state.search.index.length]]
      )

    const fx =
      ( suggestion == null
      ? Effects.none
      : Effects.receive(Suggest({
          match: suggestion.title,
          hint: suggestion.url,
          query: state.query
        }))
      )

    return [model, fx]
  }

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
        return delegateHistoryUpdate(model, action.history)
      case "HistoryResult":
        return updateHistoryResult(model, action.historyResult)
      case "SelectHistory":
        return selectHistory(model, action.selectHistory)
      case "Search":
        return delegateSearchUpdate(model, action.search)
      case "SearchResult":
        return updateSearchResult(model, action.searchResult)
      case "SelectSearch":
        return selectSearch(model, action.selectSearch)
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
      , [ Suggestions.render
          ( Search.view
          , model.search.index[model.selected]
          , model.search
          , forward(address, SearchAction)
          )
        , Suggestions.render
          ( History.view
          , model.history.index[model.selected - model.search.index.length]
          , model.history
          , forward(address, HistoryAction)
          )
        ]
      )
    ]
  );
