/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const MAX_RESULTS = 6;

  const {DOM} = require('react')
  const {List, Map} = require('immutable');
  const Component = require('omniscient');
  const {Element} = require('./element');
  const ClassSet = require('./util/class-set');

  const Awesomebar = Component(function Awesomebar({suggestions, input, theme},
                                                   {onOpen}) {

    const selectedIndex = suggestions.get('selectedIndex');
    const list = suggestions.get('list').toJSON();

    return DOM.div({
      className: ClassSet({
        suggestionscontainer: true,
        isActive: list.length > 0 && input.get('isFocused')
      }),
      key: 'suggestionscontainer',
      style: theme.awesomebarSuggestions
    }, [
      DOM.div({
        className: 'suggestions',
        key: 'suggestions',
      }, list.map((entry, index) => {
        return DOM.p({
          className: `suggestion ${entry.type} ${index == selectedIndex ? 'selected':''}`,
          key: 'suggestion' + index,
          onMouseDown: e => onOpen(entry.href)
        }, entry.text);
      }))
    ])
  });


  let xhrSearch;
  let xhrHistory;

  const computeSuggestions = (textInput, submit) => {

    if (xhrSearch) xhrSearch.abort();
    if (xhrHistory) xhrHistory.abort();

    textInput = textInput.trim();

    if (!textInput) {
      submit(resetSuggestions);
      return;
    }

    xhrSearch = new XMLHttpRequest({mozSystem: true});
    xhrSearch.open('GET', `https://ac.duckduckgo.com/ac/?q=${textInput}&type=list`, true);
    xhrSearch.responseType = 'json';
    xhrSearch.send();
    xhrSearch.onload = () =>
      submit(updateSearchSuggestions(xhrSearch.response[1]));

    xhrHistory = new XMLHttpRequest();
    xhrHistory.open('GET', 'src/alexa.json', true);
    xhrHistory.responseType = 'json';
    xhrHistory.send();
    xhrHistory.onload = () => {
      const history = xhrHistory.response.filter(e => e.startsWith(textInput));
      submit(updateHistorySuggestions(history));
    };
  }

  const isntSearch = entry => entry.get('type') !== 'search';
  const isntHistory = entry => entry.get('type') !== 'history';

  const SearchSuggestion = entry => Map({
    type: 'search',
    href: `https://duckduckgo.com/?q=${encodeURIComponent(entry)}`,
    text: entry
  });

  const HistorySuggestion = entry => Map({
    type: 'history',
    text: entry,
    href: `http://${entry}`
  });

  const updateSearchSuggestions = search => suggestions =>
    suggestions.update('list', entries => {
      const other = entries.filter(isntSearch);
      const count = Math.min(search.length, MAX_RESULTS - Math.min(MAX_RESULTS / 2, other.count()));
      return other.concat(search.slice(0, count).map(SearchSuggestion))
                  .slice(-MAX_RESULTS)
    });

  const updateHistorySuggestions = history => suggestions =>
    suggestions.update('list', entries => {
      const other = entries.filter(isntHistory);
      const count = Math.min(history.length, MAX_RESULTS - Math.min(MAX_RESULTS / 2, other.count()));
      return other.concat(history.slice(0, count).map(HistorySuggestion))
                  .slice(0, MAX_RESULTS)
    });



  const resetSuggestions = suggestions => {
    if (xhrSearch) xhrSearch.abort();
    if (xhrHistory) xhrHistory.abort();
    return suggestions.merge({selectedIndex: -1, list: List()});
  }

  exports.Awesomebar = Awesomebar;
  exports.computeSuggestions = computeSuggestions;
  exports.resetSuggestions = resetSuggestions;

});
