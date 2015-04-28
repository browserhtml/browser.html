/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const MAX_RESULTS = 6;

  const {DOM} = require('react')
  const {Record, List} = require('typed-immutable/index');
  const Component = require('omniscient');
  const {mix} = require('common/style');

  // CSS

  const styleSuggestionsContainer = {
    textAlign: 'center',
    width: '100vw',
    position: 'absolute',
    top: 50,
    zIndex: 43,
    height: 260,
    transition: 'background-color 200ms ease, opacity 200ms ease'
  };

  const styleSuggestionsContainerNotActive = {
    pointerEvents: 'none',
    opacity: 0
  };

  const styleSuggestions = {
    display: 'inline-block',
    textAlign: 'left',
    width: 460
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

  // Model

  const Suggestion = Record({type: String, href: String, text: String});
  const Entries = List(Suggestion);

  const SearchSuggestion = result => Suggestion({
    type: 'search',
    text: result,
    href: `https://duckduckgo.com/?q=${encodeURIComponent(result)}`
  });

  const HistorySuggestion = result => Suggestion({
    type: 'history',
    text: result,
    href: `http://${result}`
  });

  // Awesomebar state model.
  const Suggestions = Record({
    selected: Number(-1),
    entries: Entries
  });


  // Actions

  Suggestions.unselect = suggestions =>
    suggestions.remove('selected')

  // Selects suggestion `n` items away relative to currently seleceted suggestion.
  // Selection over suggestion entries is moved in a loop although there is extra
  // "no selection" entry between last and first suggestions. Given `n` can be negative
  // or positive in order to select suggestion before or after the current one.
  Suggestions.selectRelative = n => suggestions =>
    suggestions.update('selected', from => {
      const first = 0;
      const last = suggestions.entries.count() - 1;
      const to = from + n;

      return to > last ? void(0) :
             to < first ? void(0) :
             to;
    });

  Suggestions.selectPrevious = Suggestions.selectRelative(-1);
  Suggestions.selectNext = Suggestions.selectRelative(1);

  // Returns currently selected suggestion or void if there's none.
  Suggestions.selected = suggestions => {
    const index = suggestions.selected;
    return index >= 0 ? suggestions.entries.get(index).text : void(0);
  };

  const isntSearch = entry => entry.type !== 'search';
  Suggestions.changeSearchSuggestions = (results=[]) => suggestions =>
    suggestions.update('entries', entries => {
      const history = entries.filter(isntSearch);
      const count = Math.min(results.length, MAX_RESULTS - Math.min(MAX_RESULTS / 2, history.count()));
      return history.take(MAX_RESULTS - count)
                    .concat(results.slice(0, count).map(SearchSuggestion));
    });

  const isntHistory = entry => entry.type !== 'history';
  Suggestions.changeHistorySuggestions = results => suggestions =>
    suggestions.update('entries', entries => {
      const search = entries.filter(isntHistory);
      const count = Math.min(results.length, MAX_RESULTS - Math.min(MAX_RESULTS / 2, search.count()));
      const history = results.slice(0, count).map(HistorySuggestion);
      return search.unshift(...history).take(MAX_RESULTS)
    });

  // View

  Suggestions.render = Component(function SuggestionBar(state, {onOpen}) {
    const {suggestions: {selected, entries}, isLocationBarActive, theme} = state;

    const style = (entries.count() > 0 && isLocationBarActive) ?
      mix(styleSuggestionsContainer,
          theme.awesomebarSuggestions) :
      mix(styleSuggestionsContainer,
          styleSuggestionsContainerNotActive,
          theme.awesomebarSuggestions);

    return DOM.div({
      style: style,
      key: 'suggestionscontainer',
    }, [
      DOM.div({
        key: 'suggestions',
        style: styleSuggestions
      }, entries.map((entry, index) => {

        let style = styleSuggestion;
        if (index == 0)
          style = mix(style, styleSuggestionFirstOfType);
        if (index == selected)
          style = mix(style, styleSuggestionSelected);
        if (theme.isDark)
          style = mix(style, styleDarkSuggestion);
        if (theme.isDark && index == selected)
          style = mix(style, styleDarkSuggestionSelected);

        return DOM.p({
          className: `suggestion ${entry.type} ${index == selected ? 'selected' : ''}`,
          key: 'suggestion' + index,
          onMouseDown: e => onOpen(entry.href),
          style
        }, [
          DOM.span({
            key: 'suggestionprefix',
            style: styleSuggestionPrefix,
          }, entry.type == 'search' ? '\uf002' :
             entry.type == 'history' ? '\uf14e' : ''),
          entry.text
        ]);
      }))
    ])
  });

  // IO.

  let xhrSearch;
  let xhrHistory;


  Suggestions.reset = suggestions => {
    if (xhrSearch) xhrSearch.abort();
    if (xhrHistory) xhrHistory.abort();
    return suggestions.clear();
  }

  Suggestions.compute = (textInput, submit) => {
    if (xhrSearch) xhrSearch.abort();
    if (xhrHistory) xhrHistory.abort();

    textInput = textInput.trim();

    if (!textInput) {
      return submit(Suggestions.reset);
    }

    xhrSearch = new XMLHttpRequest({mozSystem: true});
    xhrSearch.open('GET', `https://ac.duckduckgo.com/ac/?q=${textInput}&type=list`, true);
    xhrSearch.responseType = 'json';
    xhrSearch.send();
    xhrSearch.onload = () =>
      submit(Suggestions.changeSearchSuggestions(xhrSearch.response[1]));

    xhrHistory = new XMLHttpRequest();
    xhrHistory.open('GET', 'src/alexa.json', true);
    xhrHistory.responseType = 'json';
    xhrHistory.send();
    xhrHistory.onload = () => {
      const result = xhrHistory.response.filter(e => e.startsWith(textInput));
      submit(Suggestions.changeHistorySuggestions(result));
    };
  }

  exports.Suggestions = Suggestions;

});
