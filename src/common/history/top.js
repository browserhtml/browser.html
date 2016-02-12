/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*::
import * as Page from "./page"
*/

import {merge} from '../common/prelude'
import {push} from '../common/array'
import * as Tag from './tag'
import * as Visit from './visit'


export const sample =
  ( limit/*:number*/
  , page/*:Page.Model*/
  , top/*:Top.Model*/
  ) => {
    const index = top.pages.findIndex(({_id}) => _id === page._id);
    const pages =
      top
      .pages
      .map
      ($ =>
      ( $._id === page._id
      ? page
      : $
      )
      .slice()
      .sortBy(Page.frequency)
      .slice(0, limit)

    return merge(top, {pages})
  };
