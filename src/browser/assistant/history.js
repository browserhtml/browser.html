/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {Effects, Task, html, forward, thunk} from "reflex";
import {merge, always, tag, tagged, batch} from "../../common/prelude";
import {result, promise} from "../../common/history/util";
import {Style, StyleSheet} from '../../common/style';
import * as Result from '../../common/result';
import PouchDB from 'PouchDB';
import * as Page from './page';
import * as TopHit from './top-hit';
import * as Title from "./title";
import * as URL from "./url";
import * as Icon from "./icon";
import * as Suggestion from "./suggestion";
import * as Unknown from '../../common/unknown';



/*::
import * as History from "../../../type/browser/assistant/history"
import type {Model, Action, PID} from "../../../type/browser/assistant/history"
import type {Address, VirtualTree} from "reflex/type"
*/

export const Terminate = tagged("Terminate");
export const Reset = tag("Reset");
const Abort = tag("Abort");
export const Query = tag("Query");
const Search = tag("Search");
const UpdateMatches = tag("UpdateMatches");
const Spawned = tag("Spawned");
const Killed = tag("Killed");
const Sent = tag("Sent");
const Received = tag("Received");
const byURI =
  uri =>
  action =>
  tagged("ByURI", {uri, action});



export const init =
  (query/*:string*/, limit/*:number*/)/*:[Model, Effects<Action>]*/ =>
  [ { query
    , size: 0
    , queryID: 0
    , limit
    , selected: null
    , matches: {}
    , items: []
    , pid: null
    }
  , Effects.task(result(spawn('../../../dist/worker/history.js')))
    .map(Spawned)
  ]

export const terminate =
  (model/*:Model*/)/*:[Model, Effects<Action>]*/ =>
  [ merge
    ( model
    , { pid: null }
    )
  , Effects.task
    (result(kill(model.pid)))
    .map(Killed)
  ];

export const reset =
  (model/*:Model*/)/*:[Model, Effects<Action>]*/ =>
  [ merge
    ( model
    , { query: null
      , queryID: model.queryID + 1
      , selected: null
      , matches: {}
      , items: []
      }
    )
  , Effects.none
  ];


const unselect =
  model =>
  [ merge(model, {selected: null})
  , Effects.none
  ]

const selectNext =
  model =>
  ( model.selected == null
  ? [ ( model.size === 0
      ? model
      : merge(model, {selected: 0})
      )
    , Effects.none
    ]
  : model.selected === model.size - 1
  ? unselect(model)
  : [ merge(model, {selected: model.selected + 1 })
    , Effects.none
    ]
  )

const selectPrevious =
  model =>
  ( model.selected == null
  ? [ ( model.size === 0
      ? model
      : merge(model, {selected: model.size -1 })
      )
    , Effects.none
    ]
  : model.selected == 0
  ? unselect(model)
  : [ merge(model, {selected: model.selected - 1 })
    , Effects.none
    ]
  )

const updateQuery =
  (model, query) =>
  ( model.query === query
  ? [ model, Effects.none ]
  : [ merge(model, {query, queryID: model.queryID + 1 })
    , ( model.pid == null
      ? Effects.task(result(spawn('../../../dist/worker/history.js')))
        .map(Spawned)
      : Effects.task
        ( result
          ( send
            ( model.pid
            , Search
              ( { input: query
                , type: 'Page'
                , limit: model.limit
                }
              )
            )
          )
        )
        .map(Sent)
      )
    ]
  );


const updateMatches = (model, matches) =>
  replaceMatches(model, matches);

const replaceMatches = (model, results) => {
  const items = results.map(match => match.uri)
  const matches = {}
  results.forEach(match => matches[match.uri] = match)
  return [retainSelected(model, {matches, items}), Effects.none]
}

// If updated entries no longer have item that was selected we reset
// a selection. Otherwise we update a selection to have it keep the item
// which was selected.
const retainSelected = (model, {matches, items}) => {
  // If there was no selected entry there is nothing to retain so
  // return as is.
  let selected = model.selected
  if (model.selected != null) {
    const uri = model.items[model.selected]
    if (matches[uri] == null) {
      matches[uri] = model.matches[uri]
      items.unshift(uri)
    }
    selected = items.indexOf(uri)
  }
  const size = Math.min(model.limit, items.length)
  return merge(model, {size, selected, items, matches})
};

const report =
  (...args) =>
  Effects.task(Unknown.error(...args));

const spawned = (model, input) =>
  ( input.isOk
  ? [ merge(model, {pid: input.value})
    , Effects.batch
      ( [ Effects.task
          (result(receive(input.value)))
          .map(Received)
        , ( model.query == null
          ? Effects.none
          : model.query === ""
          ? Effects.none
          : Effects.task
            ( result
              ( send
                ( input.value
                , Search
                  ( { input: model.query
                    , type: 'Page'
                    , limit: model.limit
                    }
                  )
                )
              )
            )
          )
        ]
      )
    ]
  : [ model
    , report(input.error)
    ]
  )

