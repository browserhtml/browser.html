/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */



import tinycolor from 'tinycolor2';
import {Effects, Task} from 'reflex';
import {getDomainName} from '../common/url-helper';

/*::
import type {Address, DOM, Never} from "reflex"
import type {URI, HexColor, Color, Model, Theme} from "./pallet";
*/

// Hand-curated themes for popular websites.
const curated = {
  'facebook.com': {background: '#3a5795', foreground: '#fff'},
  'sina.com.cn': {background: '#ff8500', foreground: '#fff'},
  'reddit.com': {background: '#f0f0f0', foreground: '#336699'},
  'instagram.com': {background: '#125688', foreground: '#fff'},
  'imgur.com': {background: '#2b2b2b', foreground: '#fff'},
  'cnn.com': {background: '#0c0c0c', foreground: '#fff'},
  'slideshare.net': {background: '#313131', foreground: '#fff'},
  'deviantart.com': {background: '#475c4d', foreground: '#fff'},
  'soundcloud.com': {background: '#333333', foreground: '#FF5500'},
  'mashable.com': {background: '#00aeef', foreground: '#fff'},
  'daringfireball.net': {background: '#4a525a', foreground: '#fff'},
  'firewatchgame.com': {background: '#2d102b', foreground: '#ef4338'},
  'whatliesbelow.com': {background: '#74888b', foreground: '#fff'},
  'supertimeforce.com': {background: '#051224', foreground: '#2ebcec'},
  'github.com': {background: 'rgb(245, 245, 245)', foreground: 'rgb(51, 51, 51)'},
};

// Calculate the distance from white, returning a boolean.
// This is a pretty primitive check.
const isHexBright =
  (hexcolor/*:HexColor*/)/*:boolean*/ =>
  parseInt(hexcolor, 16) > 0xffffff/2;

export const isDark = (color/*:Color*/)/*:boolean*/ => {
  const tcolor = tinycolor(color);
  // tinycolor uses YIQ for brightness calculation, we also throw more
  // primitive hex based calculation and treat background as dark if any
  // of two calculations consider color to be dark.
  return (tcolor.isDark() || !isHexBright(tcolor.toHex()));
}

export const blank/*:Model*/ = {
  isDark: false,
  foreground: null,
  background: null
};

export const create =
  (background/*:Color*/, foreground/*:Color*/)/*:Model*/ =>
  ( { background
    , foreground
    , isDark: isDark(background)
    }
  );

export const requestCuratedColor =
  (uri/*:URI*/)/*:Task<Never, ?Theme>*/ =>
  Task.create(() => {
    const hostname = getDomainName(uri);
    return hostname == null
      ? undefined
      : curated[hostname];
  });
