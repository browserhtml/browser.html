/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

  'use strict';

  const WebView = require('../browser/web-view');
  const Loader = require('../browser/web-loader');
  const Page = require('../browser/web-page');
  const {Record, Union} = require('../common/typed');
  const {fromDOMRequest, fromEvent} = require('../lang/promise');
  const URI = require('../common/url-helper');

  const fetchScreenshot = iframe =>
    // 960 is a guestimate... we're going to guess that within that space there
    // will be content to show in the screenshot. In future, we need to center
    // screenshot on the content.
    fromDOMRequest(iframe.getScreenshot(960, 552, 'image/png'));

  const requestThumbnail = iframe => {
    // Create a promise that is rejected when iframe location is changes,
    // in order to abort task if this happens before we have a response.
    const abort = fromEvent(iframe, 'mozbrowserlocationchange')
      .then(event => Promise.reject(event));

    // Create a promise that is resolved once iframe ends loading, it will
    // be used to defer a screenshot request.
    const loaded = fromEvent(iframe, 'mozbrowserloadend');

    // We race `loaded` against `abort` and if `loaded` wins we fetch a
    // screenshot that will be our thumbnail.
    const thumbnail = Promise
      .race([abort, loaded])
      .then(_ => fetchScreenshot(iframe))
      fetchScreenshot(iframe);

    // Finally we return promise that rejects if `abort` wins and resolves to a
    // `thumbnail` if we get it before `abort`.
    return Promise.race([abort, thumbnail]);
  }

  // service

  const service = address => action => {
    if (action instanceof WebView.Action &&
        action.action instanceof Loader.LocationChanged) {
      const iframe = document.getElementById(`web-view-${action.id}`);
      const uri = iframe.location;
      const id = action.id;
      if (iframe) {
        fetchScreenshot(iframe).then(address.pass(blob => WebView.Action({
          id,
          action: Page.ThumbnailChanged({
            uri, image: URL.createObjectURL(blob)
          })
        })));
      }
    }

    return action;
  };
  exports.service = service;
