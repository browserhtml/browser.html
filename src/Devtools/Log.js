/* @flow */

import {Effects, Task, html, forward} from "reflex"
import {merge, always, nofx} from "../Common/Prelude"
import {ok, error} from "../Common/Result"
import * as Runtime from "../Common/Runtime"
import * as Unknown from "../Common/Unknown"


import type {Address, Never, DOM, Init, Update, View, AdvancedConfiguration} from "reflex"
import type {Result} from "../Common/Result"
import type {URI, ID} from "../Common/Prelude"


export type Model <model, action> =
  { mode: 'raw' | 'json' | 'none'
  }

export type Action <model, action> =
  | { type: "NoOp" }
  | { type: "Debuggee", debuggee: action }

type Step <model, action> =
  [ Model<model, action>
  , Effects<Action<model, action>>
  ]




const NoOp = always({ type: "NoOp" });

export const init = <model, action, flags>
  ():Step<model, action> =>
  ( [ { mode:
        ( Runtime.env.log === 'json'
        ? 'json'
        : Runtime.env.log != null
        ? 'raw'
        : 'none'
        )
      }
    , Effects.none
    ]
  )

export const update = <model, action>
  ( model:Model<model, action>
  , action:Action<model, action>
  ):Step<model, action> =>
  ( action.type === "NoOp"
  ? nofx(model)
  : action.type === 'Debuggee'
  ? log(model, action.debuggee)
  : Unknown.update(model, action)
  )

const log = <model, action>
  ( model:Model<model, action>
  , action:action
  ):Step<model, action> => {
    ( model.mode === 'raw'
    ? console.log('Action >>', action)
    : model.mode === 'json'
    ? console.log(`Action >> ${JSON.stringify(action)}`)
    : null
    );

    return nofx(model)
  }

export const view = <model, action>
  ( model:Model<model, action>
  , address:Address<Action<model, action>>
  ):DOM =>
  html.noscript()
