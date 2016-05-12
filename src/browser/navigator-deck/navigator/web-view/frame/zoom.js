/* @noflow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Task, Effects} from "reflex";
import {merge, always} from "../../../common/prelude";
import * as Ref from "../../../common/ref";
import * as Console from "../../../common/console";
import * as Unknown from "../../../common/unknown";

/*::
import type {Never} from "reflex"
import type {Float} from "../../../common/prelude"


export type Model =
  { ref: Ref.Model
  , level: Float
  }


export type Action =
  | { type: "NoOp" }
  | { type: "ZoomIn" }
  | { type: "ZoomOut" }
  | { type: "ResetZoom" }
  | { type: "ZoomChanged", level: Float }

declare function asMaybe <x, a>
  (task:Task<x, a>):Task<x, ?a>
*/

const ZOOM_DEFAULT = 1;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

const ZoomChanged =
  (level/*:?Float*/)/*:Action*/ =>
  ( level == null
  ? { type: "NoOp" }
  : { type: "ZoomChanged", level }
  )

export const init =
  ( ref/*:Ref.Model*/
  , level/*:Float*/=ZOOM_DEFAULT
  )/*:[Model, Effects<Action>]*/ =>
  ( level === ZOOM_DEFAULT
  ? nofx({ref, level})
  : changeZoom({ref, level}, level)
  );

export const update =
  ( model/*:Model*/
  , action/*:Action*/
  )/*:[Model, Effects<Action>]*/ =>
  ( action.type === "NoOp"
  ? nofx(model)
  : action.type === "ZoomIn"
  ? zoomIn(model)
  : action.type === "ZoomOut"
  ? zoomOut(model)
  : action.type === "ResetZoom"
  ? resetZoom(model)
  : action.type === "ZoomChanged"
  ? updateZoom(model, action.level)
  : Unknown.update(model, action)
  );

const nofx =
  model =>
  [ model
  , Effects.none
  ];

const zoomIn =
  model =>
  changeZoom(model, Math.min(ZOOM_MAX, model.level + ZOOM_STEP));

const zoomOut =
  model =>
  changeZoom(model, Math.min(ZOOM_MAX, model.level - ZOOM_STEP));

const resetZoom =
  model =>
  changeZoom(model, Math.min(ZOOM_MAX, ZOOM_DEFAULT));

const updateZoom =
  ( model, level ) =>
  nofx(merge(model, {level}));

const changeZoom =
  (model, level) =>
  ( model.level === level
  ? nofx(model)
  : [ model
    , Effects
      .task
      ( ( setZoom(model.ref, level)
          // @FlowIssue: Should be able to cast to maybe type.
          /*:Task<Error, ?Float>*/
        )
        .capture(Console.warn)
        .map(ZoomChanged)
      )
    ]
  );

const setZoom =
  ( ref/*:Ref.Model*/
  , level/*:Float*/
  )/*:Task<Error, Float>*/ =>
  Ref
  .deref(ref)
  .chain(setElementZoom)

const setElementZoom =
  ( element/*:HTMLElement*/
  , level/*:Float*/
  )/*:Task<Error, Float>*/ =>
  new Task
  ( (succeed, fail) => {
      try {
        /*:: if (typeof(element.zoom) === "function") */
        element.zoom(level)
        succeed(level)
      }
      catch (error) {
        fail(error)
      }
    }
  )
