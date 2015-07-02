/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const MAX_RESULTS = 6;

  const {html, render} = require('reflex');
  const {Record, List, Union} = require('common/typed');
  const {mix} = require('common/style');
  const ClassSet = require('common/class-set');
  const Loader = require('./web-loader');
  const History = require('service/history');
  const Search = require('service/search');

  // Model

  const {Result: SearchResult, Match: SearchMatch} = Search.Event;
  const {PageResult, PageMatch} = History.Event;

  const Suggestion = Union({
    Search: SearchMatch,
    Page: PageMatch
  }, 'Suggestion');
  exports.Suggestion = Suggestion;

  const Model = Record({
    entries: List(Suggestion),
    selected: -1
  }, 'Suggestions');
  exports.Model = Model;

  // Action

  const SelectRelative = Record({
    id: '@selected',
    offset: 0
  }, 'Suggestions.SelectRelative');

  const SelectNext = Record({
    id: '@selected',
    offset: 1
  }, 'Suggestions.SelectNext')

  const SelectPrevious = Record({
    id: '@selected',
    offset: -1
  }, 'Suggestions.SelectPrevious')

  const Unselect = Record({
    id: '@selected',
    index: -1
  }, 'Suggestions.Unselect');

  const Clear = Record({
    id: '@seleceted'
  }, "suggestions.Clear");

  const Action = Union({
    SelectRelative, SelectPrevious, SelectNext, Unselect, Clear,
    SearchResult, PageResult
  });
  exports.Action = Action;


  // Update

  // Selects suggestion `n` items away relative to currently seleceted suggestion.
  // Selection over suggestion entries is moved in a loop although there is extra
  // "no selection" entry between last and first suggestions. Given `n` can be negative
  // or positive in order to select suggestion before or after the current one.
  const selectRelative = (state, offset) =>
    state.update('selected', index => {
      const none = -1;
      const last = state.entries.count() - 1;
      const to = index + offset;

      return to > last ? none :
             to < none ? last :
             to;
    });


  const isntSearch = entry => !(entry instanceof SearchMatch);
  const isntPage = entry => !(entry instanceof PageMatch);

  const updateSearch = (state, {results: matches}) => {
    const entries = state.entries.filter(isntSearch);
    const count = Math.min(matches.count(),
                           MAX_RESULTS - Math.min(MAX_RESULTS / 2, entries.count()));

    return state.merge({
      selected: -1,
      entries: entries.take(count)
                      .concat(matches.slice(0, count))
    });
  };

  const updatePage = (state, {results: matches}) => {
    const entries = state.entries.filter(isntPage);
    const count = Math.min(matches.count(),
                           MAX_RESULTS - Math.min(MAX_RESULTS / 2, entries.count()));
    const pages = matches.take(count);

    return state.merge({
      selected: -1,
      entries: entries.unshift(...pages)
                      .take(MAX_RESULTS)
    });
  };


  const update = (state, action) =>
    action instanceof SelectRelative ? selectRelative(state, action.offset) :
    action instanceof SelectNext ? selectRelative(state, 1) :
    action instanceof SelectPrevious ? selectRelative(state, -1) :
    action instanceof Unselect ? state.remove('selected') :
    action instanceof Clear ? state.clear() :
    action instanceof SearchResult ? updateSearch(state, action) :
    action instanceof PageResult ? updatePage(state, action) :
    state;
  exports.update = update;


  // Style

  const styleSuggestionsContainer = {
    textAlign: 'center',
    width: '100vw',
    position: 'absolute',
    top: 44,
    zIndex: 43,
    height: 260,
    pointerEvents: 'none'
  };

  const hidden = {
    pointerEvents: 'none',
    opacity: 0
  };

  const styleSuggestions = {
    display: 'inline-block',
    textAlign: 'left',
    width: 400,
    pointerEvents: 'all',
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingTop: 20
  };

  const styleSuggestionFirstOfType = {
    borderTop: 0
  };

  const styleSuggestion = {
    lineHeight: '40px',
    verticalAlign: 'middle',
    borderTop: '1px solid rgba(0,0,0,0.05)',
    cursor: 'pointer'
  };

  const styleSuggestionSelected = {
    backgroundClip: 'content-box',
    backgroundColor: 'rgba(0,0,0,0.05)'
  };

  const styleDarkSuggestion = {
    borderTopColor: 'rgba(255,255,255,0.15)'
  };

  const styleDarkSuggestionSelected = {
    backgroundColor: 'rgba(255,255,255,0.15)'
  };

  const styleSuggestionPrefix = {
    display: 'inline-block',
    fontSize: '16px',
    fontFamily: 'FontAwesome',
    width: 30,
    textAlign: 'center'
  };


  // View

  const SEARCH_ICON = '\uf002';
  const HISTORY_ICON = '\uf14e';

  const Icon = {
    'search': SEARCH_ICON,
    'history': HISTORY_ICON
  };

  const {Load} = Loader.Action;

  const viewSuggestion = (state, selected, index, theme, address) => {
    let style = styleSuggestion;
    if (index == selected)
      style = mix(style, styleSuggestionSelected);
    if (theme.isDark)
      style = mix(style, styleDarkSuggestion);
    if (theme.isDark && index == selected)
      style = mix(style, styleDarkSuggestionSelected);

    const type = state instanceof PageMatch ? 'history' :
                 state instanceof SearchMatch ? 'search' :
                 null;

    return html.p({
      style,
      className: ClassSet({
        suggestion: true,
        history: state instanceof PageMatch,
        search: state instanceof SearchMatch,
        selected: index === selected
      }),
      onMouseDown: address.pass(Load, state)
    }, [
      html.span({
        key: 'suggestionprefix',
        style: styleSuggestionPrefix,
      }, Icon[type] || ''),
      html.span({
        key: 'suggestion'
      }, state.title)
    ]);
  };
  exports.viewSuggestion = viewSuggestion;

  const view = (state, isActive, theme, address) => {
    const style = mix(styleSuggestionsContainer, {
      color: theme.foreground
    });

    return html.div({
      style: (isActive && state.entries.size > 0) ? style :
             mix(style, hidden),
      key: 'suggestionscontainer',
    }, [
      html.div({
        key: 'suggestions',
        style: styleSuggestions
      }, state.entries.map((entry, index) => {
        return render(`suggestion@${index}`, viewSuggestion,
                      entry, state.selected, index, theme,
                      address);
      }))
    ]);
  };
  exports.view = view;
});
