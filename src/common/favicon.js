/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {getOrigin} from '../common/url-helper';


import type {Icon, URI} from "./favicon"


const constructFaviconURI = (href, size) => `${href}#-moz-resolution=${size},${size}`;

export const getFallback =
  (pageURI:URI):URI =>
  constructFaviconURI(getOrigin(pageURI) + '/favicon.ico', FAVICON_SIZE);

// Ideal size for a favicon.
const FAVICON_SIZE = 16 * window.devicePixelRatio;

/**
 * Takes an array of icons, and find the icon the fits best as a favicon.
 * icon {
 *  href: String,
 *  sizes: Maybe(String) // "16x16" or "16x16 32x32" or "any"
 *  rel: Maybe(String)   // "shortcut icon", "icon"
 * }
 */
export const getBestIcon =
  (icons:Array<Icon>)/*:{ bestIcon: ?Icon, faviconURI: ?URI}*/ => {

  const allSizes = new Map(); // store icons per size
  const others = new Set();   // store icons without sizes or non-shortcut icons

  for (var icon of icons) {
    if (icon.rel != 'shortcut icon') {
      others.add(icon);
    } else if (!icon.sizes) {
      others.add(icon);
    } else {
      if (icon.sizes == 'any') {
        // Consider it fits the best size
        allSizes.set(FAVICON_SIZE, icon);
      } else {
        // if sizes = "16x16 32x32", move icon into allSizes(16) and allSizes(32)
        icon.sizes.split(' ')
            .map(s => parseInt(s, 10))
            .forEach(s => allSizes.set(s, icon));
      }
    }
  }

  // @FlowIssue: Flow does not yet support spread on map #1566
  const bestFit = [...allSizes].reduce((prev, curr) => {
    if (!prev) {
      return curr;
    }
    if (Math.abs(prev[0] - FAVICON_SIZE) > Math.abs(curr[0] - FAVICON_SIZE)) {
      // Size of curr fits better than size of prev.
      return curr;
    } else {
      return prev;
    }
  }, undefined);

  // @FlowIssue: Flow does not yet support spread on set #1566
  const bestFitForOthers = [...others].reduce((prev, curr) => {
    if (!prev) {
      return curr;
    }
    if (curr.rel == 'shortcut icon') {
      // Prefer 'shortcut icon'
      return curr;
    }
    return prev;
  }, undefined);

  if (bestFit) {
    const size = bestFit[0];
    const href = bestFit[1].href;
    return {
      bestIcon: bestFit[1],
      faviconURI: constructFaviconURI(href, size),
    }
  }

  if (bestFitForOthers) {
    const href = bestFitForOthers.href;
    return {
      bestIcon: bestFitForOthers,
      faviconURI: constructFaviconURI(href, FAVICON_SIZE),
    }
  }

  return {bestIcon: null, faviconURI: null};
}
