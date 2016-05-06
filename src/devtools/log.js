/* @flow */

import {Effects, Task, html, forward} from "reflex"
import {merge, always} from "../common/prelude"
import * as Runtime from "../common/runtime"
import * as Console from "../common/Console"
import * as IO from "../common/IO"

/*::
import type {Address, Never, DOM,} from "reflex"
import type {URI, ID} from "../common/prelude"


export type Mode =
  | 'raw'
  | 'json'
  | 'none'

export type Action <input, state> =
  | { type: "NoOp" }
  | { type: "Debuggee", debuggee: input }
*/

export class Model /*::<input, state>*/ {
  /*::
  mode: Mode;
  io: IO.Model<Action<input, state>>;
  */
  constructor(
    mode/*:Mode*/
  , io/*:IO.Model<Action<input, state>>*/
  ) {
    this.mode = mode
    this.io = io
  }
}


const NoOp = always({ type: "NoOp" });

export const init = /*::<input, state, flags>*/
  ()/*:Model<input, state>*/ =>
  new Model
  ( ( Runtime.env.log === 'json'
    ? 'json'
    : Runtime.env.log != null
    ? 'raw'
    : 'none'
    )
  , IO.init()
  )

export const update = /*::<input, state>*/
  ( model/*:Model<input, state>*/
  , action/*:Action<input, state>*/
  )/*:Model<input, state>*/ => {
    switch (action.type) {
      case "NoOp":
        return model;
      case "Debuggee":
        return log(model, action.debuggee);
      default:
        return panic(model, action);
    }
  }


const log = /*::<input, state>*/
  ( model/*:Model<input, state>*/
  , action/*:input*/
  )/*:Model<input, state>*/ => {
    ( model.mode === 'raw'
    ? console.log('Action >>', action)
    : model.mode === 'json'
    ? console.log(`Action >> ${JSON.stringify(action)}`)
    : null
    );

    return model
  }

export const panic = /*::<message, input, state>*/
  ( model/*:Model<input, state>*/
  , message/*:message*/
  )/*:Model<input, state>*/ =>
  new Model
  ( model.mode
  , IO.perform
    ( model.io
    , Console.error(`Panic! Unsupported action was received`, message)
    )
  )

export const fx = /*::<input, state>*/
  (model/*:Model<input, state>*/)/*:Effects<Action<input, state>>*/ =>
  model.io

export const view = /*::<input, state>*/
  ( model/*:Model<input, state>*/
  , address/*:Address<Action<input, state>>*/
  )/*:DOM*/ =>
  ""
