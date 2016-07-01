/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, thunk, forward, Effects, Task} from 'reflex';
import {merge, batch, tag, tagged} from "../../../../common/prelude";
import {ok, error} from "../../../../common/result";


import type {ID, EvaluationResult} from "../host"
import type {Never} from "reflex"


const DELETE = new String('delete');
const executeWith = (context, execute) => {
  const keys = Object.keys(context);
  const stash =
    keys
    .reduce
    ( (stash, key) => {
        stash[key] =
          ( window.hasOwnProperty(key)
          ? window[key]
          : DELETE
          );

        window[key] = context[key];

        return stash;
      }
    , {}
    );

  try {
    return execute();
  }
  finally {
    keys
    .forEach
    ( key => {
        if (window[key] === context[key]) {
          if (stash[key] === DELETE) {
            delete window[key]
          }
          else {
            window[key] = stash[key]
          }
        }
      }
    )
  }
}

const evalContext =
  { out: {}
  , html
  , thunk
  , forward
  , Effects
  , Task
  , merge
  , batch
  , tag
  , tagged
  , ok
  , error
  }

export const evaluate =
  (id:ID, code:string):Task<Never, EvaluationResult> =>
  new Task((succeed, fail) => void(new Promise((resolve, reject) => {
    try {
      const out = executeWith(evalContext, () => window.eval(code));
      evalContext.out[id] = out;
      resolve(ok(out));
    }
    catch (exception) {
      evalContext.out[id] = exception;
      resolve(error(exception));
    }
  }).then(succeed, fail)))