const killed = (model, result) =>
  ( result.isOk
  ? ( model.pid === result.value
    ? [ merge(model, {pid: null})
      , Effects.none
      ]
    : model.pid === null
    // On terminate we set `pid` to `null` so that new verison of application
    // will resume from the state without `pid`. Which is why we don't want to
    // report error here if we already cleared out `model.pid`.
    ? [ merge(model, {pid: null})
      , Effects.none
      ]
    : [ model
      , report(`Unknown worker ${result.value} was killed`)
      ]
    )
  : [ model
    , report(`Failed to kill a worker ${model.pid}`, result.error)
    ]
  );


const sent = (model, result) =>
  ( result.isOk
  ? [ model
    , Effects.none
    ]
  : [ model
    , report(result.error)
    ]
  );

const received = (model, input) => {
  if (input.isOk) {
    const [next, fx] = update(model, input.value)
    const out =
      [ model
      , Effects.batch
        ( [ fx
          , ( model.pid == null
            ? Effects.none
            : Effects.task
              ( result(receive(model.pid)) )
              .map(Received)
            )
          ]
        )
      ];
    return out
  }
  else {
    const out =
      [ model
      , report(input.error)
      ]

    return out;
  }
};

export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ =>
  ( action.type === "Query"
  ? updateQuery(model, action.source)
  : action.type === "SelectNext"
  ? selectNext(model)
  : action.type === "SelectPrevious"
  ? selectPrevious(model)
  : action.type === "Unselect"
  ? unselect(model)
  : action.type === "UpdateMatches"
  ? updateMatches(model, action.source)
  : action.type === "Reset"
  ? reset(model)
  : action.type === "Terminate"
  ? terminate(model)

  : action.type === "Spawned"
  ? spawned(model, action.source)
  : action.type === "Killed"
  ? killed(model, action.source)
  : action.type === "Sent"
  ? sent(model, action.source)
  : action.type === "Received"
  ? received(model, action.source)

  : Unknown.update(model, action)
  )

const innerView =
  (model, address, isSelected) =>
  [ Icon.view('', isSelected)
  , Title.view(model.title, isSelected)
  , URL.view(model)
  ];


export const render =
  (model/*:Model*/, address/*:Address<Action>*/)/*:VirtualTree*/ =>
  html.embed
  ( null
  , model.items.map
    ( (uri, index) =>
      Suggestion.view
      ( model.selected === index
      , innerView
        ( model.matches[uri]
        , forward(address, byURI(uri))
        , model.selected === index
        )
      )
    )
  )

export const view =
  (model/*:Model*/, address/*:Address<Action>*/)/*:VirtualTree*/ =>
  thunk
  ( 'history'
  , render
  , model
  , address
  );

// Task.

const byPID =
  (pid/*:number*/)/*:?Worker*/ =>
  window.Worker[`_${pid}`];

// Spawn a new web worker.
const spawn = uri =>
  Task.future(() => new Promise((resolve) => {
    if (window.Worker.nextPID == null) {
      window.Worker.nextPID = 0
    }

    const pid = ++window.Worker.nextPID
    window.Worker[`_${pid}`] = new window.Worker(uri);
    resolve(pid);
  }));

const receive = (pid/*:PID*/)/*:Task<Error, Array<History.Match>>*/ =>
  Task.future(() => new Promise((resolve, reject) => {
    const worker = byPID(pid);
    if (worker == null) {
      reject('Worker with given PID: ${pid} not fould');
    }
    else {
      const onMessage = event => {
        event.target.removeEventListener("message", onMessage);
        resolve(JSON.parse(event.data));
      };

      // @FlowIssue: https://github.com/facebook/flow/issues/1413
      worker.addEventListener("message",  onMessage);
    }
  }));

const kill = pid =>
  Task.future(() => new Promise((resolve, reject) => {
    const worker = byPID(pid);
    if (worker) {
      worker.terminate();
      delete window.Worker[`_${pid}`];
      resolve(pid);
    }
    else {
      reject('Worker with given PID: ${pid} not fould');
    }
  }));

const send = (pid, data) =>
  Task.future(() => new Promise((resolve, reject) => {
    const worker = byPID(pid);
    if (worker) {
      worker.postMessage(JSON.stringify(data));
      resolve(pid);
    }
    else {
      reject('Worker with given PID: ${pid} not fould');
    }
  }));

const request = (pid, data) =>
  send(pid, data).chain(receive);
