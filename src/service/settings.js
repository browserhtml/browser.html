/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Union, Any} = require('common/typed');
  const {Map} = require('immutable');

  // Actions

  const Update = Record({
    name: String,
    value: Any
  }, 'Settings.Update');

  const Fetch = Record({
    id: String,
    query: String,
  }, 'Settings.Fetch');

  const Action = Union({Update, Fetch});
  exports.Action = Action;

  // Events

  const Changed = Record({
    name: String,
    value: Any
  }, 'Settings.Changed');
  Changed.read = ({settingName, settingValue}) =>
    Changed({name: settingName, value: settingValue});

  const Fetched = Record({
    id: String,
    settings: Any
  }, 'Settings.Response');
  Fetched.read = ({id}, settings) =>
    Fetched({id, settings: Map(settings)});

  const Event = Union({Changed, Fetched});
  exports.Event = Event;

  const service = address => {
    navigator.mozSettings.onsettingchange = address.pass(Changed.read);
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
                 .then(address.pass(Fetched.read, action));
      }
    }
  };
  exports.service = service;
});
