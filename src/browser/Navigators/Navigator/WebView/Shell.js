/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, Task} from "reflex";
import {merge, always} from "../../../../common/prelude";
import {cursor} from "../../../../common/cursor";
import {ok, error} from "../../../../common/result";
import * as Focusable from "../../../../common/focusable";
import * as Ref from '../../../../common/ref';


import type {Result} from "../../../../common/result"
import type {Never} from "reflex"
import type {Float} from "../../../../common/prelude"

export type Action =
  | { type: "NoOp" }
  | { type: "Panic", panic: Error }
  | { type: "ZoomIn" }
  | { type: "ZoomOut" }
  | { type: "ResetZoom" }
  | { type: "MakeVisible" }
  | { type: "MakeNotVisible" }
  | { type: "ZoomChanged"
    , zoomChanged: Result<Error, number>
    }
  | { type: "VisibilityChanged"
    , visibilityChanged: Result<Error, boolean>
    }
  | { type: "Focus" }
  | { type: "Blur" }


export class Model {
  
  ref: Ref.Model;
  zoom: Float;
  isVisible: boolean;
  isFocused: boolean;
  
  constructor(
    ref:Ref.Model
  , zoom:Float
  , isVisible:boolean
  , isFocused:boolean
  ) {
    this.ref = ref
    this.zoom = zoom
    this.isVisible = isVisible
    this.isFocused = isFocused
  }
}

export const MakeVisible:Action =
  ({type: "MakeVisible"});

export const MakeNotVisible:Action =
  ({type: "MakeNotVisible"});

export const ZoomIn:Action =
  ({type: "ZoomIn"});

export const ZoomOut:Action =
  ({type: "ZoomOut"});

export const ResetZoom:Action =
  ({type: "ResetZoom"});

const FocusableAction =
  action =>
  ({type: "Focusable", action});

const Panic =
  error =>
  ( { type: "Panic"
    , panic: error
    }
  )

export const Focus:Action = Focusable.Focus;
export const Blur:Action = Focusable.Blur;

const NoOp = always({type: "NoOp"});

const VisibilityChanged =
  result =>
  ( { type: "VisibilityChanged"
    , visibilityChanged: result
    }
  );

const ZoomChanged =
  result =>
  ( { type: "ZoomChanged"
    , zoomChanged: result
    }
  );

const setZoom =
  (ref:Ref.Model, level:Float):Task<Error, Float> =>
  Ref
  .deref(ref)
  .chain(element => setElementZoom(element, level))

const setElementZoom =
  ( target, level ) =>
  new Task((succeed, fail) => {
    if (typeof(target.zoom) !== 'function') {
      fail(Error(`.zoom is not supported by runtime`))
    }
    else {
      target.zoom(level);
      succeed(level);
    }
  })

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

export const zoomIn =
  (ref:Ref.Model, zoom:number):Task<Error, number> =>
  setZoom(ref, Math.min(ZOOM_MAX, zoom + ZOOM_STEP));

export const zoomOut =
  (ref:Ref.Model, zoom:number):Task<Error, number> =>
  setZoom(ref, Math.max(ZOOM_MIN, zoom - ZOOM_STEP));

export const resetZoom =
  (ref:Ref.Model):Task<Error, number> =>
  setZoom(ref, 1);

export const setVisibility =
  (ref:Ref.Model, isVisible:boolean):Task<Error, boolean> =>
  Ref
  .deref(ref)
  .chain(target => setElementVisibility(target, isVisible));

const setElementVisibility =
  (element, isVisible) =>
  new Task((succeed, fail) => {
    if (typeof(element.setVisible) !== 'function') {
      fail(Error(`.setVisible is not supported by runtime`))
    }
    else {
      element.setVisible(isVisible);
      succeed(isVisible);
    }
  })

export const focus = <value>
  (ref:Ref.Model):Task<Error, value> =>
  Ref
  .deref(ref)
  .chain(focusElement);

