/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const {Record, Union, Any} = require('typed-immutable');
  const {Map} = require('immutable');

  // Actions

  const Update = Record({
    name: String,
    value: Any
  }, 'Settings.Update');
  exports.Update = Update;

  const Fetch = Record({
    id: String,
    query: String,
  }, 'Settings.Fetch');
  exports.Fetch = Fetch;

  const Changed = Record({
    name: String,
    value: Any
  }, 'Settings.Changed');
  Changed.read = ({settingName, settingValue}) =>
    Changed({name: settingName, value: settingValue});
  exports.Changed = Changed;

  const Fetched = Record({
    id: String,
    settings: Any
  }, 'Settings.Response');
  Fetched.read = ({id}, settings) =>
    Fetched({id, settings: Map(settings)});
  exports.Fetched = Fetched;

  const Action = Union(Update, Fetch, Changed, Fetched);
  exports.Action = Action;

  const service = address => {
    if (navigator.mozSettings) {
      navigator.mozSettings.onsettingchange = event =>
        address(Changed.read(event));

      return action => {
        if (action instanceof Update) {
          navigator.mozSettings
                   .createLock()
                   .set({[action.name]: action.value});
        }

        if (action instanceof Fetch) {
          navigator.mozSettings
                   .createLock()
                   .get(action.query)
                   .then(settings => Fetched.read(action, settings))
                   .then(address);
        }
      }
    } else {
      return action => action
    }
  };
  exports.service = service;
