/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {promise} from "./util";
import {Task} from "reflex";
import {merge} from "../../common/prelude";

/*::
import type {Never} from "reflex/type/effects";
import type {PouchDB, ID, Response, Failure} from "./pouch";
 */

// Creates a task that get's a record with a given ID from the given DB. Task
// may fail or succeed.
export const get = /*::<document>*/
  (id/*:ID*/, db/*:PouchDB*/)/*:Task<Failure, document>*/ =>
   promise(db.get(id));

// Creates a task that put's a given record into DB.
export const put = /*::<document>*/
  (record/*:document*/, db/*:PouchDB*/)/*:Task<Failure, Response>*/ =>
   promise(db.put(record));

// Edits document with a given `id` with a passed `f` function, where `f`
// takes most recent version of the document with a given `id` and returns
// and edited version, which is then saved into db. If save fails due to
// conflict (implying that it was updated in the meantime) it retries the
// edit and keeps on doing it until succeeds or fails differently.
export const edit = /*::<document>*/
  ( id/*:ID*/
  , f/*:(record:document) => document*/
  , db/*:PouchDB*/
  )/*:Task<Failure, Response>*/ =>
  get(id, db)
  .chain(record => put(f(record), db))
  .catch
  ( error =>
    ( error.status === 409
    ? edit(id, f, db)
    : Task.fail(error)
    )
  );


// Modifies latest version of a given document via given `f` function using
// above defined `edit` operation (there for it will keep retrying on conflicts)
// If matching record is not found than it is just saved as is.
export const modify = /*::<document:{_id:ID, [key:string]: any}>*/
  (record /*:document*/
  , f/*:(a:document) => document*/
  , db/*:PouchDB*/
  )/*:Task<Failure, Response>*/ =>
  ( record._rev == null
  ? put
    ( f(record)
    , db
    )
    .catch
    ( error =>
      ( error.status === 409
      // If we encounter conflict retry. Please note that we intenitonally
      // use `modify` here instead of `edit` as it will handle case where
      // document may get deleted while we try to get it with edit.
      ? modify(merge(record, {_rev: 'latest'}), f, db)
      : Task.fail(error)
      )
    )
  : edit
    ( record._id
    , f
    , db
    )
    .catch
    ( error =>
      ( error.status === 404
      ? put(f(record), db)
      : Task.fail(error)
      )
    )
  );

export const bulk = /*::<document:{_id:ID, [key:string]: any}>*/
  ( records/*:Array<document>*/
  , db/*:PouchDB*/
  )/*:Task<Failure, Array<Response>>*/ =>
  promise(db.bulkDocs(records));


export const query = /*::<document:{_id:ID, [key:string]: any}>*/
  ( input/*:string*/
  , db/*:PouchDB*/
  )/*:Task<Failure, Array<document>>*/ =>
  promise
  ( db.allDocs
    ( { include_docs: true
      , startKey:
        ( input === ""
        ? null
        : `${input}/`
        )
      , endKey:
        ( input === ""
        ? null
        : `${input}/\uffff`
        )
      }
    )
  )
  .map(result => result.rows.map(row => row.doc))
