/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const MAX_RESULTS = 6;

  const {getDomainName} = require('../common/url-helper');
  const {html, thunk:render, forward} = require('reflex');
  const {Record, List, Maybe, Union} = require('typed-immutable');
  const {StyleSheet, Style} = require('../common/style');
  const ClassSet = require('../common/class-set');
  const Loader = require('./web-loader');
  const WebView = require('./web-view');
  const History = require('../service/history');
  const Search = require('../service/search');
  const {compose} = require('../lang/functional');

  // Model

  const Suggestion = Union(Search.Match, History.PageMatch, History.TopHit);
  exports.Suggestion = Suggestion;

  const Suggestions = List(Suggestion, 'Suggestions');

  const Model = Record({
    selected: -1,
    topHit: Maybe(History.TopHit),
    page: List(History.PageMatch),
    search: List(Search.Match)
  }, 'Suggestions');
  exports.Model = Model;


  // Counts number of available suggestions in the above defined model instance.
  const count = ({topHit, search, page}) =>
    (topHit != null ? 1 : 0) +
    Math.min(search.size + page.size, MAX_RESULTS);
  exports.count = count;

  const counts = (model) => {
    const half = Math.floor(MAX_RESULTS / 2);
    const topHit = model.topHit != null ? 1 : 0;
    const search = Math.min(model.search.size,
                            Math.max(MAX_RESULTS - model.page.size, half));
    const page = MAX_RESULTS - search;
    return {topHit, search, page}
  }

  // Returns entries in the form of a list `[topHit, ...search, ...page]` where
  // there can be at most one `topHit` and sum of search and page entries are
  // at most MAX_RESULTS also entries per type is split by even when possible.
  const entries = model => {
    const sizes = counts(model);
    return Suggestions(sizes.topHit === 0 ? null : [model.topHit])
      .concat(model.search.take(sizes.search))
      .concat(model.page.take(sizes.page));
  };
  exports.entries = entries;


  // Action

  const SelectRelative = Record({
    offset: 0
  }, 'Suggestions.SelectRelative');
  exports.SelectRelative = SelectRelative;

  const SelectNext = Record({
    offset: 1
  }, 'Suggestions.SelectNext');
  exports.SelectNext = SelectNext;

  const SelectPrevious = Record({
    offset: -1
  }, 'Suggestions.SelectPrevious');
  exports.SelectPrevious = SelectPrevious;

  const Unselect = Record({
    index: -1
  }, 'Suggestions.Unselect');
  exports.Unselect = Unselect;

  const Clear = Record({
    description: 'reset suggestions'
  }, 'suggestions.Clear');
  exports.Clear = Clear;

  exports.SearchResult = Search.Result;
  exports.PageResult = History.PageResult;


  // Update

  // Selects suggestion `n` items away relative to currently selected suggestion.
  // Selection over suggestion entries is moved in a loop although there is extra
  // "no selection" entry between last and first suggestions. Given `n` can be negative
  // or positive in order to select suggestion before or after the current one.
  const selectRelative = (state, offset) => {
    const none = -1;
    const last = count(state) - 1;
    const to = state.selected + offset;
    return state.set('selected',
                      to > last ? none :
                      to < none ? last :
                      to);
  };



  const retainEntry = (before, after, retained, size) => {
    const afterIndex = after.findIndex(x => x.uri === retained.uri);
    if (afterIndex < 0) {
      const beforeIndex = before.indexOf(retained);
      const index = Math.min(beforeIndex, size - 1);
      // If prior index is with in a new range for the type insert retained
      // retained node into same index otherwise put it as a last visible
      // entry.
      return after.splice(index, 0, retained);
    }
    else {
      if (afterIndex < size) {
        return after.set(afterIndex, retained);
      } else {
        return after.remove(afterIndex).splice(size - 1, 0, retained);
      }
    }
  };

  // If updated entries no longer have item that was selected we reset
  // a selection. Otherwise we update a selection to have it keep the item
  // which was selected.
  const retainSelected = (before, after) => {
    // If there was no selected entry there is nothing to retain so
    // return as is.
    if (before.selected < 0) {
      return after
    } else {
      // Grab entry that we wish to retain and act by it's type. We also need
      const retained = entries(before).get(before.selected);

      const next =
        retained instanceof History.TopHit ?
          after.set('topHit', retained) :
        retained instanceof Search.Match ?
          after.set('search', retainEntry(before.search,
                                          after.search,
                                          retained,
                                          counts(after).search)) :
        retained instanceof History.PageMatch ?
          after.set('page', retainEntry(before.page,
                                        after.page,
                                        retained,
                                        counts(after).page)) :
          after;

      return next.set('selected', entries(next).indexOf(retained));
    }
  };


  const updateSearch = (state, {results: search}) =>
    state.set('search', search);

  const updatePage = (state, {topHit, matches: page}) =>
    state.merge({topHit, page});

  const clear = state => state.clear();
  exports.clear = clear;

  const update = (state, action) =>
    action instanceof SelectRelative ? selectRelative(state, action.offset) :
    action instanceof SelectNext ? selectRelative(state, 1) :
    action instanceof SelectPrevious ? selectRelative(state, -1) :
    action instanceof Unselect ? state.remove('selected') :
    action instanceof Clear ? state.clear() :
    action instanceof Search.Result ?
      retainSelected(state, updateSearch(state, action)) :
    action instanceof History.PageResult ?
      retainSelected(state, updatePage(state, action)) :
    state;
  exports.update = update;


  // Style

  const style = StyleSheet.create({
    container: {
      textAlign: 'center',
      width: '100vw',
      position: 'absolute',
      top: '40px',
      zIndex: 43,
      height: '260px',
      pointerEvents: 'none'
    },
    collapsed: {
      display: 'none'
    },
    suggestions: {
      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
      color: 'rgba(0,0,0,0.7)',
      display: 'inline-block',
      textAlign: 'left',
      width: '400px',
      overflow: 'hidden',
      pointerEvents: 'all',
      backgroundColor: '#fff',
      borderRadius: '5px',
      padding: '30px 0 5px'
    },
    first: {
      borderTop: 0
    },
    suggestion: {
      lineHeight: '30px',
      paddingLeft: '10px',
      paddingRight: '10px',
      verticalAlign: 'middle',
      cursor: 'pointer',
      overflow: 'hidden',
      // Contains absolute elements
      position: 'relative',
      textOverflow: 'ellipsis',
    },
    hasIcon: {
      paddingLeft: '30px',
    },
    selected: {
      backgroundColor: '#4A90E2',
      color: '#fff'
    },
    topHit: {
      lineHeight: '40px',
      fontSize: '13px'
    },
    icon: {
      fontSize: '16px',
      fontFamily: 'FontAwesome',
      position: 'absolute',
      left: '9px',
    },
    favicon: {
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
      borderRadius: '3px',
      height: '16px',
      left: '8px',
      position: 'absolute',
      top: '11px',
      width: '16px',
    },
    text: {
      fontSize: 'inherit',
      overflow: 'hidden',
      // Contains absolute elements
      position: 'relative',
      textOverflow: 'ellipsis',
    }
  });


  // View

  const SEARCH_ICON = '\uf002';
  const HISTORY_ICON = '\uf14e';

  const Icon = {
    'search': SEARCH_ICON,
    'history': HISTORY_ICON
  };

  const Load = state => WebView.BySelected({
    action: Loader.Load(state)
  });

  const viewSuggestion = (state, selected, index, address) => {
    const type = state instanceof History.PageMatch ? 'history' :
                 state instanceof Search.Match ? 'search' :
                 state instanceof History.TopHit ? 'topHit' :
                 null;

    const text = type == 'search' ?
      state.title : `${state.title} — ${getDomainName(state.uri)}`;

    return html.li({
      key: 'suggestion',
      className: 'suggestion',
      style: Style(style.suggestion,
                   index == selected && style.selected,
                   (Icon[type] || state.icon) && style.hasIcon,
                   style[type]),
      onMouseDown: _ => address(Load(state))
    }, [
      (Icon[type] ?
        html.div({key: 'icon', style: style.icon}, [Icon[type]]) :
        html.div({
          key: 'favicon',
          style: Style(style.favicon,
                       state.icon && {backgroundImage: `url(${state.icon})`})})),
      html.p({
        key: 'text',
        style: style.text
      }, [text])
    ]);
  };
  exports.viewSuggestion = viewSuggestion;

  // Check if input is in "suggestions" mode.
  const isSuggesting = (input, suggestions) =>
    input.isFocused && input.value && count(suggestions) > 0;
  exports.isSuggesting = isSuggesting;

  const view = (mode, state, input, address) =>
    html.menu({
      key: 'suggestionscontainer',
      className: 'suggestion-box',
      style: Style(style.container,
                   !isSuggesting(input, state) && style.collapsed)
    }, [
      html.ul({
        key: 'suggestions',
        className: 'suggestions',
        style: style.suggestions
      }, [...entries(state).map((entry, index) => {
        return render(`suggestion@${index}`, viewSuggestion,
                      entry, state.selected, index,
                      address);
      })])
    ]);
  exports.view = view;
