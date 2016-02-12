/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Task, Effects} from 'reflex';
import {merge, tag, tagged} from '../common/prelude';
import {edit, modify, query} from '../common/history/db';
import {cursor} from '../common/cursor';
import {result} from '../common/history/util';
import {PouchDB} from 'PouchDB';

import * as ImportStatus from './history/import-status';
import * as Page from './history/page';
import * as Tag from './history/tag';
import * as Top from './history/top';
import * as Unknown from '../common/unknown';

/*::
import * as History from "./history";
import type {Model, Action} from "./history";

type ID = string;
*/

export const Updated/*:History.Updated*/ = tag("Updated");
export const Import/*:History.Import*/ = tag("Import");
export const Found/*:History.Found*/ = tag("Found");
export const BeginVisit/*:History.BeginVisit*/ = tag("BeginVisit");
export const EndVisit/*:History.EndVisit*/ = tag("EndVisit");
export const TitleChange/*:History.TitleChange*/ = tag("TitleChange");
export const IconChange/*:History.IconChange*/ = tag("IconChange");
export const Search/*:History.Search*/ =
  input =>
  tagged("Search", {input});

// # Update

export const init/*:History.init*/ =
  (name) => {
    const db = new PouchDB({name});
    const [importStatus, fx] = ImportStatus.init(db);
    const step =
      [ { name
        , db
        , query: null
        , top: null
        , importStatus
        }
      , fx
        .map(Import)
      ]
    return step
  }

export const update/*:History.update*/ =
  (model, action) =>
  ( action.type === "BeginVisit"
  ? updateWithTaskResult(model, beginVisit, action.source)
  : action.type === "EndVisit"
  ? updateWithTaskResult(model, endVisit, action.source)
  : action.type === "TitleChange"
  ? updateWithTaskResult(model, changeTitle, action.source)
  : action.type === "IconChange"
  ? updateWithTaskResult(model, changeIcon, action.source)
  : action.type === "Import"
  ? updateImport(model, action.source)
  : action.type === "Search"
  ? updateQuery(model, action.sounce)
  : action.type === "Updated"
  ? updated(model, action.source)
  : Unknown.update(model, action)
  );

const updateWithTaskResult =
  (model, task, info) =>
  [ model
  , Effects.task
    ( result
      (task(info, model.db))
    )
    .map(Updated)
  ]

const updateQuery =
  (model, query) =>
  [ merge(model, {query: query.input})
  , Effects.task
    ( result(query(query.input, model.db)) )
    .map(Found)
  ];

const updated =
  (model, result) =>
  [ model
  , ( result.isOk
    ? Effects.none
    : Unknown.error(result.error)
    )
  ];

const updateImport = cursor
  ( { get: model => model.importStatus
    , set: (model, importStatus) => merge(model, {importStatus})
    , tag: Import
    , update: ImportStatus.update
    }
  );


// Task

export const beginVisit/*:History.beginVisit*/ =
  ({tabID, uri, time, device}, db) =>
  modify
  ( Page.init(uri, null)
  , page => Page.beginVisit(tabID, time, device, page)
  , db
  )

export const endVisit/*:History.endVisit*/ =
  ({tabID, uri, time, device}, db) =>
  edit
  ( Page.init(uri, null)._id
  , page => Page.endVisit(tabID, time, device, page)
  , db
  )

export const changeTitle/*:History.changeTitle*/ =
  ({uri, title}, db) =>
  modify
  ( Page.init(uri, title)
  , page => merge(page, {title})
  , db
  )

export const changeIcon/*:History.changeIcon*/ =
  ({uri, icon}, db) =>
  modify
  ( Page.init(uri, null)
  , page => merge(page, {icon})
  , db
  )
