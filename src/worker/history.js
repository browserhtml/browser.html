/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as History from "../common/history"
import {start, Effects, Task} from "reflex";
import {tag} from "../common/prelude";
import {result} from "../common/history/util";

const Posted = tag("Posted");

const debug =
  update =>
  (model, action) => {
    console.log('WORKER:Action >>', action)
    const [next, fx] = update(model, action)
    console.log('WORKER:Model <<', next)
    console.log('WORKER:Effets <<', fx)
    return [next, fx];
  }


const worker = start
  ( { initial: History.init('History')
    , step: debug((model, action) =>
        ( action.type === "UpdateMatches"
          ? [ model
            , Effects.task(result(post(action)))
              .map(Posted)
            ]
          : action.type === "Posted"
          ? [ model
            , Effects.none
            ]
          : History.update(model, action)
          )
      )
    , view: () => null
    }
  )

const post =
  action =>
  Task.future(() => new Promise(resolve => {
    self.postMessage(JSON.stringify(action));
    resolve();
  }));

self.onmessage =
  event =>
  worker.address(JSON.parse(event.data));

worker.task.subscribe(Effects.service(worker.address));
