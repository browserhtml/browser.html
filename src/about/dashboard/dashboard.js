/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {html, render} = require('reflex')
  const {Record, Union, List, Maybe} = require('common/typed');
  const WebView = require('browser/web-view');
  const Theme = require('browser/theme');
  const Pallet = require('service/pallet');


  // Model

  const URI = String;
  const Path = String;

  const Page = Record({
    uri: URI,
    image: Path,
    title: String
  }, 'Dashboard.Page');
  Page.key = page => page.uri;

  const Color = String;

  const Wallpaper = Record({
    background: Color('#F0F4F7'),
    foreground: Color('#555'),
    posterImage: Maybe(Path)
  }, 'Dashboard.Wallpaper');

  const DashboardTheme = Record({
    id: String ,
    wallpaper: Wallpaper,
    pallet: Pallet.Model
  }, 'Dashboard.Theme');

  const Model = Record({
    themes: Record({
      selected: 0,
      entries: List(DashboardTheme)
    }),
    pallet: Pallet.Model,
    pages: List(Page)
  }, 'Dashboard');

  exports.Theme = Theme;
  exports.Page = Page;
  exports.Model = Model;

  // Actions

  const {Open} = WebView;
  const ChangeTheme = Record({id: String}, 'Dashboard.ChangeTheme');

  const Action = Union({ChangeTheme});

  exports.Action = Action;

  // Update

  const setTheme = (themes, id) =>
    themes.set('selected', themes.entries.findIndex(theme => id === theme.id));

  const update = (state, action) => {
    if (action instanceof ChangeTheme) {
      const index = state.themes.entries.findIndex(({id}) => id === action.id);
      const theme = state.themes.entries.get(index);
      return state.merge({
        themes: state.themes.set('selected', index),
        pallet: theme.pallet
      });
    }
    return state;
  };
  exports.update = update;

  // View

  const viewTheme = ({id, wallpaper}, address) => html.div({
    key: id,
    className: 'wallpaper-swatch',
    style: {backgroundColor: wallpaper.background},
    onClick: address.send(ChangeTheme({id}))
  });

  const viewPage = ({uri, image, title}, address) => html.a({
    key: uri,
    href: uri,
    className: 'tile tile-large',
    onClick: address.send(Open({uri}))
  }, [
    html.div({
      key: 'tileThumbnail',
      className: 'tile-thumbnail',
      style: {backgroundImage: image && `url(${image})`}
    }),
    html.div({
      key: 'tileTitle',
      className: 'tile-title'
    }, title)
  ]);

  const view = ({themes, pages}, address) => {
    const theme = themes.entries.get(themes.selected);
    const {background, foreground} = theme.pallet;
    const themeColors = [background||'', foreground||''].join('|');

    return html.div({
      key: 'dashboard',
      className: 'dashboard',
      style: theme && {
        backgroundColor: theme.wallpaper.background,
        color: theme.wallpaper.foreground,
        backgroundImage: theme.wallpaper.posterImage &&
                         `url(${theme.wallpaper.posterImage})`
      }
    }, [
      html.meta({
        name: 'theme-color',
        content: themeColors
      }),
      html.div({
        key: 'dashboard-tiles',
        className: 'dashboard-tiles'
      }, pages.map(page => render(page.url, viewPage, page, address))),
      html.div({
        key: 'wallpaper-swatches',
        className: 'wallpaper-swatches',
      }, themes.entries.map(theme => render(theme.id, viewTheme, theme, address)))
    ]);
  };
  // Exports:

  exports.view = view;
});
