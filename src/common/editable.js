/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {merge} from "../common/prelude";
import * as Unknown from "../common/unknown";
import {Effects} from "reflex";


import type {Address, DOM} from "reflex";
import type {Model, Action, Selection} from "./editable"


// Actions

export const Clear:Action = {type: "Clear"};

export const Select =
  (range:Selection):Action =>
  ({type: "Select", range});

export const Change =
  (value:string, selection:Selection):Action =>
  ({type: "Change", value, selection});



const select = /*::<model:Model>*/
  (model:model, selection:Selection):model =>
  merge(model, {selection});

const change = /*::<model:Model>*/
  (model:model, value:string, selection:Selection):model =>
  merge(model, {selection, value});

const clear = /*::<model:Model>*/
  (model:model):model =>
  merge(model, {value: "", selection: null});

export const init =
  (value:string, selection:?Selection=null):[Model, Effects<Action>] =>
  [ { value
    , selection
    }
  , Effects.none
  ]

export const update = /*::<model:Model>*/
  (model:model, action:Action):[model, Effects<Action>] =>
  ( action.type === "Clear"
  ? [clear(model), Effects.none]
  : action.type === "Select"
  ? [select(model, action.range), Effects.none]
  : action.type === "Change"
  ? [change(model, action.value, action.selection), Effects.none]
  : Unknown.update(model, action)
  );
