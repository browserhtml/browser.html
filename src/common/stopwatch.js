/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, Task} from 'reflex';
import {merge, always} from "../common/prelude";
import * as Unknown from "../common/unknown";

/*::
import type {Action, Model, Time} from "./stopwatch"
*/

export const Start/*:Action*/ = {type: "Start"};
export const End/*:Action*/ = {type: "End"};
export const Tick =
  (time/*:Time*/)/*:Action*/ =>
  ( { type: "Tick"
    , time
    }
  );


export const init =
  ()/*:[Model, Effects<Action>]*/ =>
  [null, Effects.none];

export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ =>
  ( action.type === "End"
  ? [ null, Effects.none ]
  : action.type === "Start"
  ? [ null, Effects.perform(Task.requestAnimationFrame().map(Tick)) ]
  : action.type === "Tick"
  ? ( model == null
    ? [ {
          time: action.time,
          elapsed: 0
        }
      , Effects.perform(Task.requestAnimationFrame().map(Tick))
      ]
    : [ merge(model, {
          time: action.time,
          elapsed: model.elapsed + (action.time - model.time)
        })
      , Effects.perform(Task.requestAnimationFrame().map(Tick))
      ]
    )
  : Unknown.update(model, action)
  );
