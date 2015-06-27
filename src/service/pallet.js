/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Maybe, Union} = require('common/typed');
  const {getDomainName} = require('common/url-helper');
  const WebLoader = require('browser/web-loader');
  const tinycolor = require('tinycolor');

  const DARK = true;

  const curated = {
    // [foreground, background]
    'youtube.com': ['#cc181e', '#fff'],
    'yahoo.com': ['#2d1152', '#fff'],
    'facebook.com': ['#fff', '#3A5795'],
    'biadu.com': ['#2529d8', '#fff'],
    'amazon.com': ['#e47911', '#fff'],
    'taobao.com': ['#ff4400', '#fff'],
    'qq.com': ['#5da4e6', '#fff'],
    'sina.com.cn': ['#fff', '#ff8500', DARK],
    'instagram.com': ['#fff', '#5380a5', DARK],
    'imgur.com': ['#fff', '#2b2b2b', DARK],
    'cnn.com': ['#fff', '#0c0c0c', DARK],
    'slideshare.net': ['#fff', '#313131', DARK],
    'deviantart.com': ['#fff', '#475c4d', DARK],
    'soundcloud.com': ['#fff', '#383838', DARK],
    'mashable.com': ['#fff', '#00aeef', DARK],
    'daringfireball.net': ['#fff', '#4a525a', DARK],
    'firewatchgame.com': ['#EF4338', '#2D102B', DARK],
    'whatliesbelow.com': ['#fff', '#74888B', DARK],
    'supertimeforce.com': ['#2EBCEC', '#051224', DARK]
  };

  const Color = String;

  const Model = Record({
    isDark: false,
    foreground: Maybe(Color),
    background: Maybe(Color)
  }, 'Pallet');
  exports.Model = Model;

  const isBright = hexcolor =>
    parseInt(hexcolor, 16) > 0xffffff/2;


  const read = input => {
    const pigments = String(input).split('|').concat(null, null);
    const [bg, fg] = pigments.slice(0, 2).map(tinycolor);
    const background = bg.isValid() ? bg.toRgbString() : void(0);
    // tinycolor uses YIQ for brightness calculation, we also throw more
    // primitive hex based calculation and treat background as dark if any
    // of two calculations consider color to be dark.
    const isDark = background && (bg.isDark() || !isBright(bg.toHex()));
    const foreground = fg.isValid() ? fg.toRgbString() :
                       isDark ? '#fff' :
                       void(0);
    return Model({isDark, foreground, background});
  };
  exports.read = read;

  // Action

  const PalletChange = Record({
    id: String,
    pallet: Model
  }, 'Pallet.Action.Change');

  const Action = Union({PalletChange});
  exports.Action = Action;

  const none = Object.freeze([]);

  const service = address => action => {
    if (action instanceof WebLoader.Action.LocationChange) {
      const hostname = getDomainName(action.uri);
      const theme = curated[hostname];
      if (theme) {
        const [foreground, background, isDark] = theme;
        const pallet = Model({foreground, background, isDark});
        // Use promise so behavior is going to be closer to what it will be
        // when we stop faking.
        Promise.resolve()
               .then(address.send(PalletChange({id: action.id, pallet})));
      }
    }
    return action
  };

  exports.service = service;
});
