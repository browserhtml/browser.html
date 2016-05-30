/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {merge, tag, tagged} from "../../common/prelude"
import {Effects, html, thunk, forward} from "reflex"
import {Style, StyleSheet} from "../../common/style";
import {cursor} from "../../common/cursor";
import * as Unknown from "../../common/unknown";

import * as Tiles from './newtab/tiles';
import * as Wallpapers from './newtab/wallpapers';
import * as Help from './newtab/help';

/*::
import type {Address, DOM} from "reflex"
import type {Model, Action} from "./newtab"
*/

const WallpapersAction =
  action =>
  ( { type: 'Wallpapers'
    , source: action
    }
  );

const TilesAction =
  action =>
  ( { type: 'Tiles'
    , source: action
    }
  );

const HelpAction =
  action =>
  ( { type: 'Help'
    , source: action
    }
  );

export const init =
  ()/*:[Model, Effects<Action>]*/ =>
  {
    const [tiles, tilesFx] = Tiles.init();
    const [wallpapers, wallpaperFx] = Wallpapers.init();
    const [help, helpFx] = Help.init();
    return (
      [
        { wallpapers
        , tiles
        , help
        }
      , Effects.batch
        ( [ tilesFx.map(TilesAction)
          , wallpaperFx.map(WallpapersAction)
          , helpFx.map(HelpAction)
          ]
        )
      ]
    );
  }

const updateWallpapers = cursor({
  get: model => model.wallpapers,
  set: (model, wallpapers) => merge(model, {wallpapers}),
  update: Wallpapers.update,
  tag: WallpapersAction
});

const updateTiles = cursor
  ( { get: model => model.tiles
    , set: (model, tiles) => merge(model, {tiles})
    , update: Tiles.update
    , tag: TilesAction
    }
  );

const updateHelp = cursor
  ( { get: model => model.help
    , set: (model, help) => merge(model, {help})
    , update: Help.update
    , tag: HelpAction
    }
  );

export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ =>
  ( action.type === 'Wallpapers'
  ? updateWallpapers(model, action.source)
  : action.type === 'Tiles'
  ? updateTiles(model, action.source)
  : Unknown.update(model, action)
  );

export const styleSheet =
  StyleSheet.create
  ( { base:
      { backgroundColor: '#fff'
      , width: '100%'
      , height: '100%'
      , position: 'absolute'
      , minHeight: '580px'
      }
    , shown:
      {}
    , hidden:
      { display: 'none'
      }
    }
  );

const readWallpaper = ({src, color}) =>
  (
    { backgroundImage:
      ( src
      ? `url(${src})`
      : 'none'
      )
    , backgroundColor: color
    , backgroundSize: 'cover'
    , backgroundRepeat: 'no-repeat'
    , backgroundPosition: 'center center'
    }
  );

export const view =
  ({wallpapers, tiles, help}/*:Model*/, address/*:Address<Action>*/)/*:DOM*/ => {
  const activeWallpaper = Wallpapers.active(wallpapers);
  return (
    html.div
    ( { className: 'newtab'
      , style: Style
        ( styleSheet.base
        , readWallpaper(activeWallpaper)
        )
      }
    , [ html.meta
        ( { name: "theme-color"
          , content: activeWallpaper.color
          }
        )
      , thunk
        ( 'tiles'
        , Tiles.view
        , tiles
        , forward(address, TilesAction)
        , activeWallpaper.isDark
        )
      , thunk
        ( 'wallpaper'
        , Wallpapers.view
        , wallpapers
        , forward(address, WallpapersAction)
        )
      , thunk
        ( 'help'
        , Help.view
        , help
        , forward(address, HelpAction)
        , activeWallpaper.isDark
        )
      ]
    )
  )
}
