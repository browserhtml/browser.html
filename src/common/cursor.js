/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import type {Effects} from "reflex";

type AnotateUpdate <model, tagged, message, state:model> =
  (input:state, action:message) =>
  [state, Effects<tagged>]

export type Cursor <outer, inner, tagged, message> =
  { get: (model:outer) => inner
  , set: (model:outer, value:inner) => outer
  , tag: (action:message) => tagged
  , update: (model:inner, action:message) => [inner, Effects<message>]
  }


export const cursor = <outer, inner, tagged, message>
  ({get, set, update, tag}:Cursor<outer, inner, tagged, message>):AnotateUpdate<outer, tagged, message, *> =>
  (state:outer, action:message):[outer, Effects<tagged>] => {
    const inner = get(state, action);
    const [next, fx] = update(inner, action);

    return [set(state, next), fx.map(tag)]
  }
