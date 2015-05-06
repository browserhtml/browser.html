/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, moudle) => {

  'use strict';

  const {DOM, render} = require('common/component');
  const ClassSet = require('common/class-set');
  const {isSelected} = require('./deck/actions');
  const {Record, Maybe, Any, List} = require('typed-immutable/index');

  const id = x => x.id

  const Preview = Record({
    id: String,
    order: Number(0),
    isPinned: Boolean(false),
    isSelected: Boolean(false),
    isActive: Boolean(false),
    thumbnail: Maybe(String),
  });
  Preview.displayName = "Preview";
  Preview.key = ({id}) => id;

  Preview.render = function(state, {onSelect, onActivate, onClose}) {
    return DOM.div({
      key: state.key,
      className: ClassSet({
        tab: true,
        selected: state.isSelected,
        'tab-dashboard': state.isPinned
      }),
      style: {order: state.order},
      onMouseOver: event => onSelect(state.id),
      onMouseDown: event => onActivate(state.id),
      onMouseUp: event => {
        if (event.button == 1) {
          event.stopPropagation();
          onClose(state.id);
        }
      }
    }, [
      DOM.div({
        key: 'thumbnail',
        className: 'tab-thumbnail',
      }, [
        DOM.img({
          key: 'image',
          src: state.thumbnail,
          alt: '',
          onLoad: event => URL.revokeObjectURL(event.target.src)
        })
      ]),
      state.isPinned ? null : DOM.div({
        key: 'close-button',
        onClick: event => onClose(state.id),
        className: 'tab-close-button fa fa-times',
      })
    ])
  };

  // Todo: Conver this to a record.
  const Previews = Record({
    key: String('tabstrip'),
    theme: Any,
    items: List(Preview)
  });
  Previews.displayName = "Previews";
  Previews.render = function(state, handlers) {
    const {theme, items} = state;
    return DOM.div({
      style: theme.tabstrip,
      className: ClassSet({
        tabstripcontainer: true,
        isdark: theme.isDark
      }),
    }, [
      DOM.div({
        key: 'tabstrip',
        className: 'tabstrip',
      }, items.sortBy(id)
              .map(item => render(item.set('order', items.indexOf(item)), handlers)))]);
  };

  Previews.activate = state => state.set('isActive', true);
  Previews.deactivate = state => state.set('isActive', false);

  // Exports:

  exports.Previews = Previews;
  exports.Preview = Preview;
});
