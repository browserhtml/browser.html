/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, Task} from "reflex";

import type {Action} from "./unknown";
import type {Never} from "reflex";


export function warn(...params:Array<any>):Task<Never, Action> {
  return new Task((succeed, fail) => {
    console.warn(...params);
  });
}

export function log(...params:Array<any>):Task<Never, Action> {
  return new Task((succeed, fail) => {
    console.log(...params);
  });
}

export function error(...params:Array<any>):Task<Never, Action> {
  return new Task((succeed, fail) => {
    console.error(...params);
  });
}


export function update<model, action>(model:model, action:action):[model, Effects<action>] {
  console.warn('Unknown action was passed & ignored: ', action, Error().stack);
  return [model, Effects.none];
};
