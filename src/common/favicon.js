/* this source code form is subject to the terms of the mozilla public
 * license, v. 2.0. if a copy of the mpl was not distributed with this
 * file, you can obtain one at http://mozilla.org/mpl/2.0/. */
  'use strict';

  const {getOrigin} = require('../common/url-helper');

  const constructFaviconURL = (href, size) => `${href}#-moz-resolution=${size},${size}`;

  const getFallback = (pageURL) => pageURL ?
    constructFaviconURL(getOrigin(pageURL) + '/favicon.ico', FAVICON_SIZE) : null;

  // Ideal size for a favicon.
  const FAVICON_SIZE = 16 * devicePixelRatio;

  /**
   * Takes an array of icons, and find the icon the fits best as a favicon.
   * icon {
   *  href: String,
   *  sizes: Maybe(String) // "16x16" or "16x16 32x32" or "any"
   *  rel: Maybe(String)   // "shortcut icon", "icon"
   * }
   */
  const getBestIcon = (icons) => {

    const allSizes = new Map(); // store icons per size
    const others = new Set();   // store icons without sizes or non-shortcut icons

    for (var icon of icons) {
      if (!icon) {
        continue;
      }
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
        faviconURL: constructFaviconURL(href, size),
      }
    }

    if (bestFitForOthers) {
      const href = bestFitForOthers.href;
      return {
        bestIcon: bestFitForOthers,
        faviconURL: constructFaviconURL(href, FAVICON_SIZE),
      }
    }

    return {bestIcon: null, faviconURL: null};
  };

  exports.getBestIcon = getBestIcon;
  exports.getFallback = getFallback;
