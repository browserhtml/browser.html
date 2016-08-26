/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {Effects, html, forward, thunk} from "reflex";
import * as URL from '../../../../../Common/URLHelper';
import type {Address, DOM} from "reflex"


const style =
  { fontSize: '14px'
  }

const properties =
  { className: 'assistant title'
  , style
  }

export const render =
  (url:string):DOM =>
  html.a
  ( { className: 'assistant location'
    , style
    , href: url
    , onClick: preventDefault
    }
  , [ ` - ${URL.prettify(url)}` ]
  )

const preventDefault =
  event =>
  event.preventDefault();

export const view =
  (url:string):DOM =>
  thunk
  ( url
  , render
  , url
  )
