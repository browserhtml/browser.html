/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, moudle) => {
'use strict';

const {DOM} = require('react');
const Component = require('omniscient');
const url = require('./util/url');
const {Deck} = require('./deck');
const {select, remove} = require('./deck/actions');

const readThumbnailURI = uri =>
  'none' && `url(https://raw.githubusercontent.com/gordonbrander/website-tiles/master/${url.getDomainName(uri)}.png)`;

const equals = x => y => x.equals(y)

const Tab = Component(({items, item}) =>
  DOM.div({
    key: `tab-${item.get('id')}`,
    className: 'tab',
    style: {
      backgroundImage: readThumbnailURI(item.get('location'))
    },
    onMouseDown: event => select(items, equals(item)),
    onMouseUp: event => {
      if (event.button == 1) {
        event.stopPropagation();
        remove(items, equals(item));
      }
    }
  }));
exports.Tab = Tab;
Tab.Deck = Deck(Tab);

});
