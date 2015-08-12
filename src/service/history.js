/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const {Record, Maybe, Union, List} = require('../common/typed');
  const Loader = require('../browser/web-loader');
  const Progress = require('../browser/web-progress');
  const Page = require('../browser/web-page');
  const WebView = require('../browser/web-view');

  const PageMatch = Record({
    title: Maybe(String),
    uri: String,
    score: Number
  }, 'History.PageMatch');
  exports.PageMatch = PageMatch;


  const PageResult = Record({
    id: String,
    results: List(PageMatch, 'History.PageResult')
  });
  exports.PageResult = PageResult;

  const PageQuery = Record({
    id: String,
    input: String,
    limit: Number
  }, 'History.PageQuery');
  exports.PageQuery = PageQuery;

  const service = address => {

    // TODO: Figure out better way to resolve path.
    const worker = new Worker('./dist/service/history-worker.js');

    worker.onmessage = ({data: {type, action}}) => {
      if (type === 'PageResult') {
        address.receive(PageResult(action));
      }
    }

    const handleAction = ({id, action}) => {
      if (action instanceof Progress.LoadEnded) {
        worker.postMessage({type: 'LoadEnded',
                            id,
                            action: action.toJSON()});
      }

      if (action instanceof Loader.LocationChanged) {
        worker.postMessage({type: 'LocationChanged',
                            id,
                            action: action.toJSON()});
      }

      if (action instanceof Page.TitleChanged) {
        worker.postMessage({type: 'TitleChanged',
                            id,
                            action: action.toJSON()});
      }

      if (action instanceof Page.ThumbnailChanged) {
        worker.postMessage({type: 'ThumbnailChanged',
                            id,
                            action: action.toJSON()});
      }

      if (action instanceof Page.IconChanged) {
        worker.postMessage({type: 'IconChanged',
                            id,
                            action: action.toJSON()});
      }
    }


    return action => {
      if (action instanceof PageQuery) {
        worker.postMessage({type: 'PageQuery',
                            action: action.toJSON()});
      }

      if (action instanceof WebView.ByID ||
          action instanceof WebView.BySelected) {
        handleAction(action)
      }
    }
  };
  exports.service = service;
