/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {always} from '../../../../common/prelude';
import {ok, error} from '../../../../common/result';
import {Effects, Task} from 'reflex';
import * as Unknown from '../../../../common/unknown'
import * as Ref from '../../../../common/ref';

/*::
import type {Never} from "reflex";
import type {Result} from '../../../../common/result';
import type {ID, URI, Time} from "../../../../common/prelude"

export type Action =
  | { type: "NoOp" }
  // Action is triggered whenever web-view start loading a new URI. Passed URI
  // directly corresponds `currentURI` in the model.
  | { type: "LocationChanged"
    , uri: URI
    , canGoBack: ?boolean
    , canGoForward: ?boolean
    }
  // Editing uri in the location bar causes `ChangeLocation` action. It's
  // `uri` field directly corresponds to `initiatedURI` field on the model,
  // althoug this action also updates `currentURI`.
  | { type: "Load"
    , uri: URI
    }
  | { type: "Stop" }
  | { type: "Reload" }
  | { type: "GoBack" }
  | { type: "GoForward" }
  // When model is updated with above action Effects with following Response
  // actions are triggered.
  | { type: "CanGoBackChanged"
    , canGoBackChanged: Result<Error, boolean>
    }
  | { type: "CanGoForwardChanged"
    , canGoForwardChanged: Result<Error, boolean>
    }
  | { type: "Stopped"
    , stopped: Result<Error, void>
    }
  | { type: "Reloaded"
    , reloaded: Result<Error, void>
    }
  | { type: "WentBack"
    , wentBack: Result<Error, void>
    }
  | { type: "WentForward"
    , wentForward: Result<Error, void>
    }
*/

export class Model {
  /*::
  ref: Ref.Model;
  canGoBack: boolean;
  canGoForward: boolean;
  // URI of the page displayed by a web-view (although web view maybe still
  // loading & technically it won't be displayed). This uri updates during any
  // redirects or when user navigates away by going back / forward or by
  // navigating to a new uri.
  currentURI: URI;
  // URI that was entered in a location bar by a user. Note this may not be an
  // uri of currently loaded page as uri could have being redirect or user could
  // have navigated away by clicking a link or pressing go back / go forward
  // buttons. This pretty much represents `src` attribute of the iframe.
  initiatedURI: URI;
  */
  constructor(
    ref/*: Ref.Model*/
  , canGoBack/*: boolean*/
  , canGoForward/*: boolean*/
  , currentURI/*: URI*/
  , initiatedURI/*: URI*/
  ) {
    this.ref = ref
    this.canGoBack = canGoBack
    this.canGoForward = canGoForward
    this.currentURI = currentURI
    this.initiatedURI = initiatedURI
  }
}


// User interaction interaction may also triggered following actions:
export const Stop/*:Action*/ = {type: "Stop"};
export const Reload/*:Action*/ = {type: "Reload"};
export const GoBack/*:Action*/ = {type: "GoBack"};
export const GoForward/*:Action*/ = {type: "GoForward"};

const NoOp = always({type: "NoOp"});
export const Load =
  (uri/*:URI*/)/*:Action*/ =>
  ({type: "Load", uri});

export const LocationChanged =
  (uri/*:URI*/, canGoBack/*:?boolean*/, canGoForward/*:?boolean*/)/*:Action*/ =>
  ({type: "LocationChanged", uri, canGoBack, canGoForward});

const CanGoBackChanged =
  result =>
  ( { type: "CanGoBackChanged"
    , canGoBackChanged: result
    }
  );

const CanGoForwardChanged =
  result =>
  ( { type: "CanGoForwardChanged"
    , canGoForwardChanged: result
    }
  );

const Stopped =
  result =>
  ( { type: "Stopped"
    , stopped: result
    }
  );

const Reloaded =
  result =>
  ( { type: "Reloaded"
    , reloaded: result
    }
  );

const WentBack = result =>
  ( { type: "WentBack"
    , wentBack: result
    }
  );

const WentForward = result =>
  ( { type: "WentForward"
    , wentForward: result
    }
  );

export const canGoBack =
  (ref/*:Ref.Model*/)/*:Task<Never, Result<Error, boolean>>*/ =>
  Ref
  .deref(ref)
  .chain(elementCanGoBack);

const elementCanGoBack =
  target =>
  new Task((succeed, fail) => {
    if (typeof(target.getCanGoBack) !== "function") {
      succeed(error(Error(`.getCanGoBack is not supported by runtime`)));
    }

    else {
      target.getCanGoBack().onsuccess = request => {
        succeed(ok(request.target.result));
      };
    }
  });

export const canGoForward =
  (ref/*:Ref.Model*/)/*:Task<Never, Result<Error, boolean>>*/ =>
  Ref
  .deref(ref)
  .chain(elementCanGoForward);

