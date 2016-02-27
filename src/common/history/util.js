/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Task, Effects} from 'reflex';
import {always} from '../../common/prelude';
import * as Result from '../../common/result';
import {push} from '../../common/array';

 /*::
 import type {Never} from "reflex/type/effects";

 type ID = string;
 */

// Utility function that takes a promise and returns a task that fails if
// proimse is rejeceted with a rejection reason, or succeeds with a promise
// resolution value.
export const promise = /*::<x, a>*/
  (promise/*:Promise<a>*/)/*:Task<x, a>*/ =>
  Task.future(always(promise));

// Creates a task that combines results of two tasks via provided `combine`
// function. If either of tasks fails returned task fails with it. If neither
// of them fails then task succeeds with value returned by `combine`.
export const map2 = /*::<x, a, b, c>*/
  ( combine /*: (a:a, b:b) => c */
  , left /*:Task<x, a>*/
  , right/*:Task<x, b>*/
  )/*:Task<x, c>*/ =>
  left.chain
  ( a =>
    right.chain
    ( b =>
      combine(a, b)
    )
  )

// Turns possibly failing task into a never failing task to a task that either
// succeeds Result.error or with Result.ok depending if original task fails or
// succeeds.
export const result = /*::<x, a>*/
  (task/*:Task<x, a>*/)/*:Task<Never, Result<x, a>>*/ =>
  task
  .map(Result.ok)
  .catch(failure => Task.succeed(Result.error(failure)));



// Task array of tasks and return a task that runs them sequentially and result
// in array of results for those tasks. Returned task fails if any of the task
// fails with that failure.
export const sequence = /*::<x, a>*/
  (tasks/*:Array<Task<x, a>>*/)/*:Task<x, Array<a>>*/ =>
  tasks.reduce
  ( (result, task) => map2(push, task, result)
  , Task.succeed([])
  );
