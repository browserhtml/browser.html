/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*::
import type {Model, Action, State} from './security'
*/

import {Effects} from 'reflex';
import * as Unknown from '../../common/unknown';
import {merge} from '../../common/prelude';

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
  [ { state: 'insecure'
    , secure: false
    , extendedValidation: false
    }
  , Effects.none
  ]

export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ => {
    switch (action.type) {
      case "LoadStart":
        return [
                merge (model
                      , { state: 'insecure'
                        , secure: false
                        , extendedValidation: false
                        }
                      )
                , Effects.none
               ];
      case "SecurityChanged":
        return [ merge(model
                      , { state: action.state
                        , secure: action.state === 'secure'
                        , extendedValidation: action.extendedValidation
                        }
                      )
                , Effects.none
               ];
      default:
        return Unknown.update(model, action);
    }
  };
