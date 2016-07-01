/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, Task} from "reflex";
import type {Never} from "reflex";

export const warn =
  (...params:Array<any>):Task<Never, any> =>
  new Task((succeed, fail) => {
    console.warn(...params);
  });

export const log =
  (...params:Array<any>):Task<Never, any> =>
  new Task((succeed, fail) => {
    console.log(...params);
  });

export const info =
  (...params:Array<any>):Task<Never, any> =>
  new Task((succeed, fail) => {
    console.info(...params);
  });

export const error =
  (...params:Array<any>):Task<Never, any> =>
  new Task((succeed, fail) => {
    console.error(...params);
  });
