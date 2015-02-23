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
    'none' && `url(/tiles/${url.getDomainName(uri)}.png)`;

  const equals = x => y => x.equals(y)

  const Tab = Component(({items, item}) =>
    DOM.div({
      key: `tab-${item.get('id')}`,
      className: 'tab' +
                 (item.get('isSelected') ? ' selected' : ''),
      onMouseDown: event => select(items, equals(item)),
      onMouseUp: event => {
        if (event.button == 1) {
          event.stopPropagation();
          remove(items, equals(item));
        }
      }
    }, [
      DOM.span({
        key: 'thumbnail',
        className: 'tab-thumbnail',
        style: {backgroundImage: readThumbnailURI(item.get('location'))},
      })
    ]));
  Tab.Deck = Deck(Tab);


  // Exports:

  exports.Tab = Tab;

});
