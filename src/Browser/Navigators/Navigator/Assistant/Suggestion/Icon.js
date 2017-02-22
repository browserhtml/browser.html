/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, thunk} from 'reflex'
import type {DOM} from 'reflex'

const style =
  { fontFamily: 'FontAwesome',
     fontSize: '17px',
     left: '13px',
     position: 'absolute',
    // top:0 should not be required, but it's necessary for Servo.
    // See https://github.com/servo/servo/issues/9687
     top: '0'
    }

const properties =
  { className: 'assistant icon',
   style
  }

export const render =
  (content:string):DOM =>
  html.span(properties,
   [ content
    ]
  )

export const view =
  (content:string):DOM =>
  thunk(`${content}`,
   render,
   content
  )
