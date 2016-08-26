/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, Task, html, forward, thunk} from "reflex"
import * as Unknown from "../../../Common/Unknown"
import {merge, setIn, nofx, appendFX} from "../../../Common/Prelude"
import * as Suggestion from "./Assistant/Suggestion"
import * as SuggestionStyle from "./Assistant/Suggestion/StyleSheet"
import * as Selector from "./Assistant/Selector"
import * as Search from "./Assistant/Search"
import * as History from "./Assistant/History"
import * as HistoryService from "../../../Service/History"
import * as SearchService from "../../../Service/Search"
import * as Style from '../../../Common/Style';
import type {DOM, Address} from "reflex"

// # Model

export type Match = Suggestion.Completion
export type Action = Message
export type Options = boolean

export class Model {
  isOpen: boolean;
  isExpanded: boolean;
  query: string;
  selector: Selector.Model;
  suggestions: Array<Suggestion.Model>;
  constructor(
    isOpen: boolean
  , isExpanded: boolean
  , query: string
  , suggestions: Array<Suggestion.Model>
  , selector: Selector.Model
  ) {
    this.isOpen = isOpen
    this.isExpanded = isExpanded
    this.query = query
    this.suggestions = suggestions
    this.selector = selector
  }
}


export type Message =
  | { type: "Open" }
  | { type: "Close" }
  | { type: "Expand" }
  | { type: "Reset" }
  | { type: "Clear" }
  | { type: "Deselect" }
  | { type: "SuggestNext" }
  | { type: "SuggestPrevious" }
  | { type: "Select", id: string }
  | { type: "Activate", id: string }
  | { type: "Selector", selector: Selector.Model }
  | { type: "Query", query: string, suggest: boolean }
  | { type: "Load", load: string }
  | { type: "Suggest", suggest: Suggestion.Completion }
  | { type: "SelectSearch", selectSearch: string }
  | { type: "SearchResult", searchResult: Array<Search.Model>, suggest: boolean }
  | { type: "SearchError", searchError: Error }
  | { type: "HistoryResult", historyResult: Array<History.Model>, suggest: boolean }
  | { type: "HistoryError", historyError: Error }
  | { type: "Suggestion", suggestion: { to: string, message: Suggestion.Message } }

const tagSelector =
  (state:Selector.Model):Message =>
  ( { type: "Selector"
    , selector: state
    }
  )



const config = Selector.configure
  ( { toID: Suggestion.toID
    , viewOption: Suggestion.view
    , onOptionMessage:
        (id, message):Message =>
        ( { type: "Suggestion"
          , suggestion: { to: id, message }
          }
        )
    , onSelect: (id:string):Message => ({ type: "Select", id })
    , onActivate: (id:string):Message => ({ type: "Activate", id })
    , selectorStyle:
      { listStyle: 'none'
      , borderColor: 'inherit'
      , margin: '90px auto 40px'
      , padding: '0px'
      , width: '480px'
      }
    , deselectedOptionStyle: SuggestionStyle.deselected
    , selectedOptionStyle: SuggestionStyle.selected
    }
  )

// # Update

export const update =
  ( model:Model
  , action:Message
  ):[Model, Effects<Message>] => {
    switch (action.type) {
      case "Open":
        return open(model)
      case "Close":
        return close(model)
      case "Expand":
        return expand(model)
      case "Reset":
        return reset(model)
      case "Clear":
        return clear(model)
      case "Deselect":
        return deselect(model)
      case "SuggestNext":
        return suggestNext(model)
      case "SuggestPrevious":
        return suggestPrevious(model)
      case "Select":
        return suggest(model, action.id)
      case "Query":
        return query(model, action.query, action.suggest)
      case "HistoryResult":
        return updateHistoryResult(model, action.historyResult, action.suggest)
      case "SearchResult":
        return updateSearchResult(model, action.searchResult, action.suggest)
      default:
        return Unknown.update(model, action)
    }
  }


export const init =
  ( isOpen:boolean=false
  , isExpanded:boolean=false
  ):[Model, Effects<Message>] =>
  assemble
  ( isOpen
  , isExpanded
  , ''
  , []
  , Selector.init()
  )

const assemble =
  ( isOpen: boolean
  , isExpanded: boolean
  , query: string
  , suggestions:Array<Suggestion.Model>
  , selector: Selector.Model
  ) =>
  nofx
  ( new Model
    ( isOpen
    , isExpanded
    , query
    , suggestions
    , selector
    )
  )

export const clear =
  (state:Model) =>
  init(state.isOpen, state.isExpanded)

export const reset =
  (state:Model) =>
  init(false, false)

export const expand =
  (state:Model) =>
  assemble
  ( true
  , true
  , state.query
  , state.suggestions
  , state.selector
  )

