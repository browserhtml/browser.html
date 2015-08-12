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
  const URI = require('../common/url-helper');

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

    themeColor: Maybe(String),
    curatedColor: Maybe(String),
    pallet: Pallet.Model
  });
  exports.Model = Model;

  // Action

  const DocumentFirstPaint = Record({
    description: 'Fired on a first page document paint'
  }, 'WebView.DocumentFirstPaint');
  exports.DocumentFirstPaint = DocumentFirstPaint;

  const FirstPaint = Record({
    description: 'Fired on a first paint'
  }, 'WebView.FirstPaint');
  exports.FirstPaint = FirstPaint;

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

  const AnnounceCuratedColor = Pallet.AnnounceCuratedColor;
  exports.AnnounceCuratedColor = AnnounceCuratedColor;


  // Update

  const updateMeta = (state, action) =>
    state.curatedColor ? state :
    action.name === 'theme-color' ? state.set('themeColor', action.content) :
    state;

  const updateTheme = (state, action) =>
    state.set('curatedColor', action.color);

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
  };

  const updatePallet = state =>
    state.curatedColor ? state.set('pallet', Pallet.read(state.curatedColor)) :
    state.themeColor ? state.set('pallet', Pallet.read(state.themeColor)) :
    state.remove('pallet');

  const update = (state, action) =>
    action instanceof TitleChanged ? state.set('title', action.title) :
    action instanceof IconChanged ? updateIcon(state, action.icon) :
    action instanceof OverflowChanged && !state.overflow ? state.set('overflow', action.overflow) : // we don't want overflow to be set back to false
    action instanceof ThumbnailChanged ? state.set('thumbnail', action.image) :
    action instanceof MetaChanged ? updateMeta(state, action) :
    action instanceof PageCardChanged ? updateCard(state, action) :
    action instanceof AnnounceCuratedColor ? updateTheme(state, action) :
    action instanceof Progress.LoadStarted ? Model({pallet: state.pallet}) :
    action instanceof DocumentFirstPaint ? updatePallet(state) :
    // If you goBack `DocumentFirstPaint` does not seem to fire there for
    // we updatePallet again on LoadEnded to cover that as well.
    action instanceof Progress.LoadEnded ? updatePallet(state) :
    state;
  exports.update = update;
