/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {DOM} = require('react')
  const Component = require('omniscient');
  const {identity} = require('lang/functional');
  const {readDashboardTheme, getDashboardThemePatch, getWallpaperSwatches} = require('./dashboard/actions');

  const readBackground = uri => ('none' && `url(${uri})`);

  const changeWallpaper = key => dashboard =>
    dashboard.merge(getDashboardThemePatch(key));

  const List = (Item, a2b) => Component('List', (options, handlers) =>
    DOM.div(options, options.items.map(options =>
      Item(a2b(options), handlers))));

  const WallpaperSwatch = ({key, backgroundColor}, {edit}) =>
    DOM.div({
      key,
      className: 'wallpaper-swatch',
      style: {backgroundColor},
      onClick: event => edit(changeWallpaper(key))
    });

  const WallpaperSwatches = List(WallpaperSwatch, identity);

  const DashboardTile = ({key, uri, image, title}, {onOpen}) =>
    DOM.div({key,
             onClick: event => onOpen(uri),
             className: 'tile tile-large'}, [
             DOM.div({key: 'tileThumbnail',
                      className: 'tile-thumbnail',
                      style: {backgroundImage: readBackground(image)}}),
             DOM.div({key: 'tileTitle',
                      className: 'tile-title'}, null, title)]);

  const DashboardTiles = List(DashboardTile, item => ({
    key: item.get('uri'),
    uri: item.get('uri'),
    image: item.get('image'),
    title: item.get('title')
  }));

  const Dashboard = Component('Dashboard',
    ({dashboard, hidden}, {onOpen, edit}) =>
    DOM.div({
      style: readDashboardTheme(dashboard),
      className: 'dashboard',
      hidden
    }, [
      DashboardTiles({
        key: 'dashboard-tiles',
        className: 'dashboard-tiles',
        items: dashboard.get('items')
      }, {onOpen}),
      WallpaperSwatches({
        key: 'wallpaper-swatches',
        className: 'wallpaper-swatches',
        items: getWallpaperSwatches()
      }, {edit})
    ]));

  // Exports:

  exports.Dashboard = Dashboard;

});
