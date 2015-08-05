/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

  'use strict';

  const {render, html, Address, Application} = require('reflex');
  const {Record, Any} = require('../../common/typed');
  const {Map} = require('immutable');
  const Settings = require('../../service/settings');

  // Model

  const Model = Record({
    settings: Any
  }, 'Settings');
  exports.Model = Model;

  // Update

  const update = (state, action) =>
    action instanceof Settings.Changed ?
      state.setIn(['settings', action.name], action.value) :
    action instanceof Settings.Fetched ?
      state.mergeIn(['settings'], action.settings) :
    state;
  exports.update = update;

  // View

  const viewSetting = (name, value) => html.div({
    className: 'row'
  }, [
    html.span({
      key: 'name',
      className: 'name',
      title: name
    }, name),
    html.span({
      key: 'value',
      className: 'value',
      title: value,
    }, JSON.stringify(value))
  ]);

  const view = state => html.div({
    key: 'table',
    className: 'table'
  }, state.settings.map((value, key) => {
    return render(key, viewSetting, key, value);
  }).values());
  exports.view = view;

  const address = new Address({
    receive(action) {
      application.receive(action);
      settings(action);
    }
  });

  const application = new Application({
    address, view, update,

    target: document.body,
    state: Model({settings: Map()})
  });

  const settings = Settings.service(address);

  address.receive(Settings.Fetch({id: 'about:settings', query: '*'}));
