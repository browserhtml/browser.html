/* @flow */

import {Task, Effects} from "reflex"

/*::
import type {Never} from "reflex"

export type Command <input, state> =
  | { type: "send", send: input }
  | { type: "reset", reset: state }

export type Action <input, state> =
  { type: "#debug", debug: Command<input, state> }
*/

export const send = /*::<input, state>*/
  (message/*:input*/)/*:Task<Never, Action<input, state>>*/ =>
  Task.succeed
  ( { type: "#debug"
    , debug:
      { type: "send"
      , send: message
      }
    }
  )

export const reset = /*::<input, state>*/
  (state/*:state*/)/*:Task<Never, Action<input, state>>*/ =>
  Task.succeed
  ( { type: "#debug"
    , debug:
      { type: "reset"
      , reset: state
      }
    }
  )
