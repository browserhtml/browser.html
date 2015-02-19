/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {DOM} = require('react');
  const Component = require('omniscient');

  const Deck = Item => Component(immutableState =>
      DOM.div(immutableState,
              immutableState.items.map(Deck.Render(Item, immutableState))));

  Deck.Render = (Item, immutableState) => item => Item(Object.assign({}, immutableState, {
    key: `deck-item-${item.get('id')}`,
    item: item
  }));

  // Exports:

  exports.Deck = Deck;

});
