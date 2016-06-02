/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as URI from '../../../../common/url-helper';
import * as Favicon from '../../../../common/favicon';

/*::
import * as WebView from "../WebView"
*/

export const readTitle =
  (model/*:WebView.Model*/, fallback/*:string*/)/*:string*/ =>
  ( ( model.page != null &&
      model.page.title != null &&
      model.page.title !== ''
    )
  ? model.page.title
  : model.navigation.currentURI.search(/^\s*$/)
  ? URI.prettify(model.navigation.currentURI)
  : fallback
  );

export const readFaviconURI =
  (model/*:WebView.Model*/)/*:string*/ =>
  ( (model.page && model.page.faviconURI)
  ? model.page.faviconURI
  : Favicon.getFallback(model.navigation.currentURI)
  );

export const isDark =
  (model/*:WebView.Model*/)/*:boolean*/ =>
  ( model.page != null
  ? model.page.pallet.isDark
  : false
  );

export const canGoBack =
  (model/*:WebView.Model*/)/*:boolean*/ =>
  model.navigation.canGoBack === true;

export const isSecure =
  (model/*:WebView.Model*/)/*:boolean*/ =>
  model.security.secure;