export const open =
  (state:Model) =>
  assemble
  ( true
  , false
  , state.query
  , state.suggestions
  , state.selector
  )

export const close =
  (state:Model) =>
  init(false, false)


export const selectNext =
  (state:Model):[Model, Effects<Message>] =>
  swapSelector
  ( state
  , Selector.selectNext(config, state.selector, state.suggestions)
  )

export const selectPrevious =
  (state:Model):[Model, Effects<Message>] =>
  swapSelector
  ( state
  , Selector.selectPrevious(config, state.selector, state.suggestions)
  )

export const select =
  (state:Model, id:string):[Model, Effects<Message>] =>
  swapSelector(state, Selector.select(state.selector, id))

export const deselect =
  (state:Model) =>
  swapSelector(state, Selector.deselect(state.selector))

export const swapSelector =
  (state:Model, selector:Selector.Model):[Model, Effects<Message>] =>
  nofx
  ( new Model
    ( state.isOpen
    , state.isExpanded
    , state.query
    , state.suggestions
    , selector
    )
  )

export const suggestPrevious =
  (state:Model):[Model, Effects<Message>] =>
  swapSelectorAndSuggest
  ( state
  , Selector.selectPrevious(config, state.selector, state.suggestions)
  )

export const suggestNext =
  (state:Model):[Model, Effects<Message>] =>
  swapSelectorAndSuggest
  ( state
  , Selector.selectNext(config, state.selector, state.suggestions)
  )

export const suggest =
  (state:Model, id:string):[Model, Effects<Message>] =>
  swapSelectorAndSuggest(state, Selector.select(state.selector, id))

export const swapSelectorAndSuggest =
  (state:Model, selector:Selector.Model):[Model, Effects<Message>] =>
  suggestSelected
  ( new Model
    ( state.isOpen
    , state.isExpanded
    , state.query
    , state.suggestions
    , selector
    )
  )



const suggestSelected =
  (state:Model):[Model, Effects<Message>] =>
  [ state
  , fxForSuggestion(state.query, getSelectedSuggestion(state))
  ]

const fxForSuggestion =
  (query:string, suggestion:?Suggestion.Model):Effects<Message> =>
  ( suggestion == null
  ? Effects.none
  : Effects.receive(Suggest(Suggestion.completion(query, suggestion)))
  )

export const Suggest =
  (suggestion:Suggestion.Completion):Message =>
  ( { type: "Suggest"
    , suggest: suggestion
    }
  )



export const updateSuggestion =
  (state:Model, id:string, message:Suggestion.Message):[Model, Effects<Message>] => {
    const index = state.suggestions.findIndex(item => config.toID(item) === id)
    if (index > -1) {
      return swapSuggestion(
        state
      , index
      , Suggestion.update(state.suggestions[index], message)
      )
    }
    else {
      return [
        state
      , Effects.perform(Unknown.warn(`Suggestion with id ${id} does not exist`))
      ]
    }
  }

export const swapSuggestion =
  ( state:Model
  , index:number
  , [suggestion, fx]:[Suggestion.Model, Effects<Suggestion.Message>]):[Model, Effects<Message>] =>
  [ new Model
    ( state.isOpen
    , state.isExpanded
    , state.query
    , setIn(state.suggestions, index, suggestion)
    , state.selector
    )
  , fx.map(message => config.onOptionMessage(config.toID(suggestion), message))
  ]

export const query =
  (state:Model, query:string, suggest:boolean):[Model, Effects<Message>] =>
  ( state.query === query
  ? nofx(state)
  : appendFX
    ( Effects.batch
      ( [ Effects.perform
          ( SearchService
              .query(query, 5)
              .map
                ( suggest
                ? UpdateSearchAndSuggest
                : UpdateSearch
                )
              .recover(SearchError)
          )
        , Effects.perform
          ( HistoryService
              .query(query, 5)
              .map
                ( suggest
                ? UpdateHistoryAndSuggest
                : UpdateHistory
                )
              .recover(HistoryError)
          )
        ]
      )
    , assemble
      ( state.isOpen
      , state.isExpanded
      , query
      , state.suggestions
      , ( isQueryMatchingSelectedSuggestion(state, query)
        ? state.selector
        : Selector.deselect(state.selector)
        )
      )
    )
  )

const getSuggestionByID =
  (id:string, suggestions:Array<Suggestion.Model>):?Suggestion.Model =>
  suggestions.find(item => config.toID(item) === id)

const getSelectedSuggestion =
  ({selector, suggestions}:Model):?Suggestion.Model =>
  ( selector.selected == null
  ? null
  : getSuggestionByID(selector.selected, suggestions)
  )

const isQueryMatchingSelectedSuggestion =
  (state:Model, query:string):boolean => {
    const suggestion = getSelectedSuggestion(state)
    if (suggestion == null) {
      return false
    }
    else {
      return Suggestion.isMatch(query, suggestion)
    }
  }

