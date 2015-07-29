
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const Input = require('browser/web-input');
  const Editable = require('common/editable');
  const Focusable = require('common/focusable');
  const History = require('service/history');
  const Search = require('service/search');
  const {throttle} = require('lang/functional');
  const Suggestions = require('browser/suggestion-box');

  const MAX_RESULTS = 5;

  const service = address => {
    const search = Search.service(address)
    const history = History.service(address)

    const requestSuggestions = throttle(action => {
      history(History.PageQuery({id: action.value,
                                 input: action.value,
                                 limit: MAX_RESULTS}));

      search(Search.Query({id: action.value,
                           input: action.value,
                           limit: MAX_RESULTS}));
    }, 300);

    return action => {
      history(action);

      if (action instanceof Input.Action) {
        if (action.action instanceof Focusable.Blur) {
          address.receive(Suggestions.Unselect());
        }

        if (action.action instanceof Editable.Change) {
          requestSuggestions(action.action);
        }

        if (action.action instanceof Input.Submit) {
          address.receive(Suggestions.Clear())
        }
      }
    };
  };
  exports.service = service;
});
