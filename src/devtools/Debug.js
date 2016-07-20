/* @flow */

import {Task, Effects} from "reflex"
import type {Never} from "reflex"

export type Command <input, state> =
  | { type: "send", send: input }
  | { type: "reset", reset: state }


export const send = <input, state>
  (message:input):Task<Never, Command<input, state>> =>
  Task.succeed
  ( { type: "send"
    , send: message
    }
  )

export const reset = <input, state>
  (state:state):Task<Never, Command<input, state>> =>
  Task.succeed
  ( { type: "reset"
    , reset: state
    }
  )
