/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const MAX_RESULTS = 6;

  const {getDomainName} = require('../common/url-helper');
  const {html, render} = require('reflex');
  const {Record, List, Union} = require('../common/typed');
  const {StyleSheet, Style} = require('../common/style');
  const ClassSet = require('../common/class-set');
  const Loader = require('./web-loader');
  const WebView = require('./web-view');
  const History = require('../service/history');
  const Search = require('../service/search');

  // Model

  const Suggestion = Union({
    Search: Search.Match,
    Page: History.PageMatch,
    TopHit: History.TopHit
  }, 'Suggestion');
  exports.Suggestion = Suggestion;

  const Suggestions = List(Suggestion, 'Suggestions');

  const Model = Record({
    entries: Suggestions,
    selected: -1
  }, 'Suggestions');
  exports.Model = Model;

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


  const isntSearch = entry => !(entry instanceof Search.Match);
  const isntPage = entry =>
    !(entry instanceof History.PageMatch) &&
    !(entry instanceof History.TopHit);


  const updateSearch = (state, {results: matches}) => {
    const entries = state.entries.filter(isntSearch);
    const half = Math.floor(MAX_RESULTS / 2);
    const count = Math.min(matches.count(),
                           MAX_RESULTS - Math.min(half, entries.count()));
    const results = entries.take(count);
    const searches = matches.slice(0, count);

    return state.merge({
      selected: -1,
      entries: results.first() instanceof History.TopHit ?
        results.take(1).concat(searches).concat(results.skip(1)) :
        results.unshift(...searches)
    });
  };

  const noTop = [];
  const updatePage = (state, {matches, topHit}) => {
    const search = state.entries.filter(isntPage);
    const half = Math.floor(MAX_RESULTS / 2);
    const limit = Math.min(matches.count(),
                           Math.max(MAX_RESULTS - search.count(), half));

    const pages = matches.take(limit);
    const entries = search.take(MAX_RESULTS - limit)
                          .push(...pages);

    return state.merge({
      selected: -1,
      entries: topHit ? entries.unshift(topHit) : entries
    });
  };

  const clear = state => state.clear();
  exports.clear = clear;

  const update = (state, action) =>
    action instanceof SelectRelative ? selectRelative(state, action.offset) :
    action instanceof SelectNext ? selectRelative(state, 1) :
    action instanceof SelectPrevious ? selectRelative(state, -1) :
    action instanceof Unselect ? state.remove('selected') :
    action instanceof Clear ? state.clear() :
    action instanceof Search.Result ? updateSearch(state, action) :
    action instanceof History.PageResult ? updatePage(state, action) :
    state;
  exports.update = update;


  // Style

  const style = StyleSheet.create({
    container: {
      backgroundColor: '#fff',
      width: '100vw',
      position: 'absolute',
      top: 0,
      zIndex: 43,
      height: '100vh',
      left: 0,
      pointerEvents: 'all',
      transition: '100ms opacity ease-out'
    },
    collapsed: {
      opacity: 0,
      pointerEvents: 'none'
    },
    suggestions: {
      color: 'rgba(0,0,0,0.7)',
      margin: '90px auto 0',
      width: 460
    },
    first: {
      borderTop: 0
    },
    suggestion: {
      borderRadius: '4px',
      lineHeight: '40px',
      paddingLeft: 10,
      paddingRight: 10,
      verticalAlign: 'middle',
      cursor: 'pointer',
      overflow: 'hidden',
      // Contains absolute elements
      position: 'relative',
      textOverflow: 'ellipsis',
    },
    hasIcon: {
      paddingLeft: 30,
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
      left: 9,
    },
    favicon: {
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
      borderRadius: 3,
      height: 16,
      left: 8,
      position: 'absolute',
      top: 11,
      width: 16,
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
      style: Style(style.suggestion,
                   index == selected && style.selected,
                   (Icon[type] || state.icon) && style.hasIcon,
                   style[type]),
      onMouseDown: address.pass(Load, state)
    }, [
      (Icon[type] ?
        html.div({key: 'icon', style: style.icon}, Icon[type]) :
        html.div({
          key: 'favicon',
          style: Style(style.favicon,
                       state.icon && {backgroundImage: `url(${state.icon})`})})),
      html.p({
        key: 'text',
        style: style.text
      }, text)
    ]);
  };
  exports.viewSuggestion = viewSuggestion;

  // Check if input is in "suggestions" mode.
  const isSuggesting = (mode, input, suggestions) =>
    (mode === 'edit-web-view' ||
      (mode === 'create-web-view' && input.isFocused && input.value));
  exports.isSuggesting = isSuggesting;

  const view = (mode, state, input, address) =>
    html.menu({
      key: 'suggestionscontainer',
      style: Style(style.container,
                   !isSuggesting(mode, input, state) && style.collapsed)
    }, [
      html.ul({
        key: 'suggestions',
        style: style.suggestions
      }, state.entries.map((entry, index) => {
        return render(`suggestion@${index}`, viewSuggestion,
                      entry, state.selected, index,
                      address);
      }))
    ]);
  exports.view = view;
