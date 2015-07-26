/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const MAX_RESULTS = 6;

  const {html, render} = require('reflex');
  const {Record, List, Union} = require('common/typed');
  const {StyleSheet, Style} = require('common/style');
  const ClassSet = require('common/class-set');
  const Loader = require('./web-loader');
  const History = require('service/history');
  const Search = require('service/search');

  // Model

  const Suggestion = Union({
    Search: Search.Match,
    Page: History.PageMatch
  }, 'Suggestion');
  exports.Suggestion = Suggestion;

  const Model = Record({
    entries: List(Suggestion),
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
  const isntPage = entry => !(entry instanceof History.PageMatch);

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
      top: 44,
      zIndex: 43,
      height: 260,
      pointerEvents: 'none'
    },
    collapsed: {
      visibility: 'collapse'
    },
    suggestions: {
      display: 'inline-block',
      textAlign: 'left',
      width: 400,
      pointerEvents: 'all',
      backgroundColor: '#fff',
      borderRadius: 5,
      paddingTop: 20
    },
    first: {
      borderTop: 0
    },
    suggestion: {
      lineHeight: '40px',
      verticalAlign: 'middle',
      borderTop: '1px solid rgba(0,0,0,0.05)',
      cursor: 'pointer'
    },
    selected: {
      backgroundClip: 'content-box',
      backgroundColor: 'rgba(0,0,0,0.05)'
    },
    dark: {
      borderTopColor: 'rgba(255,255,255,0.15)'
    },
    selectedDark: {
      backgroundColor: 'rgba(255,255,255,0.15)'
    },
    prefix: {
      display: 'inline-block',
      fontSize: '16px',
      fontFamily: 'FontAwesome',
      width: 30,
      textAlign: 'center'
    }
  });


  // View

  const SEARCH_ICON = '\uf002';
  const HISTORY_ICON = '\uf14e';

  const Icon = {
    'search': SEARCH_ICON,
    'history': HISTORY_ICON
  };

  const viewSuggestion = (state, selected, index, theme, address) => {
    const type = state instanceof History.PageMatch ? 'history' :
                 state instanceof Search.Match ? 'search' :
                 null;

    return html.p({
      style: Style(
        style.suggestion,
        index == selected && style.selected,
        theme.isDark ? style.dark : style.light,
        theme.isDark && index === selected && style.selectedDark
      ),
      onMouseDown: address.pass(Loader.Load, state)
    }, [
      html.span({
        key: 'suggestionprefix',
        style: style.prefix,
      }, Icon[type] || ''),
      html.span({
        key: 'suggestion'
      }, state.title)
    ]);
  };
  exports.viewSuggestion = viewSuggestion;

  const view = (mode, state, input, theme, address) => {
    const isActive = mode != 'show-web-view' &&
                     input.isFocused &&
                     input.value !== '' &&
                     input.value;

    return html.div({
      key: 'suggestionscontainer',
      style: Style(style.container,
                   {color: theme.foreground},
                   !isActive && style.collapsed,
                   state.entries.size <= 0 && style.collapsed)
    }, [
      html.div({
        key: 'suggestions',
        style: style.suggestions
      }, state.entries.map((entry, index) => {
        return render(`suggestion@${index}`, viewSuggestion,
                      entry, state.selected, index, theme,
                      address);
      }))
    ]);
  };
  exports.view = view;
});
