
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

  const requestSuggestions = throttle((address, action) => {
    address.receive(PageQuery({id: action.id,
                               input: action.value,
                               limit: MAX_RESULTS}));

    address.receive(SearchQuery({id: action.id,
                                 input: action.value,
                                 limit: MAX_RESULTS}));
  }, 400);

  const service = address => action => {
    if (action instanceof Change) {
      requestSuggestions(address, action);
    }

    if (action instanceof Blur) {
      address.receive(Unselect({id: action.id}));
    }

    if (action instanceof Load) {
      address.receive(Clear({id: action.id}));
    }
  };
  exports.service = service;
});
