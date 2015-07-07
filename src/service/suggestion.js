
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const Input = require('browser/web-input');
  const History = require('service/history');
  const Search = require('service/search');
  const {throttle} = require('lang/functional');
  const Suggestions = require('browser/suggestion-box');
  const Loader = require('browser/web-loader');

  const {Change, Enter, Blur} = Input.Action;
  const {Query: SearchQuery} = Search.Action;
  const {PageQuery} = History.Action;
  const {Unselect, Clear} = Suggestions.Action;
  const {Load} = Loader.Action;

  const MAX_RESULTS = 6;

  const service = address => {
    const search = Search.service(address)
    const history = History.service(address)

    const requestSuggestions = throttle(action => {
      history(PageQuery({id: action.id,
                        input: action.value,
                        limit: MAX_RESULTS}));

      search(SearchQuery({id: action.id,
                          input: action.value,
                          limit: MAX_RESULTS}));
    }, 4000);

    return action => {
      history(action);

      if (action instanceof Change) {
        requestSuggestions(action);
      }

      if (action instanceof Blur) {
        address.receive(Unselect({id: action.id}));
      }

      if (action instanceof Load) {
        address.receive(Clear({id: action.id}));
      }
    };
  };
  exports.service = service;
});
