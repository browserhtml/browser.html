/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {Effects, html, forward, thunk} from "reflex";

import type {Address, DOM} from "reflex"



const style =
  { fontSize: '14px'
  }

const properties =
  { className: 'assistant title'
  , style
  }

export const render =
  (title:?string):DOM =>
  html.span
  ( properties
  , [ ( title == null
      ? 'Untitled'
      : `${title}`
      )
    ]
  )

export const view =
  (title:?string):DOM =>
  thunk
  ( ( title == null
    ? ""
    : title
    )
  , render
  , title
  )
