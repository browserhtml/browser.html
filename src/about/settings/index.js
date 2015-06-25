/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {render} = require('common/render');
  const Component = require('omniscient');
  const {DOM} = require('react');
  const {Map} = require('immutable');

  const Table = Component('Table', state => {

    let rows = [];
    for (let [name, value] of state) {
      rows.push(DOM.div({
        key: name,
        className: 'row'
      }, [
        DOM.span({
          key: 'name.' + name,
          className: 'name',
          title: name
        }, name),
        DOM.span({
          key: 'value.' + name,
          className: 'value',
          title: value
        }, "" + value)
      ]));
    }

    return DOM.div({
      key: 'table',
      className: 'table'
    }, rows);

  });

  const table = render(Table, new Map(), document.body);

  navigator.mozSettings
           .createLock()
           .get('*')
           .then(r => table.step(state => state.merge(r)));

  navigator.mozSettings.onsettingchange = e => {
    table.step(state => state.set(e.settingName, e.settingValue));
  }

});
