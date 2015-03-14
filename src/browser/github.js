
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const API = 'https://api.github.com/repos/mozilla/browser.html/events';
  const REF = 'refs/heads/gh-pages';
  const MIN_INTERVAL = 60000;
  const knownEvents = new Set();

  let etag;
  let interval = MIN_INTERVAL;
  let pulling = false;

  const pull = () => {
    pulling = true;
    let headers = {};
    if (etag) {
      headers = { "If-None-Match": etag }
    }
    fetch(API, { headers }).then(response => {
      if (response.status == 200) {
        console.log('github: new events');
        let xPoll = response.headers.get('X-Poll-Interval');
        etag = response.headers.get('ETag');
        if (xPoll) {
          interval = Math.max(xPoll * 1000, MIN_INTERVAL);
        }
        response.json().then((allEvents) => {
          // Basic check. If there's an unknown push event, update!
          const unkownEvents = allEvents.filter(e => e.type == 'PushEvent')
                                        .filter(e => !knownEvents.has(e.id));
          // Because initially we don't have any know events, let's use the
          // first events as a record of what happened in the past. We will
          // obviously miss events, so we need to save the latest known
          // events/commits/whatever, but we'll do that once we know exactly
          // how we want to handle updates (probably in a service worker).
          if (knownEvents.size > 0) {
            if (unkownEvents.some(e => e.payload.ref == REF)) {
              console.log('github: new push to gh-pages');
              window.dispatchEvent(new CustomEvent("app-update-available"));
            }
          }
          unkownEvents.forEach(e => knownEvents.add(e.id));
        });
      }
      if (response.status == 304) {
        console.log('github: no events');
      }
      if (response.status != 200 && response.status != 304) {
        console.error("Unexpected status", response.status, response.statusText);
      }
      console.log(`pulling in ${interval}ms`);
      setTimeout(pull, interval);
    }).catch(error => {
      console.error("fetch error", error);
      console.log(`pulling in ${interval}ms`);
      setTimeout(pull, interval);
    });
  };


  pull();

});
