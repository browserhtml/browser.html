/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Maybe, Union, List} = require('common/typed');
  const {async} = require('lang/task');

  const Match = Record({
    title: Maybe(String),
    uri: String
  }, 'Search.Match');
  Match.read = result => Match({
    title: result,
    uri: `https://duckduckgo.com/?q=${encodeURIComponent(result)}`
  });


  const Result = Record({
    id: String,
    results: List(Match)
  }, 'Search.Result');

  const Event = Union({Result, Match});
  exports.Event = Event;

  const Query = Record({
    id: String,
    input: String,
    limit: Number
  }, 'Search.Query');


  const Action = Union({Query});
  exports.Action = Action;


  const service = address => {
    let request = null;

    const respond = ({id}, {response}) => {
      request = null;
      const entries = response[1] &&
                      response[1].map(Match.read);

      return Result({id, results: entries});
    }

    return action => {
      if (action instanceof Query) {
        if (request) {
          request.abort();
        }

        const query = action.input.trim();

        if (!query) {
          address.receive(Result({id: action.id}));
        } else {
          request = new XMLHttpRequest({mozSystem: true});
          request.open('GET', `https://ac.duckduckgo.com/ac/?q=${query}&type=list`, true);
          request.responseType = 'json';
          request.send();
          request.onload = address.pass(respond, action, request);
        }
      }
    };
  };

  exports.service = service;

});
