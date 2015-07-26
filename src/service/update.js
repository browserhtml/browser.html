
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Union} = require('common/typed');
  const Settings = require('./settings');

  const ApplicationUpdate = Record({
    commit: String
  }, 'ApplicationUpdate');
  exports.ApplicationUpdate = ApplicationUpdate;

  
  const UpdateHead = value =>
    Settings.Update({name: 'browserhtml.HEAD_HASH', value});
  const UnknownHead = e =>
    Settings.Update({name: 'browserhtml.HEAD_HASH',
                     value: `Unknown (${e})`});

  const service = (address, user='mozilla', project='browser.html') => {
    const PROD = location.hostname == `${user}.github.io`;
    const API_URL = `https://api.github.com/repos/${user}/${project}/contents/HEAD?ref=refs/heads/gh-pages`;
    const MIN_INTERVAL = 60000 * 10; // 10 mins

    var etag;
    var interval = MIN_INTERVAL;

    var timeout;

    const pull = (resolve, reject) => {
      if (!PROD) {
        return reject('Not checking for updates');
      }
      var headers = {};
      if (etag) {
        headers = {'If-None-Match': etag} // will tell github to return 304 (Not Modified) if nothing changed
      }

      fetch(API_URL, {headers}).then(response => {
        if (response.status == 200) {
          // Make sure we don't pull too often
          var xPoll = response.headers.get('X-Poll-Interval');
          if (xPoll) {
            interval = Math.max(xPoll * 1000, MIN_INTERVAL);
          }
          etag = response.headers.get('ETag');
          response.json().then((data) => {
            var remoteHEAD = atob(data.content);
            console.log(`Github: remote: ${remoteHEAD}`);
            localHEAD.then(localHEAD => {
              console.log(`Github: local: ${localHEAD}`);
              if (localHEAD != remoteHEAD) {
                resolve(ApplicationUpdate({
                  remote: remoteHEAD,
                  local: localHEAD
                }));
              }
            });
          });
        }
        if (response.status != 200 && response.status != 304) {
          console.error('Github: Unexpected status', response.status, response.statusText);
        } else {
          console.log('Github:', response.status);
        }
        console.log(`Github: pulling in ${interval}ms`);
        timeout = setTimeout(() => pull(resolve), interval);
      }).catch(error => {
        console.error('Github: fetch error', error);
        console.log(`Github: pulling in ${interval}ms`);
        timeout = setTimeout(() => pull(resolve), interval);
      });
    };

    const localHEAD = new Promise((resolve, reject) => {
      if (!PROD) {
        return reject('Not prod environment');
      }
      fetch('HEAD').then(response => {
        if (response.status == 200) {
          response.text().then(resolve, reject);
        } else {
          reject(`Can\'t reach HEAD: ${response.statusText}`);
        }
      }).catch(reject);
    });



    localHEAD.then(address.pass(UpdateHead), address.pass(UnknownHead));
    const update = new Promise(pull);
    update.then(address.send, error => console.warn(error));
  }
  exports.service = service;

});
