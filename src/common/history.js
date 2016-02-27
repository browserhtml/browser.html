/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Task, Effects} from 'reflex';
import {merge, tag, tagged} from '../common/prelude';
import {edit, modify, query} from '../common/history/db';
import {cursor} from '../common/cursor';
import {result} from '../common/history/util';
import PouchDB from 'PouchDB';

import {pattern, score} from '../common/match';
import * as ImportStatus from './history/import-status';
import * as Page from './history/page';
import * as Tag from './history/tag';
import * as Top from './history/top';
import * as Unknown from '../common/unknown';
import * as URI from '../common/url-helper';

/*::
import * as History from "./history";
import type {Model, Action} from "./history";

type ID = string;
*/

export const UpdateMatches = tag("UpdateMatches");
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

export const init =
  (name/*:string*/)/*:[Model, Effects<Action>]*/ => {
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

export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ =>
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
  ? updateQuery(model, action.source)
  : action.type === "Found"
  ? updateMatches(model, action.source)
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
  (model, {input, type}) =>
  [ merge(model, {query: {input, type}})
  , ( model.query == null
    ? Effects.task
      ( result(query(`${type}/`, model.db)) )
      .map(Found)
    : Effects.none
    )
  ];

const updateMatches =
  (model, result) =>
  [ merge(model, {query: null})
  , ( model.query == null
    ? Effects.none
    : result.isOk
    ? Effects.receive
      ( UpdateMatches
        ( selectMatches(model.query, result.value) )
      )
    : Effects.task
      ( Unknown.error(result.error) )
    )
  ]

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

// Util

const byScore =
  (a, b) =>
  ( a.score > b.score
  ? -1
  : a.score < b.score
  ? 1
  : 0
  );

const isPositiveScore =
  a =>
  a.score > 0;

const selectMatches =
  (query/*:History.Query*/, pages/*:Array<Page.Model>*/)/*:Array<Page.Match>*/ => {
    const terms = query.input.split(/\s+/g);
    const domainQuery =
      ( terms.length === 1
      ? pattern(terms[0])
      : null
      );

    const generalQuery =
      pattern(terms.join('[\\s\\S]+') + '|' + terms.join('|'));

    const matches = pages.map
    ( page => {
        const domain = URI.getDomainName(page.uri);
        const pathname = URI.getPathname(page.uri);
        const title =
          ( page.title == null
          ? ''
          : page.title
          );

        // frequency score is ranked from 0-1 not based on quality of
        // match but solely on how often this page has been visited in the
        // past.
        const frequencyScore = 1 - (0.7 / (1 + page.visits.length));
        // Title and uri are scored based of input length & match length
        // and match index.
        const titleScore = score(generalQuery, title)
        const uriScore = score(generalQuery, page.uri);
        const domainScore = domainQuery ? score(domainQuery, domain) : 0;
        const pathScore = domainQuery ? score(domainQuery, pathname) : 0;

        // Total score is ranked form `-1` to `1`. Individual score has certain
        // impact it can have on overal score which expressed by multiplication
        // with a percentage of the impact it may have. No match on individual
        // field has a negative impact (again besed on it's impact weight).
        const totalScore
          = frequencyScore * 40/100
          + titleScore * 17/100
          + domainScore * 25/100
          + pathScore * 13/100
          + uriScore * 5/100;

        const match =
          { score: totalScore
          , isTopHit:
            ( domainQuery == null
            ? false
            : domain.startsWith(domainQuery.source)
            )
          , uri: page.uri
          , title: page.title
          };

        return match;
      }
    )

    const result =
      matches
      // order by score
      .sort(byScore)
      // limit number of matches
      .slice(0, query.limit)
      // kill negative results
      .filter(isPositiveScore)

    return result
  }
