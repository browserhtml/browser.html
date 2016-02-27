/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*::
import * as Page from "./page"
*/

import {merge} from '../../common/prelude'
import {push} from '../../common/array'
import * as Tag from './tag'
import * as Visit from './visit'

export const frequency =
  (model/*:Page.Model*/)/*:number*/ =>
  model.visits.length;

export const init =
  ( uri/*:Page.URI*/
  , title/*:?string*/
  )/*:Page.Model*/ =>
  ( { type: 'Page'
    , _id: `Page/${uri}`
    , _rev: null
    , uri
    , title
    , visits: []
    , tags: []
    , icon: null
    , image: null
    }
  );

export const beginVisit =
  ( tabID/*:string*/
  , time/*:Page.Time*/
  , device/*:string*/
  , model/*:Page.Model*/
  )/*:Page.Model*/ =>
  merge
  ( model
  , { visits:
      push
      ( Visit.begin
        ( tabID
        , time
        , device
        )
      , model.visits
      )
    }
  );

export const endVisit =
  ( tabID/*:string*/
  , time/*:Page.Time*/
  , device/*:string*/
  , model/*:Page.Model*/
  )/*:Page.Model*/ =>
  merge
  ( model
  , { visits:
      model.visits
      .map
      ( visit =>
        ( visit.id === tabID
        ? Visit.end(visit)
        : visit
        )
      )
    }
  );
