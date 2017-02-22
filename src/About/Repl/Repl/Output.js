/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, thunk, Effects} from 'reflex'
import {merge, tag} from '../../../Common/Prelude'
import {Style, StyleSheet} from '../../../Common/Style'
import * as Unknown from '../../../Common/Unknown'

import type {Address, DOM} from 'reflex'
import type {EvaluationResult} from './Host'

export type Model =
  { version: number,
   result: ?EvaluationResult
  }

export type Action =
  | { type: "Print",
     source: Model
    }

export const Print = tag('Print')

export const init =
  (version:number,
   result:?EvaluationResult=null
  ):[Model, Effects<Action>] =>
  [ { version,
     result
    },
   Effects.none
  ]

const print = (model, output) =>
  [ merge(model,
     { version: output.version,
       result: output.result
      }
    ),
   Effects.none
  ]

export const update =
  (model:Model, action:Action):[Model, Effects<Action>] =>
  (action.type === 'Print'
  ? print(model, action.source)
  : Unknown.update(model, action)
  )

const styleSheet = StyleSheet.create({ base:
      { fontSize: 'inherit',
       fontFamily: 'inherit',
       color: 'inherit',
       background: 'inherit',
       border: 'none',
       display: 'block',
       lineHeight: 'inherit',
       paddingTop: '8px',
       whiteSpace: 'pre-wrap'
      },
     ok:
     {
     },
     error:
     {
     },
     empty:
     {
     }
    }
  )

const display =
  value =>
  (value == null
  ? String(value)
  : typeof (value) === 'object'
  ? (value.$type === 'VirtualText'
    ? value
    : value.$type === 'VirtualNode'
    ? value
    : value.$type === 'Thunk'
    ? value
    : value.$type === 'LazyTree'
    ? value
    : value.toString()
    )
  : value.toString()
  )

const render =
  (model, address) =>
  html.output({ className: 'output',
     style: Style(styleSheet.base,
       (model.result == null
        ? styleSheet.empty
        : model.result.isOk
        ? styleSheet.ok
        : styleSheet.error
        )
      )
    },
   [ (model.result == null
      ? ''
      : model.result.isError
      ? display(model.result.error)
      : display(model.result.value)
      )
    ]
  )

export const view =
  (model:Model, address:Address<Action>):DOM =>
  thunk('output', render, model, address)
