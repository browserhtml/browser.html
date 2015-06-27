/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Union, List, Maybe, Any} = require('common/typed');
  const Pallet = require('service/pallet');

  // Model


  const Heros = List(String, 'Heros');

  const Model = Record({
    title: Maybe(String),

    label: Maybe(String),
    icon: Maybe(String),
    description: Maybe(String),
    name: Maybe(String),
    hero: Heros,

    thumbnail: Maybe(String),
    overflow: false,
    palletSource: Maybe(String),
    pallet: Pallet.Model
  });
  exports.Model = Model;

  // Action

  const MetaChange = Record({
    id: String,
    content: String,
    name: String
  }, 'WebView.MetaChange');

  const ThumbnailChange = Record({
    id: String,
    uri: String,
    image: String
  }, 'WebView.ThumbnailChange');

  const TitleChange = Record({
    id: String,
    uri: String,
    title: String
  }, 'WebView.Page.TitleChange');

  const IconChange = Record({
    id: String,
    uri: String,
    icon: String
  }, 'WebView.Page.IconChange');

  const Scroll = Record({
    id: String
  }, 'WebView.Page.Scroll');

  const OverflowChange = Record({
    id: String,
    overflow: Boolean
  }, 'WebView.Page.OverflowChange');

  const PageCardChange = Record({
    id: String,
    uri: String,
    hero: Heros,
    title: String,
    description: String,
    name: String
  }, 'WebView.Page.CardChange');

  exports.PageCardChange = PageCardChange;


  const {PalletChange} = Pallet.Action;


  const Action = Union({TitleChange, IconChange, MetaChange,
                        PalletChange, PageCardChange,
                        Scroll, OverflowChange, ThumbnailChange});
  exports.Action = Action;


  // Update

  const updateMeta = (state, action) => {
    if (action.name === 'theme-color') {
      // Never override pallet if there was a currated theme.
      if (state.palletSource !== 'curated-theme-colors') {
        return state.merge({
          palletSource: 'theme-color',
          pallet: Pallet.read(action.content)
        });
      }
    }
    return state
  };

  const updateCard = (state, action) =>
    state.merge({
      label: action.title !== '' ? action.title : '',
      name: action.name,
      description: action.description,
      hero: action.hero
    });

  const update = (state, action) =>
    action instanceof TitleChange ? state.set('title', action.title) :
    action instanceof IconChange ? state.set('icon', action.icon) :
    action instanceof OverflowChange ? state.set('overflow', action.overflow) :
    action instanceof ThumbnailChange ? state.set('thumbnail', action.image) :
    action instanceof MetaChange ? updateMeta(state, action) :
    action instanceof PalletChange ? state.merge({
      pallet: action.pallet,
      palletSource: 'curated-theme-colors'
    }) :
    action instanceof PageCardChange ? updateCard(state, action) :
    state;

  exports.update = update;

});
