/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const {Record, Union, List, Maybe, Any} = require('../common/typed');
  const Pallet = require('../service/pallet');
  const Loader = require('./web-loader');
  const Progress = require('./web-progress');
  const WebView = require('./web-view');
  const Favicon = require('../common/favicon');

  // Model


  const Heros = List(String, 'Heros');

  const Icon = Record({
    href: String,
    sizes: Maybe(String),
    rel: Maybe(String),
  });

  const Model = Record({
    title: Maybe(String),

    label: Maybe(String),
    icon: Maybe(Icon),
    faviconURL: Maybe(String),
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

  const MetaChanged = Record({
    description: 'Metadata of the page changed',
    content: String,
    name: String
  }, 'WebView.MetaChanged');
  exports.MetaChanged = MetaChanged;

  const ThumbnailChanged = Record({
    description: 'Thumbnail of the page changed',
    uri: String,
    image: String
  }, 'WebView.ThumbnailChanged');
  exports.ThumbnailChanged = ThumbnailChanged;

  const TitleChanged = Record({
    description: 'Title of the page changed',
    uri: String,
    title: String
  }, 'WebView.Page.TitleChanged');
  exports.TitleChanged = TitleChanged;

  const IconChanged = Record({
    description: 'Favicon of the page changed',
    uri: String,
    icon: Icon,
  }, 'WebView.Page.IconChanged');
  exports.IconChanged = IconChanged;

  const Scrolled = Record({
    description: 'Page was scrolled'
  }, 'WebView.Page.Scrolled');
  exports.Scrolled = Scrolled;

  const OverflowChanged = Record({
    description: 'Page overflow has changed',
    overflow: Boolean
  }, 'WebView.Page.OverflowChanged');
  exports.OverflowChanged = OverflowChanged;

  const PageCardChanged = Record({
    uri: String,
    hero: Heros,
    title: String,
    description: String,
    name: String
  }, 'WebView.Page.CardChange');
  exports.PageCardChanged = PageCardChanged;


  const {PalletChanged} = Pallet;
  exports.PalletChanged = PalletChanged;

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

  const updateIcon = (state, icon) => {
    const {bestIcon, faviconURL} = Favicon.getBestIcon([state.icon, icon]);
    return state.set('icon', bestIcon).set('faviconURL', faviconURL);
  }

  const update = (state, action) =>
    action instanceof TitleChanged ? state.set('title', action.title) :
    action instanceof IconChanged ? updateIcon(state, action.icon) :
    action instanceof OverflowChanged && !state.overflow ? state.set('overflow', action.overflow) : // we don't want overflow to be set back to false
    action instanceof ThumbnailChanged ? state.set('thumbnail', action.image) :
    action instanceof MetaChanged ? updateMeta(state, action) :
    action instanceof PalletChanged ? state.merge({
      pallet: action.pallet,
      palletSource: 'curated-theme-colors'
    }) :
    action instanceof PageCardChanged ? updateCard(state, action) :
    action instanceof Progress.LoadStarted ? state.clear() :
    state;

  exports.update = update;
