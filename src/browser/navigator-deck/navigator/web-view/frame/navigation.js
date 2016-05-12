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
import type {URI} from "../../../common/prelude";

// Model extends Focusable.Model with isVisible and zoom fields
export type Model =
  { ref: Ref.Model
  , canGoBack: boolean
  , canGoForward: boolean
  }


export type Action =
  | { type: "NoOp" }
  | { type: "LocationChanged"
    , uri: URI
    , canGoBack: ?boolean
    , canGoForward: ?boolean
    }
  | { type: "Stop" }
  | { type: "Reload" }
  | { type: "GoBack" }
  | { type: "GoForward" }
  | { type: "CanGoBackChanged", canGoBack: boolean }
  | { type: "CanGoForwardChanged", canGoForward: boolean }
*/

const NoOp = always({type: "NoOp"});

export const init =
  ( ref/*:Ref.Model*/ )/*:[Model, Effects<Action>]*/ =>
  nofx
  ( { ref
    , canGoBack: false
    , canGoForward: false
    }
  );

export const update =
  ( model/*:Model*/
  , action/*:Action*/
  )/*:[Model, Effects<Action>]*/ =>
  ( action.type === "NoOp"
  ? nofx(model)
  : action.type === "Stop"
  ? perform(model, stop)
  : action.type === "Reload"
  ? perform(model, reload)
  : action.type === "GoBack"
  ? perform(model, goBack)
  : action.type === "GoForward"
  ? perform(model, goForward)
  : action.type === "CanGoBackChanged"
  ? updateNavigation(model, action.canGoBack, void(0))
  : action.type === "CanGoForwardChanged"
  ? updateNavigation(model, void(0), action.canGoForward)
  : action.type === "LocationChanged"
  ? updateNavigation(model, action.canGoBack, action.canGoForward)
  : Unknown.update(model, action)
  );

const updateNavigation =
  (model, canGoBack=model.canGoBack, canGoForward=model.canGoForward) =>
  nofx(merge(model, {canGoBack, canGoForward}))

const nofx =
  model =>
  [ model
  , Effects.none
  ];

const perform =
  ( model, task ) =>
  [ model
  , Effects.perform
    ( Ref
      .deref(model.ref)
      .chain(task)
      .capture(Console.warn)
    )
    .map(NoOp)
  ]

const stop =
  (element/*:HTMLElement*/)/*:Task<Error, void>*/ =>
  new Task((succeed, fail) => {
    try {
      /*:: if (typeof(element.stop) === "function") */
      element.stop();
      succeed();
    }
    catch (error) {
      fail(error)
    }
  });

const reload =
  (element/*:HTMLElement*/)/*:Task<Error, void>*/ =>
  new Task((succeed, fail) => {
    try {
      /*:: if (typeof(element.reload) === "function") */
      element.reload();
      succeed();
    }
    catch (error) {
      fail(error)
    }
  });

const goBack =
  (element/*:HTMLElement*/)/*:Task<Error, void>*/ =>
  new Task((succeed, fail) => {
    try {
      /*:: if (typeof(element.goBack) === "function") */
      element.goBack();
      succeed();
    }
    catch (error) {
      fail(error)
    }
  });

const goForward =
  (element/*:HTMLElement*/)/*:Task<Error, void>*/ =>
  new Task((succeed, fail) => {
    try {
      /*:: if (typeof(element.goForward) === "function") */
      element.goForward();
      succeed();
    }
    catch (error) {
      fail(error)
    }
  });
