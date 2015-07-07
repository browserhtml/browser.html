/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Maybe, Union, List} = require('common/typed');
  const Loader = require('browser/web-loader');
  const Progress = require('browser/progress-bar');
  const Page = require('browser/web-page');

  const PageMatch = Record({
    title: Maybe(String),
    uri: String,
    score: Number
  }, 'History.PageMatch');


  const PageResult = Record({
    id: String,
    results: List(PageMatch, 'History.PageResult')
  });

  const Event = Union({PageResult, PageMatch});
  exports.Event = Event;

  const {LoadEnd, LoadStart} = Progress.Action;
  const {LocationChange} = Loader.Action;
  const {ThumbnailChange, TitleChange, IconChange} = Page.Action;

  const PageQuery = Record({
    id: String,
    input: String,
    limit: Number
  }, 'History.PageQuery');


  const Action = Union({LoadEnd, LocationChange,
                        ThumbnailChange, TitleChange, IconChange,
                        PageQuery});
  exports.Action = Action;

  const service = address => {
    const worker = require('common/worker!service/history-worker');

    worker.onmessage = ({data: {type, action}}) => {
      if (type === 'PageResult') {
        address.receive(PageResult(action));
      }
    }


    return action => {
      if (action instanceof PageQuery) {
        worker.postMessage({type: 'PageQuery',
                            action: action.toJSON()});
      }

      if (action instanceof LoadEnd) {
        worker.postMessage({type: 'LoadEnd',
                            action: action.toJSON()});
      }

      if (action instanceof LocationChange) {
        worker.postMessage({type: 'LocationChange',
                            action: action.toJSON()});
      }

      if (action instanceof TitleChange) {
        worker.postMessage({type: 'TitleChange',
                            action: action.toJSON()});
      }

      if (action instanceof ThumbnailChange) {
        worker.postMessage({type: 'ThumbnailChange',
                            action: action.toJSON()});
      }

      if (action instanceof IconChange) {
        worker.postMessage({type: 'IconChange',
                            action: action.toJSON()});
      }
    }
  };
  exports.service = service;

});
