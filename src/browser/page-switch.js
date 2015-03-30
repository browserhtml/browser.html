/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, moudle) => {

  'use strict';

  const {DOM} = require('react');
  const Component = require('omniscient');
  const {isSelected} = require('./deck/actions');
  const ClassSet = require('./util/class-set');

  const Tab = Component('Tab', ({state, order}, {onSelect, onActivate, onClose}) => {
    const isPinned = state.get('isPinned');
    const thumbnail = state.get('thumbnail');
    return DOM.div({
      className: ClassSet({
        tab: true,
        selected: isSelected(state),
        'tab-dashboard': isPinned
      }),
      style: {order},
      onMouseOver: event => onSelect(state),
      onMouseDown: event => onActivate(),
      onMouseUp: event => {
        if (event.button == 1) {
          event.stopPropagation();
          onClose(state.get('id'));
        }
      }
    }, [
      DOM.div({
        key: 'thumbnail',
        className: 'tab-thumbnail',
      }, [
        DOM.img({
          key: 'image',
          src: thumbnail,
          alt: '',
          onLoad: event => URL.revokeObjectURL(event.target.src)
        })
      ]),
      isPinned ? null :
      DOM.div({
        key: 'close-button',
        onClick: event => onClose(state.get('id')),
        className: "tab-close-button fa fa-times",
      })
    ])
  });
  const id = item => item.get('id');
  Tab.Deck = Component('Deck', (options, handlers) => {
    const {items, In} = options;
    return DOM.div(options, items.sortBy(id).map(item => Tab({
      key: id(item),
      order: items.indexOf(item),
      state: item
    }, handlers)))
  });

  // Exports:

  exports.Tab = Tab;
});
