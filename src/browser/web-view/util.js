/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as URI from '../../common/url-helper';

export const readTitle/*:type.readTitle*/ = (model, fallback) =>
 ( (model.page && model.page.title && model.page.title !== '')
 ? model.page.title
 : model.navigation.currentURI.search(/^\s*$/)
 ? URI.prettify(model.navigation.currentURI)
 : fallback
 );

export const readFaviconURI/*:type.readFaviconURI*/ = (model) =>
 ( (model.page && model.page.faviconURI)
 ? model.page.faviconURI
 // @TODO use a proper URL.join function. Need to add this to url-helper lib.
 : `${model.navigation.currentURI}/favicon.ico`
 );

export const isDark/*:type.isDark*/ = (model) =>
 ( model.page
 ? model.page.pallet.isDark
 : false
 );

// Determine if a webview model is displaying newtab page.
// @TODO is there a better way to do this? We might want to make WebView an
// enum of WebView or NewTab?
export const isNewTab = (model) =>
  URI.read(model.page.uri) === URI.read('about:newtab');
