/* @noflow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Task, Effects} from "reflex"
import {merge, always} from "../../../common/prelude";
import * as Ref from "../../../common/ref";
import * as Unknown from "../../../common/unknown";
import * as Console from "../../../common/console";

/*::
import type {Never} from "reflex"
import type {Result} from "../../../common/result"

// Model extends Focusable.Model with isVisible and zoom fields
export type Model =
  { ref: Ref.Model
  , value: boolean
  }


export type Action =
  | { type: "NoOp" }
  | { type: "MakeVisible" }
  | { type: "MakeNotVisible" }
  | { type: "VisibilityChanged", visible: boolean }
*/

const NoOp = always({ type: "NoOp" });

export const init =
  ( ref/*:Ref.Model*/
  , value/*:boolean*/=true
  )/*:[Model, Effects<Action>]*/ =>
  ( value
  ? nofx({ref, value})
  : changeVisibility({ref, value}, value)
  );

export const update =
  ( model/*:Model*/, action/*:Action*/ )/*:[Model, Effects<Action>]*/ =>
  ( action.type === "NoOp"
  ? nofx(model)
  : action.type === "MakeVisible"
  ? changeVisibility(model, true)
  : action.type === "MakeNotVisible"
  ? changeVisibility(model, false)
  : action.type === "VisibilityChanged"
  ? updateVisibility(model, action.visible)
  : Unknown.update(model, action)
  );

const changeVisibility =
  (model, value) =>
  [ model
  , Effects.perform
    ( setVisibility(model.ref, value)
      .capture(Console.warn)
    )
    .map(NoOp)
  ];

const updateVisibility =
  (model, value) =>
  nofx(merge(model, {value}));

const nofx =
  model =>
  [ model
  , Effects.none
  ];

export const setVisibility =
  ( ref/*:Ref.Model*/
  , value/*:boolean*/
  )/*:Task<Error, void>*/ =>
  Ref
  .deref(ref)
  .chain(element => setElementVisibility(element, value))


export const setElementVisibility =
  ( element/*:HTMLElement*/
  , value/*:boolean*/
  )/*:Task<Error, void>*/ =>
  new Task
  ( (succeed, fail) => {
      try {
        /*:: if (typeof(element.setVisible) === "function") */
        element.setVisible(value);
        succeed();
      }
      catch (error) {
        fail(error);
      }
    }
  );
