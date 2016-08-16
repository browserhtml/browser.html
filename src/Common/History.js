/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Task, Effects} from "reflex"


import type {Integer} from "../Common/Prelude"


export const readTitle = <value, model:{title?:string}>
  (model:model, fallback:value): string | value =>
  model.title ? model.title : fallback;

export const query = <action>
  (input:string, limit:Integer):Effects<action> =>
  Effects.perform(new Task(deliver => {

  }))
