/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*:: import * as type from "../../type/browser/pallet" */

import tinycolor from 'tinycolor2';
import {Effects, Task} from 'reflex';
import * as URI from '../common/url-helper';
// Import hand-curated color pallets for popular websites.
import curated from '../../pallet.json';

// Calculate the distance from white, returning a boolean.
// This is a pretty primitive check.
const isHexBright/*:type.isHexBright*/ = hexcolor =>
  parseInt(hexcolor, 16) > 0xffffff/2;

export const isDark/*:type.isDark*/ = color => {
  const tcolor = tinycolor(color);
  // tinycolor uses YIQ for brightness calculation, we also throw more
  // primitive hex based calculation and treat background as dark if any
  // of two calculations consider color to be dark.
  return (tcolor.isDark() || !isHexBright(tcolor.toHex()));
}

export const blank/*:type.blank*/ = {
  isDark: false,
  foreground: null,
  background: null
};

export const create/*:type.create*/ = (background, foreground) =>
  ( { background
    , foreground
    , isDark: isDark(background)
    }
  );

export const requestCuratedColor/*:type.requestCuratedColor*/ = uri =>
  Task.future(() => {
    const hostname = URI.getDomainName(uri);
    return Promise.resolve
      ( hostname == null
      ? null
      : curated[hostname]
      );
  });
