/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {getDomainName} = require('common/url-helper');

  // Create a theme object, optionall merging your own custom properties on
  // top of the default theme.
  const createTheme = (properties) => Object.assign({
    isDark: false,
    glyphsShowing: false,
    windowCloseButton: {backgroundColor: '#FC5753'},
    windowMinButton: {backgroundColor: '#FDBC40'},
    windowMaxButton: {backgroundColor: '#33C748'},
    reloadButton: {color: 'rgba(0,0,0,0.5)'},
    stopButton: {color: 'rgba(0,0,0,0.5)'},
    backButton: {color: 'rgba(0,0,0,0.5)'},
    urlInput: {color: 'rgba(0,0,0,0.65)'},
    locationBar: {backgroundColor: '#E1E9F0'},
    locationText: {color: 'rgba(0,0,0, 0.65)'},
    titleText: {color: 'rgba(0,0,0,0.5)'},
    pageInfoText: {color: 'rgba(0,0,0,0.5)'},
    tabstrip: {backgroundColor: '#fff'},
    navigationPanel: {backgroundColor: '#fff'},
    progressbar: {color: '#82D3FD'},
    awesomebarSuggestions: {backgroundColor: '#fff', color: 'rgba(0,0,0, 0.65)'}
  }, properties);

  const IS_DARK = true;

  const hardcodedColors = {
    // [foreground, background]
    'youtube.com': ['#cc181e', '#fff', !IS_DARK],
    'yahoo.com': ['#2d1152', '#fff', !IS_DARK],
    'facebook.com': ['#fff', '#3A5795', IS_DARK],
    'biadu.com': ['#2529d8', '#fff', !IS_DARK],
    'amazon.com': ['#e47911', '#fff', !IS_DARK],
    'taobao.com': ['#ff4400', '#fff', !IS_DARK],
    'qq.com': ['#5da4e6', '#fff', !IS_DARK],
    'sina.com.cn': ['#fff', '#ff8500', IS_DARK],
    'instagram.com': ['#fff', '#5380a5', IS_DARK],
    'imgur.com': ['#fff', '#2b2b2b', IS_DARK],
    'cnn.com': ['#fff', '#0c0c0c', IS_DARK],
    'slideshare.net': ['#fff', '#313131', IS_DARK],
    'deviantart.com': ['#fff', '#475c4d', IS_DARK],
    'soundcloud.com': ['#fff', '#383838', IS_DARK],
    'mashable.com': ['#fff', '#00aeef', IS_DARK],
    'daringfireball.net': ['#fff', '#4a525a', IS_DARK],
    'firewatchgame.com': ['#EF4338', '#2D102B', IS_DARK],
    'whatliesbelow.com': ['#fff', '#74888B', IS_DARK],
    'supertimeforce.com': ['#2EBCEC', '#051224', IS_DARK]
  };

  // Expands `foregroundColor`, `backgroundColor` and `isDark` into a full theme
  // object you can use in React views.
  //
  // `foregroundColor`: any valid CSS color string or null.
  // `backgroundColor`: any valid CSS color string or null.
  // `isDark`: boolean. Used to change background of location field.
  //
  // If either foreground or background is null, will fall back to default theme.
  // Returns a theme object.
  const expandCustomTheme = (foregroundColor, backgroundColor, isDark) =>
    createTheme(foregroundColor && backgroundColor ? {
      isDark: isDark,
      glyphsShowing: true,
      windowCloseButton: {backgroundColor: foregroundColor},
      windowMinButton: {backgroundColor: foregroundColor},
      windowMaxButton: {backgroundColor: foregroundColor},
      reloadButton: {color: foregroundColor},
      stopButton: {color: foregroundColor},
      backButton: {color: foregroundColor},
      urlInput: {color: foregroundColor},
      locationBar: {backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.07)'},
      locationText: {color: foregroundColor},
      titleText: {color: foregroundColor},
      pageInfoText: {color: foregroundColor},
      tabstrip: {backgroundColor},
      navigationPanel: {backgroundColor},
      progressbar: {color: foregroundColor},
      awesomebarSuggestions: {backgroundColor, color: foregroundColor}
    } : {});

  // Derive theme object from webView object.
  // If foreground and background are present, returns a custom theme object.
  // Otherwise, returns a copy of default theme object.
  const readTheme = (webView) => expandCustomTheme(
    webView.foregroundColor,
    webView.backgroundColor,
    webView.isDark
  );

  // Creates a state patch for webView from foregroundColor, backgroundColor,
  // isDark.
  const makeColorPatch = (foregroundColor, backgroundColor, isDark) => ({
    foregroundColor: foregroundColor,
    backgroundColor: backgroundColor,
    isDark: isDark
  });

  // Used to create a state patch for `webView`.
  // @FIXME this is a temporary measure until we have the full color matching
  // fallbacks in place.
  const getHardcodedColors = (urlString) => {
    const hostname = getDomainName(urlString);
    const colors = hardcodedColors[hostname];
    return colors ? makeColorPatch(...colors) : makeColorPatch(null, null, !IS_DARK);
  }

  // Exports:

  exports.readTheme = readTheme;
  exports.getHardcodedColors = getHardcodedColors;
  exports.expandCustomTheme = expandCustomTheme;

});
