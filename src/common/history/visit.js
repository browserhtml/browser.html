/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {merge} from "../common/prelude";

/*::
import * as Visit from "./visit"
*/

export const start =
  ( id/*:Visit.ID*/
  , time/*:Visit.Time*/
  , device/*:string*/
  )/*:Visit.Model*/ =>
  ( { type: "Visit"
    , id
    , start: time
    , end: null
    , device
    }
  );

export const end =
  ( model/*:Visit.Model*/
  , time/*:Visit.Time*/
  )/*:Visit.Model*/ =>
  merge
  ( model
  , { end: time
    }
  );
