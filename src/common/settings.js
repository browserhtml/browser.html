/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {error, ok} from '../common/result';
import * as Unknown from '../common/unknown';
import {merge, always} from '../common/prelude';
import {Effects, Task} from 'reflex';

/*::
import type {Model, Action, Name, Value, Settings} from "./settings"
import type {Address, Never} from "reflex"
import type {Result} from "./result"
*/


const NotSupported =
  ReferenceError('navigator.mozSettings API is not available');

export const Fetched =
  (result/*:Result<Error, Settings>*/)/*:Action*/ =>
  ( { type: "Fetched"
    , result
    }
  );

export const Updated =
  (result/*:Result<Error, Settings>*/)/*:Action*/ =>
  ( { type: "Updated"
    , result
    }
  );

export const Changed =
  (result/*:Result<Error, Settings>*/)/*:Action*/ =>
  ( { type: "Changed"
    , result
    }
  );

const merges =
  records =>
  ( records.length === 1
  ? records[0]
  : records.reduce
    ( (result, record) => {
        for (let name in record) {
          if (record.hasOwnProperty(name)) {
            result[name] = record[name]
          }
        }
        return result
      }
    )
  );

export const fetch =
  (names/*:Array<Name>*/)/*:Task<Never, Result<Error, Settings>>*/ =>
  Task.create(resolve => {
    if (navigator.mozSettings != null) {
      const lock = navigator.mozSettings.createLock();
      const settings = names.map(name => lock.get(name));
      Promise.all(settings)
        .then(merges)
        .then(ok, error)
        .then(resolve);
    } else {
      resolve(error(NotSupported));
    }
  });


export const change =
  (settings/*:Settings*/)/*:Task<Never, Result<Error, Settings>>*/ =>
  Task.create(resolve => {
    if (navigator.mozSettings != null) {
      const lock = navigator.mozSettings.createLock();
      lock
        .set(settings)
        .then(always(ok(settings)), error)
        .then(resolve);
    } else {
      resolve(error(NotSupported));
    }
  });

export const observe =
  (namePattern/*:string*/)/*:Task<Never, Result<Error, Settings>>*/=>
  new Task((succeed, fail) => {
    const onChange = change => {
      if (navigator.mozSettings) {
        if (namePattern === "*") {
          navigator.mozSettings.removeEventListener("settingchange", onChange);
        }
        else {
          navigator.mozSettings.removeObserver(namePattern, onChange);
        }
      }

      succeed(ok({[change.settingName]: change.settingValue}));
    }

    if (navigator.mozSettings) {
      if (namePattern === "*") {
        navigator.mozSettings.addEventListener("settingchange", onChange);
      }
      else {
        navigator.mozSettings.addObserver(namePattern, onChange);
      }
    } else {
      fail(error(NotSupported));
    }
  });


export const init =
  (names/*:Array<Name>*/)/*:[Model, Effects<Action>]*/ =>
  [ null
  , Effects
    .task(fetch(names))
    .map(Fetched)
  ];

const updateSettings = (model, settings) =>
  // @TODO: Ignore unknown settings
  [ ( model == null
    ? settings
    : merge(model, settings)
    )
  , Effects.batch
    ( Object
      .keys(settings)
      .map(name => Effects.task(observe(name)).map(Updated))
    )
  ];

const report = (model, error) => {
  console.error(`Unhandled error occured `, error);
  return [model, Effects.none]
}


export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ =>
  ( action.type === 'Fetched'
  ? ( action.result.isOk
    ? updateSettings(model, action.result.value)
    : report(model, action.result.error)
    )
  : action.type === 'Updated'
  ? ( action.result.isOk
    ? updateSettings(model, action.result.value)
    : report(model, action.result.error)
    )
  : action.type === 'Changed'
  ? ( action.result.isOk
    ? updateSettings(model, action.result.value)
    : report(model, action.result.error)
    )
  : Unknown.update(model, action)
  );
