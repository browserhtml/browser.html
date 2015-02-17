/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

'use strict';

const {DOM} = require('react');
const Component = require('omniscient');

const Deck = Item => Component(options =>
    DOM.div(options, options.items.map(Deck.Render(Item, options))));

Deck.Render = (Item, options) => item => Item(Object.assign({}, options, {
  key: `deck-item-${item.get("id")}`,
  item: item
}));
exports.Deck = Deck;

});
