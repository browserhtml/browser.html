/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {Effects} from "reflex";
import {merge, tag} from "../../common/prelude";
import {result, promise} from "./util";
import {get, put, edit, modify, bulk} from "./db";
import {ok, error} from "../../common/result";
import * as Page from "./page";
import * as Unknow from "../../common/unknown";

/*::
import * as ImportStatus from "./import-status"
import type {Model, Status} from  "./import-status";
import {Task} from "reflex/type";

import type {Never} from "reflex/type/effects";
import type {PouchDB, ID, Response, Failure} from "./pouch";
import type {Result} from "../../../type/common/result";
*/

const ImportStatusAction = tag('ImportStatus')


export const status/*:ImportStatus.status*/ =
  (value) =>
  ( { _id: 'ImportStatus'
    , _rev: null
    , status: value
    }
  );


// Update


export const init/*:ImportStatus.init*/ =
  (db) =>
  [ { db
    , status: null
    }
  , Effects
    .task(result(getImportStatus(db)))
    .map(tag("ImportStatusRead"))
  ];


export const update/*:ImportStatus.update*/ =
  (model, action) =>
  ( action.type === 'ImportStatusUpdate'
  ? updateImportStatus(model, action.source)
  : action.type === 'TopSitesURIs'
  ? updateTopSiteURIs(model, action.source)
  : action.type === 'PagesImported'
  ? updateImportedPages(model, action.source)
  : null
  )

const updateImportStatus =
  (model, result) =>
  ( result.isOk
  ? [ merge(model, {status: result.value})
    , ( result.value.value === 0
      ? Effects.task
        (result(fetchTopSiteURIs))
        .map(tag('TopSitesURIs'))
      : Effects.none
      )
    ]
  : [ model
    , Effects.task
      ( Unknow.error('Failed to fetch update status', result.error) )
    ]
  );

const updateTopSiteURIs =
  (model, result) =>
  ( result.isOk
  ? [ model
    , Effects.task
      ( result
        ( importPages
          ( result.value.map(uri => Page.init(uri, null))
          , model.db
          )
        )
      )
      .map(tag('PagesImported'))
    ]
  : [ model
    , Effects.task
      ( Unknow.error('Failed to fetch top site URIs', result.error) )
    ]
  )

const updateImportedPages =
  (model, result) =>
  ( result.isOk
  ? [ model
    , Effects.task
      ( result
        ( setImportStatus
          ( merge
            ( model.status
            , {value: 1}
            )
          , model.db
          )
        )
      )
      .map(tag('StatusUpdated'))
    ]
  : [ model
    , Effects.task
      ( Unknow.error('Failed to fetch update status', result.error) )
    ]
  )


// # Tasks

// Creates a task that reads special 'ImportStatus' document and succeeds
// with the status of the import (which is 1 when import was done) or with
// 0 if document is not present. Any other db access failures propagate &
// need to be handled.
const getImportStatus =
  (db/*:PouchDB*/)/*:Task<Failure, Status>*/ =>
  get('ImportStatus', db)
  .map
  ( document => document.status )
  .catch
  ( result =>
    ( result.status === 404
    ? Task.succeed(status(0))
    : Task.fail(result)
    )
  );


const fetchTopSiteURIs/*:Task<Error, Array<Page.URI>>*/ =
  promise(fetch('../../resources/sites.json'))
  .chain(response => promise(response.json()));



const importPages =
  ( pages/*:Array<Page.Model>*/
  , db/*:PouchDB*/
  )/*:Task<Failure, Array<Page.Model>>*/ =>
  bulk
  ( pages
  , db
  );

const setImportStatus =
  ( status/*:Status*/
  , db/*:PouchDB*/
  )/*:Task<Failure, Status>*/ =>
  modify
  ( status
  , record => merge(record, {value: status.value})
  , db
  )
  .map
  ( response =>
    merge
    ( status
    , { _id: response.id
      , _rev: response.rev
      }
    )
  )
