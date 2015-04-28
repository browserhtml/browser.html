/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, moudle) => {

  'use strict';

  const {DOM} = require('react');
  const Component = require('omniscient');
  const ClassSet = require('common/class-set');
  const {isSelected} = require('./deck/actions');
  const {Record, Maybe} = require('typed-immutable/index');

  const id = x => x.id

  const Preview = Record({
    id: String,
    key: String(''),
    order: Number(0),
    isPinned: Boolean(false),
    isSelected: Boolean(false),
    isActive: Boolean(false),
    thumbnail: Maybe(String),
  });

  Preview.render = Component(function Preview(state, {onSelect, onActivate, onClose}) {
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
  });

  // Todo: Conver this to a record.
  const Previews = function({items, theme}) {
    return {
      key: 'tabstrip',
      theme,
      items: items.map(webView => Preview({
        id: webView.id,
        isPinned: webView.isPinned,
        isSelected: webView.isSelected,
        isActive: webView.isActive,
        thumbnail: webView.thumbnail,
      }))
    }
  }
  Previews.render = Component(function PreviewBox(state, handlers) {
    const {theme, items} = Previews(state);
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
                .map(item => Preview.render(item.merge({
                  key: item.id,
                  order: items.indexOf(item)
                }).toJSON(), handlers)))]);
  });

  Previews.activate = state => state.set('isActive', true);
  Previews.deactivate = state => state.set('isActive', false);


  // Exports:

  exports.Previews = Previews;
  exports.Preview = Preview;
});
