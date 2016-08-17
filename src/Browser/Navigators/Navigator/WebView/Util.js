/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as URI from '../../../../common/url-helper';
import * as Favicon from '../../../../common/favicon';
import type {Model as WebViewModel} from "../WebView";

export const readTitle =
  (model:WebViewModel, fallback:string):string =>
  ( ( model.page != null &&
      model.page.title != null &&
      model.page.title !== ''
    )
  ? model.page.title
  : model.navigation.url.search(/^\s*$/)
  ? URI.prettify(model.navigation.url)
  : fallback
  );

export const isDark =
  (model:WebViewModel):boolean =>
  ( model.page != null
  ? model.page.pallet.isDark
  : false
  );

export const canGoBack =
  (model:WebViewModel):boolean =>
  model.navigation.canGoBack === true;

export const isSecure =
  (model:WebViewModel):boolean =>
  model.security.secure;