const elementCanGoForward =
  target =>
  new Task((succeed, fail) => {
    if (typeof(target.getCanGoForward) !== "function") {
      succeed(error(Error(`.getCanGoForward is not supported by runtime`)))
    }

    else {
      target.getCanGoForward().onsuccess = request => {
        succeed(ok(request.target.result));
      }
    }
  });


const invoke =
  name => {
    const elementInvoke =
      element =>
      new Task((succeed, fail) => {
        try {
          // @FlowIgnore: We know that method may not exist.
          element[name]();
        } catch (exception) {
          succeed(error(exception))
        }
      })

    const task =
      (ref/*:Ref.Model*/)/*:Task<Never, Result<Error, *>>*/ =>
      Ref
      .deref(ref)
      .chain(elementInvoke)

    return task
  }

export const stop = invoke('stop');
export const reload = invoke('reload');
export const goBack = invoke('goBack');
export const goForward = invoke('goForward');

const report =
  error =>
  new Task((succeed, fail) => {
    console.warn(error);
  });

export const init =
  ( ref/*:Ref.Model*/=Ref.create()
  , uri/*:URI*/='about:blank'
  , canGoBack/*: boolean*/ = false
  , canGoForward/*: boolean*/ = false
  )/*:[Model, Effects<Action>]*/ =>
  [ new Model
    ( ref
    , canGoBack
    , canGoForward
    , uri
    , uri
    )
  , Effects.none
  ]

const updateCanGoBack =
  ( model, canGoBack ) =>
  [ new Model
    ( model.ref
    , canGoBack
    , model.canGoForward
    , model.currentURI
    , model.initiatedURI
    )
  , Effects.none
  ]

const updateCanGoForward =
  ( model, canGoForward ) =>
  [ new Model
    ( model.ref
    , model.canGoBack
    , canGoForward
    , model.currentURI
    , model.initiatedURI
    )
  , Effects.none
  ]

const updateResponse =
  (model, result) =>
  ( result.isOk
  ? [model, Effects.none]
  : [model, Effects.perform(report(result.error)).map(NoOp)]
  );

const updateLocation =
  (model, uri, canGoBackValue, canGoForwardValue) =>
  // In the case where LocationChanged carries information about
  // canGoBack and canGoForward, we update the model with the new info.
  // This scenario will be hit in Servo.
  ( ( canGoBackValue != null && canGoForwardValue != null )
  ? [ new Model
      ( model.ref
      , canGoBackValue
      , canGoForwardValue
      , uri
      , model.initiatedURI
      )
    , Effects.none
    ]
  // Otherwise, update the currentURI and create a task to read
  // canGoBack, canGoForward from the iframe.
  // This scenario will be hit in Gecko.
  : [ new Model
      ( model.ref
      , model.canGoBack
      , model.canGoForward
      , uri
      , model.initiatedURI
      )
    , Effects.batch
      ( [ Effects
          .perform(canGoBack(model.ref))
          .map(CanGoBackChanged)
        , Effects
          .perform(canGoForward(model.ref))
          .map(CanGoForwardChanged)
        ]
      )
    ]
  );

export const load =
  ( model/*:Model*/
  , uri/*:URI*/='about:blank'
  )/*:[Model, Effects<Action>]*/ =>
  [ new Model
    ( model.ref
    , false
    , false
    , uri
    , uri
    )
  , Effects.none
  ]

export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ => {
    console.log(action)
    switch (action.type) {
      case "CanGoForwardChanged":
        return  (
          action.canGoForwardChanged.isOk
        ? updateCanGoForward(model, action.canGoForwardChanged.value)
        : [ model
          , Effects.perform(report(action.canGoForwardChanged.error))
          ]
        );
      case "CanGoBackChanged":
        return (
          action.canGoBackChanged.isOk
        ? updateCanGoBack(model, action.canGoBackChanged.value)
        : [ model
          , Effects.perform(report(action.canGoBackChanged.error))
          ]
        );
      case "LocationChanged":
        return updateLocation(model, action.uri, action.canGoBack, action.canGoForward)
      case "Load":
        return load(model, action.uri)
      case "Stop":
        return  [ model
                , Effects
                    .perform(stop(model.ref))
                    .map(Stopped)
                ];
      case "Reload":
        return  [ model
                , Effects
                    .perform(reload(model.ref))
                    .map(Reloaded)
                ];
      case "GoBack":
        return  [ model
                , Effects
                    .perform(goBack(model.ref))
                    .map(WentBack)
                ];
      case "GoForward":
        return  [ model
                , Effects
                    .perform(goForward(model.ref))
                    .map(WentForward)
                ];
      case "Stopped":
        return  updateResponse(model, action.stopped);
      case "Reloaded":
        return  updateResponse(model, action.reloaded);
      case "WentBack":
        return  updateResponse(model, action.wentBack);
      case "WentForward":
        return  updateResponse(model, action.wentForward);
      default:
        return Unknown.update(model, action);
    }
  };
