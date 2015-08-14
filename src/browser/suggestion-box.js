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
    const entries = state.entries.filter(isntPage);
    const half = Math.floor(MAX_RESULTS / 2);
    const count = Math.min(matches.count(),
                           MAX_RESULTS - Math.min(half, entries.count()));
    const pages = matches.take(count);

    return state.merge({
      selected: -1,
      entries: topHit ? entries.take(count)
                               .unshift(topHit)
                               .push(...pages)
                               .take(MAX_RESULTS + 1) :
               entries.take(count)
                      .push(...pages)
                      .take(MAX_RESULTS)
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
      textAlign: 'center',
      width: '100vw',
      position: 'absolute',
      top: 40,
      zIndex: 43,
      height: 260,
      pointerEvents: 'none'
    },
    collapsed: {
      display: 'none'
    },
    suggestions: {
      color: 'rgba(0,0,0,0.7)',
      display: 'inline-block',
      textAlign: 'left',
      width: 400,
      overflow: 'hidden',
      pointerEvents: 'all',
      backgroundColor: '#fff',
      borderRadius: 5,
      padding: '30px 0 5px'
    },
    first: {
      borderTop: 0
    },
    suggestion: {
      lineHeight: '30px',
      cursor: 'pointer'
    },
    selected: {
      backgroundColor: '#4A90E2',
      color: '#fff'
    },
    dark: {
      borderTopColor: 'rgba(255,255,255,0.15)'
    },
    selectedDark: {
      backgroundColor: 'rgba(255,255,255,0.15)'
    },
    topHit: {
      lineHeight: '40px',
      fontSize: '110%'
    },
    icon: {
      float: 'left',
      width: '32px',
      textAlign: 'center',
      margin: '0 5px',
      background: 'no-repeat 50% 50% none'
    },
    iconSymbol: {
      fontSize: '16px',
      fontFamily: 'FontAwesome',
      whiteSpace: 'pre'
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
    'history': HISTORY_ICON,
    'topHit': ' '
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
      key: 'sugession',
      style: Style(style.suggestion,
                   index == selected && style.selected,
                   style[type]),
      onMouseDown: address.pass(Load, state)
    }, [
      html.figure({
        key: 'icon',
        style: Style(style.icon,
                     state.icon && {backgroundImage: `url(${state.icon})`})
      }, [
        html.figcaption({
          style: style.iconSymbol
        }, Icon[type])
      ]),
      html.p({
        key: 'text',
        style: style.text
      }, text)
    ]);
  };
  exports.viewSuggestion = viewSuggestion;

  // Check if input is in "suggestions" mode.
  const isSuggesting = (input, suggestions) =>
    input.isFocused && input.value && suggestions.entries.count() > 0;
  exports.isSuggesting = isSuggesting;

  const view = (mode, state, input, address) =>
    html.menu({
      key: 'suggestionscontainer',
      style: Style(style.container,
                   !isSuggesting(input, state) && style.collapsed)
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
