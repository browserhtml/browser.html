/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const {Record, Maybe, Union} = require('../common/typed');
  const URI = require('../common/url-helper');
  const WebView = require('../browser/web-view');
  const Loader = require('../browser/web-loader');
  const tinycolor = require('tinycolor2');

  const curated = {
    // [background, foreground]
    'facebook.com': ['#3a5795', '#fff'],
    'sina.com.cn': ['#ff8500', '#fff'],
    'reddit.com': ['#f0f0f0', '#336699'],
    'instagram.com': ['#125688', '#fff'],
    'imgur.com': ['#2b2b2b', '#fff'],
    'cnn.com': ['#0c0c0c', '#fff'],
    'slideshare.net': ['#313131', '#fff'],
    'deviantart.com': ['#475c4d', '#fff'],
    'soundcloud.com': ['#333333', '#FF5500'],
    'mashable.com': ['#00aeef', '#fff'],
    'daringfireball.net': ['#4a525a', '#fff'],
    'firewatchgame.com': ['#2d102b', '#ef4338'],
    'whatliesbelow.com': ['#74888b', '#fff', ],
    'supertimeforce.com': ['#051224', '#2ebcec'],
    'github.com': ['rgb(245, 245, 245), rgb(51, 51, 51)']
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

  const AnnounceCuratedColor = Record({
    description: 'Announce theme colors for curated domains',
    color: String
  });
  exports.AnnounceCuratedColor = AnnounceCuratedColor;

  const service = address => action => {
    const isWebViewAction = action instanceof WebView.ByID ||
                            action instanceof WebView.BySelected;
    if (isWebViewAction && action.action instanceof Loader.LocationChanged) {
      const hostname = URI.getDomainName(action.action.uri);
      const theme = curated[hostname];
      if (theme) {
        address.receive(action.set('action', AnnounceCuratedColor({
          color: theme.join('|')
        })));
      }
    }
    return action
  };

  exports.service = service;