const focusElement = <value>
  (element:HTMLElement):Task<Error, value> =>
  new Task((succeed, fail) => {
    try {
      if (element.ownerDocument.activeElement !== element) {
        element.focus()
      }
    }
    catch (error) {
      fail(error)
    }
  });

export const blur = <value>
  (ref:Ref.Model):Task<Error, value> =>
  Ref
  .deref(ref)
  .chain(blurElement);

const blurElement =<value>
  (element:HTMLElement):Task<Error, value> =>
  new Task((succeed, fail) => {
    try {
      if (element.ownerDocument.activeElement === element) {
        element.blur()
      }
    }
    catch (error) {
      fail(error)
    }
  });



// Reports error as a warning in a console.
const warn = <value>
  (error:Error):Task<Never, value> =>
  new Task((succeed, fail) => {
    console.warn(error);
  });


export const init =
  ( ref:Ref.Model
  , isFocused:boolean):[Model, Effects<Action>] =>
  [ new Model
    ( ref
    , 1
    , true
    , isFocused
    )
  , Effects.none
  ]

const updateVisibility =
  ( model, isVisible ) =>
  [ new Model
    ( model.ref
    , model.zoom
    , isVisible
    , model.isFocused
    )
  , Effects.none
  ]

const updateZoom =
  ( model, zoom ) =>
  [ new Model
    ( model.ref
    , zoom
    , model.isVisible
    , model.isFocused
    )
  , Effects.none
  ]

const updateFocus =
  ( model, isFocused ) =>
  ( model.isFocused === isFocused
  ? [ model, Effects.none ]
  : [ new Model
      ( model.ref
      , model.zoom
      , model.isVisible
      , isFocused
      )
    , Effects.perform
      ( isFocused
      ? focus(model.ref).recover(Panic)
      : blur(model.ref).recover(Panic)
      )
    ]
  )


export const update =
  (model:Model, action:Action):[Model, Effects<Action>] => {
    switch (action.type) {
      case "ZoomIn":
        return [
          model
          , Effects
            .perform
              ( zoomIn(model.ref, model.zoom)
                .map(ok)
                .capture(reason => Task.succeed(error(reason)))
              )
            .map(ZoomChanged)
          ];
      case "ZoomOut":
        return [
          model
          , Effects
              .perform
              ( zoomOut(model.ref, model.zoom)
                .map(ok)
                .capture(reason => Task.succeed(error(reason)))
              )
              .map(ZoomChanged)
          ];
      case "ResetZoom":
        return [
          model
          , Effects
              .perform
              ( resetZoom(model.ref)
                .map(ok)
                .capture(reason => Task.succeed(error(reason)))
              )
              .map(ZoomChanged)
          ];
      case "MakeVisible":
        return [
          model
          , Effects
              .perform
              ( setVisibility(model.ref, true)
                .map(ok)
                .capture(reason => Task.succeed(error(reason)))
              )
              .map(VisibilityChanged)
          ];
      case "MakeNotVisible":
        return [
          model
          , Effects
            .perform
            ( setVisibility(model.ref, false)
              .map(ok)
              .capture(reason => Task.succeed(error(reason)))
            )
            .map(VisibilityChanged)
          ];
      case "VisibilityChanged":
        return (
          action.visibilityChanged.isOk
        ? updateVisibility(model, action.visibilityChanged.value)
        : [ model
          , Effects
            .perform(warn(action.visibilityChanged.error))
          ]
        );
      case "ZoomChanged":
        return (
          action.zoomChanged.isOk
        ? updateZoom(model, action.zoomChanged.value)
        : [ model
          , Effects
            .perform(warn(action.zoomChanged.error))
          ]
        );

  // Delegate
      case "Focus":

        return updateFocus(model, true);
      case "Blur":
        return updateFocus(model, false);

      case "Panic":
        return [model, Effects.perform(warn(action.panic))];

      default:
        return [model, Effects.none];
    }
  };
