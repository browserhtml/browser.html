/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects} from 'reflex';
import * as Unknown from '../../../../common/unknown';



export type State =
  | "broken"
  | "secure"
  | "insecure"

export type Action =
  | { type: "LoadStart" }
  | { type: "SecurityChanged"
    , state: State
    , extendedValidation: boolean
    }


export class Model {
  
  state: State;
  secure: boolean;
  extendedValidation: boolean;
  
  constructor(
    state/*:State*/
  , secure/*:boolean*/
  , extendedValidation/*:boolean*/
  ) {
    this.state = state
    this.secure = secure
    this.extendedValidation = extendedValidation
  }
}

const insecure = new Model
  ( 'insecure'
  , false
  , false
  )

export const LoadStart/*:Action*/ =
  { type: "LoadStart"
  };

export const Changed =
  (state/*:State*/, extendedValidation/*:boolean*/)/*:Action*/ =>
  ( { type: "SecurityChanged"
    , state
    , extendedValidation
    }
  );

export const init =
  ()/*:[Model, Effects<Action>]*/ =>
  [ insecure
  , Effects.none
  ]

const loadStart =
  model =>
  init()

const updateSecurity =
  (model, state, extendedValidation) =>
  [ new Model
    ( state
    , state === 'secure'
    , extendedValidation
    )
  , Effects.none
  ]

export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ => {
    switch (action.type) {
      case "LoadStart":
        return loadStart(model);
      case "SecurityChanged":
        return updateSecurity(model, action.state, action.extendedValidation)
      default:
        return Unknown.update(model, action);
    }
  };
