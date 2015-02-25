/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {
  'use strict';

  const {DOM} = require('react');
  const Component = require('omniscient');
  const dispatch = require('shims/omniscient-dispatch');

  const renderItem = (Item, item, options) =>
    Item(Object.assign({}, options, {key: item.get('id'), item, items: null}));

  const Deck = Item => Component('Deck', [dispatch], options =>
    DOM.div(options, options.items.map(item => renderItem(Item, item, options))));

  // Exports:

  exports.Deck = Deck;

});
