/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {always} from '../../../../common/prelude';
import {ok, error} from '../../../../common/result';
import {Effects, Task} from 'reflex';
import * as Unknown from '../../../../common/unknown'
import * as Ref from '../../../../common/ref';


import type {Never} from "reflex";
import type {Result} from '../../../../common/result';
import type {ID, URI, Time} from "../../../../common/prelude"

export type Action =
  | { type: "NoOp" }
  | { type: "LocationChanged"
    , uri: URI
    , canGoBack: ?boolean
    , canGoForward: ?boolean
    }
  | { type: "Load"
    , uri: URI
    }
  | { type: "Stop" }
  | { type: "Reload" }
  | { type: "GoBack" }
  | { type: "GoForward" }
  // When the model is updated with the above action, effects with the following
  // response actions are triggered.
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


export class Model {

  ref: Ref.Model;
  canGoBack: boolean;
  canGoForward: boolean;
  url: URI;
  constructor(
    ref: Ref.Model
  , canGoBack: boolean
  , canGoForward: boolean
  , url: URI
  ) {
    this.ref = ref
    this.canGoBack = canGoBack
    this.canGoForward = canGoForward
    this.url = url
  }
}


// User interaction interaction may also triggered following actions:
export const Stop:Action = {type: "Stop"};
export const Reload:Action = {type: "Reload"};
export const GoBack:Action = {type: "GoBack"};
export const GoForward:Action = {type: "GoForward"};

const NoOp = always({type: "NoOp"});
export const Load =
  (uri:URI):Action =>
  ({type: "Load", uri});

export const LocationChanged =
  (uri:URI, canGoBack:?boolean, canGoForward:?boolean):Action =>
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
  (ref:Ref.Model):Task<Never, Result<Error, boolean>> =>
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
  (ref:Ref.Model):Task<Never, Result<Error, boolean>> =>
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
    const elementInvoke = <value>
      (element:HTMLElement):Task<Never, Result<Error, value>> =>
      new Task((succeed, fail) => {
        try {
          // @FlowIgnore: We know that method may not exist.
          element[name]();
        } catch (exception) {
          succeed(error(exception))
        }
      })

    const task = <value>
      (ref:Ref.Model):Task<Never, Result<Error, value>> =>
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
  ( ref:Ref.Model=Ref.create()
  , uri:URI='about:blank'
  , canGoBack: boolean = false
  , canGoForward: boolean = false
  ):[Model, Effects<Action>] =>
  [ new Model
    ( ref
    , canGoBack
    , canGoForward
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
    , model.url
    )
  , Effects.none
  ]

const updateCanGoForward =
  ( model, canGoForward ) =>
  [ new Model
    ( model.ref
    , model.canGoBack
    , canGoForward
    , model.url
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
  (model, url, canGoBackValue, canGoForwardValue) =>
  // In the case where LocationChanged carries information about
  // canGoBack and canGoForward, we update the model with the new info.
  // This scenario will be hit in Servo.
  ( ( canGoBackValue != null && canGoForwardValue != null )
  ? [ new Model
      ( model.ref
      , canGoBackValue
      , canGoForwardValue
      , url
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
      , url
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
  ( model:Model
  , url:URI='about:blank'
  ):[Model, Effects<Action>] =>
  [ ( model.url === url
    ? model
    : new Model
      ( model.ref
      , model.canGoBack
      , false
      , url
      )
    )
  , Effects.none
  ]

export const update =
  (model:Model, action:Action):[Model, Effects<Action>] => {
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