const updateSearchResult =
  (state:Model, results:Array<Search.Model>, suggest:boolean):[Model, Effects<Message>] => {
    const selectedID = state.selector.selected
    const selected = getSelectedSuggestion(state)
    const suggestions =
      ( selected == null
      ? []
      : Suggestion.isSearch(selected)
      ? [selected]
      : []
      )

    for (let result of results) {
      const suggestion = Suggestion.tagSearch(result)
      const id = config.toID(suggestion)
      if (id !== selectedID) {
        suggestions.push(suggestion)
      }
    }

    for (let suggestion of state.suggestions) {
      if (!Suggestion.isSearch(suggestion)) {
        suggestions.push(suggestion)
      }
    }

    return updateSuggestions(state, suggestions, suggest)
  }

const updateHistoryResult =
  (state:Model, results:Array<History.Model>, suggest:boolean):[Model, Effects<Message>] => {
    const selectedID = state.selector.selected
    const selected = getSelectedSuggestion(state)
    const suggestions =
      ( selected == null
      ? []
      : Suggestion.isHistory(selected)
      ? [selected]
      : []
      )

    for (let result of results) {
      const suggestion = Suggestion.tagHistory(result)
      const id = config.toID(suggestion)
      if (id !== selectedID) {
        suggestions.push(suggestion)
      }
    }

    for (let suggestion of state.suggestions) {
      if (!Suggestion.isHistory(suggestion)) {
        suggestions.unshift(suggestion)
      }
    }

    return updateSuggestions(state, suggestions, suggest)
  }

export const swapSuggestions =
  (state:Model, suggestions:Array<Suggestion.Model>):[Model, Effects<Message>] =>
  nofx
  ( new Model
    ( state.isOpen
    , state.isExpanded
    , state.query
    , suggestions
    , state.selector
    )
  )

export const updateSuggestions =
  (state:Model, suggestions:Array<Suggestion.Model>, suggest:boolean):[Model, Effects<Message>] =>
  ( ( suggest && state.selector.selected == null )
  ? suggestTop(state, suggestions, suggestions[0])
  : swapSuggestions(state, suggestions)
  )

export const suggestTop =
  ( state:Model
  , suggestions:Array<Suggestion.Model>
  , top:?Suggestion.Model
  ):[Model, Effects<Message>] =>
  ( top == null
  ? swapSuggestions(state, suggestions)
  : Suggestion.isMatch(state.query, top)
  ? suggestSelected
    ( new Model
      ( state.isOpen
      , state.isExpanded
      , state.query
      , suggestions
      , Selector.select(state.selector, config.toID(top))
      )
    )
  : swapSuggestions(state, suggestions)
  )

const UpdateSearch =
  matches =>
  ( { type: "SearchResult"
    , searchResult: matches
    , suggest: false
    }
  )

const UpdateSearchAndSuggest =
  matches =>
  ( { type: "SearchResult"
    , searchResult: matches
    , suggest: true
    }
  )

const SearchError =
  error =>
  ( { type: "SearchError"
    , searchError: error
    }
  )

const UpdateHistory =
  matches =>
  ( { type: "HistoryResult"
    , historyResult: matches
    , suggest: false
    }
  )

const UpdateHistoryAndSuggest =
  matches =>
  ( { type: "HistoryResult"
    , historyResult: matches
    , suggest: true
    }
  )

const HistoryError =
  error =>
  ( { type: "HistoryError"
    , historyError: error
    }
  )

export const Query =
  (query:string, suggest:boolean):Action =>
  ( { type: "Query"
    , query
    , suggest
    }
  )

export const Open = { type: "Open" }
export const Close = { type: "Close" }
export const Expand = { type: "Expand" }
export const Deselect:Action = { type: "Deselect" }
export const Reset = { type: "Reset" }
export const Clear = { type: "Clear" }
export const SuggestNext = { type: "SuggestNext" }
export const SuggestPrevious = { type: "SuggestPrevious" }



export const render =
  (state:Model, address:Address<Message>):DOM =>
  html.div
  ( { className: 'assistant'
    , style: Style.mix
      ( styleSheet.base
      , ( state.isExpanded
        ? styleSheet.expanded
        : styleSheet.shrinked
        )
      , ( state.isOpen
        ? styleSheet.open
        : styleSheet.closed
        )
      )
    }
  , [ Selector.view
      ( config
      , state.selector
      , state.suggestions
      , address
      )
    ]
  )

export const view =
  (state:Model, address:Address<Message>):DOM =>
  thunk
  ( 'Browser/Navigators/Navigator/Assist/Suggestions'
  , render
  , state
  , address
  )

const styleSheet = Style.createSheet
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
    }
  );
