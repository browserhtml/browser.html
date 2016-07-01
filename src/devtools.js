/* @flow */

import {Effects, Task, thunk, html, forward} from "reflex"
import {merge} from "./common/prelude"
import {cursor} from "./common/cursor"
import {ok, error} from "./common/result"
import * as Runtime from "./common/runtime"
import * as Unknown from "./common/unknown"
import * as Replay from "./devtools/replay"
import * as Record from "./devtools/Record"
import * as Log from "./devtools/log"
import * as Debug from "./devtools/Debug"
import * as Console from "./common/Console"
import * as IO from "./common/IO"


import type {Address, Never, DOM, Init, Update, View, AdvancedConfiguration} from "reflex"
import type {Result} from "./common/result"

export type Debuggee <input, state> =
  { init: Init<state, input, any>
  , update: Update<state, input>
  , view: View<state, input>
  }

export type Action <input, state> =
  | { type: "debuggee", debuggee: input }
  | { type: "record", record: any }
  | { type: "replay", replay: any }
  | { type: "log", log: any }
  | { type: "debug", debug: any }
  | { type: "Persist" }

type Flags <input, state, flags> =
  { Debuggee: Debuggee<input, state>
  , flags: flags
  }

export const Persist = { type: "Persist" }

export class Model <input, state> {
  record: ?Record.Model<input, state>;
  replay: ?Replay.Model<input, state>;
  log: ?Log.Model<input, state>;

  Debuggee: Debuggee<input, state>;
  debuggee: state;
  io: IO.Model<Action<input, state>>;
  fx: Effects<input>;

  constructor(
    Debuggee/*:Debuggee<input, state>*/
  , debuggee/*:state*/
  , io/*:IO.Model<Action<input, state>>*/
  , fx/*:Effects<input>*/
  , record/*:?Record.Model<input, state>*/
  , replay/*:?Replay.Model<input, state>*/
  , log/*:?Log.Model<input, state>*/
  ) {
    this.Debuggee = Debuggee
    this.debuggee = debuggee
    this.io = io
    this.fx = fx
    this.record = record
    this.replay = replay
    this.log = log
  }
}

const tagRecord = <input, state>
  ( action/*:Record.Action<input, state>*/ )/*:Action<input, state>*/ =>
  ( { type: "record"
    , record: action
    }
  );

const tagLog = <input, state>
  ( action/*:Log.Action<input, state>*/ )/*:Action<input, state>*/ =>
  ( { type: "log"
    , log: action
    }
  );

const tagReplay = <input, state>
  ( action/*:Replay.Action<input, state>*/)/*:Action<input, state>*/ =>
  ( action.type === "Debug"
  ? { type: "debug"
    , debug: action.debug
    }
  : { type: "replay"
    , replay: action
    }
  );

const tagDebuggee = <input, state>
  ( action/*:input*/ )/*:Action<input, state>*/ =>
  ( action == null
  ? { type: "debuggee"
    , debuggee: action
    }
  : /*::typeof(action) === "object" && action != null && */
    action.type === "PrintSnapshot"
  ? tagRecord(Record.Print)
  : /*::typeof(action) === "object" && action != null && */
    action.type === "CaptureSnapshot"
  ? tagRecord(Record.CaptureSnapshot)
  : /*::typeof(action) === "object" && action != null && */
    action.type === "PublishSnapshot"
  ? tagRecord(Record.Publish)
  : /*::typeof(action) === "object" && action != null && */
    action.type === "StartRecording"
  ? tagRecord(Record.StartRecording)
  : /*::typeof(action) === "object" && action != null && */
    action.type === "StopRecording"
  ? tagRecord(Record.StopRecording)
  : { type: "debuggee"
    , debuggee: action
    }
  )

export const initTools = <input, state, flags>
  ({Debuggee, flags}/*:Flags<input, state, flags>*/)/*:Model<input, state>*/ => {
    const record =
      ( Runtime.env.record == null
      ? null
      : Record.init()
      );

    const replay =
      ( Runtime.env.replay == null
      ? null
      : Replay.init(flags)
      );

    const log =
      ( Runtime.env.log == null
      ? null
      : Log.init(flags)
      );

    const [debuggee, fx] = Debuggee.init(flags)

    return new Model
    ( Debuggee
    , debuggee
    , IO.init()
    , fx
    , record
    , replay
    , log
    )
  }

export const updateTools = <input, state, flags>
  ( model/*:Model<input, state>*/
  , action/*:Action<input, state>*/
  )/*:Model<input, state>*/ => {
    switch (action.type) {
      case "record":
        return (
            model.record == null
          ? model
          : updateRecord(model, model.record, action.record)
          );
      case "replay":
          return (
            model.replay == null
          ? model
          : updateReply(model, model.replay, action.replay)
          );
      case "log":
        return (
            model.log == null
          ? model
          : updateLog(model, model.log, action.log)
          )
      case "debuggee":
        return (
            model.debuggee == null
          ? model
          : updateDebuggee(model, action.debuggee)
          )
      case "debug":
        return debug(model, action.debug)
      default:
        return panic(model, action)
    }
  }

const panic = <message, input, state>
  (model/*:Model<input, state>*/, message/*:message*/)/*:Model<input, state>*/ =>
  new Model
  ( model.Debuggee
  , model.debuggee
  , IO.perform
    ( model.io
    , Console.error(`Panic! Unsupported action was received`, message)
    )
  , Effects.none
  , model.record
  , model.replay
  , model.log
  )

const updateRecord = <input, state>
  ( model/*:Model<input, state>*/
  , record/*:Record.Model<input, state>*/
  , action/*:Record.Action<input, state>*/
  )/*:Model<input, state>*/ =>
  new Model
  ( model.Debuggee
  , model.debuggee
  , model.io
  , Effects.none
  , Record.update(record, action)
  , model.replay
  , model.log
  )

const updateReply = <input, state>
  ( model/*:Model<input, state>*/
  , replay/*:Replay.Model<input, state>*/
  , action/*:Replay.Action<input, state>*/
  )/*:Model<input, state>*/ =>
  new Model
  ( model.Debuggee
  , model.debuggee
  , model.io
  , Effects.none
  , model.record
  , Replay.update(replay, action)
  , model.log
  )

const updateLog = <input, state>
  ( model/*:Model<input, state>*/
  , log/*:Log.Model<input, state>*/
  , action/*:Log.Action<input, state>*/
  )/*:Model<input, state>*/ =>
  new Model
  ( model.Debuggee
  , model.debuggee
  , model.io
  , Effects.none
  , model.record
  , model.replay
  , Log.update(log, action)
  )


const updateDebuggee = <input, state>
  ( model/*:Model<input, state>*/
  , input/*:input*/
  )/*:Model<input, state>*/ => {
    const [debuggee, fx] = model.Debuggee.update(model.debuggee, input);
    const next = new Model
    ( model.Debuggee
    , debuggee
    , model.io
    , fx
    , ( model.record == null
      ? null
      : Record.update(model.record, {type: "Debuggee", debuggee: input})
      )
    , ( model.replay == null
      ? null
      : Replay.update(model.replay, {type: "Debuggee", debuggee: input})
      )
    , ( model.log == null
      ? null
      : Log.update(model.log, {type: "Debuggee", debuggee: input})
      )
    )

    return next
  }


const debug = <input, state>
  ( model/*:Model<input, state>*/
  , command/*:Debug.Command<input, state>*/
  )/*:Model<input, state>*/ => {
    switch(command.type) {
      case "send":
        const [debuggee, fx] = model.Debuggee.update
          ( model.debuggee
          , command.send
          )
        return setDebuggee(model, debuggee, fx)
      case "reset":
        return setDebuggee(model, command.reset, Effects.none)
      default:
        return panic(model, command);
    }
  }

const setDebuggee = <input, state>
  ( model/*:Model<input, state>*/
  , debuggee/*:state*/
  , fx/*:Effects<input>*/
  )/*:Model<input, state>*/ =>
  new Model
  ( model.Debuggee
  , debuggee
  , model.io
  , fx
  , model.record
  , model.replay
  , model.log
  )

const fx = <input, state>
  (model/*:Model<input, state>*/)/*:Effects<Action<input, state>>*/ =>
  Effects.batch
  ( [ model.io
    , model.fx.map(tagDebuggee)
    , ( model.record == null
      ? Effects.none
      : Record.fx(model.record).map(tagRecord)
      )
    , ( model.replay == null
      ? Effects.none
      : Replay.fx(model.replay).map(tagReplay)
      )
    , ( model.log == null
      ? Effects.none
      : Log.fx(model.log).map(tagLog)
      )
    ]
  )

export const transact = <input, state>
  ( model/*:Model<input, state>*/
  )/*:[Model<input, state>, Effects<Action<input, state>>]*/ =>
  [ model
  , fx(model)
  ]


export const persist = <input, state>
  ( model:Model<input, state>
  ):[Model<input, state>, Effects<Action<input, state>>] =>
  [ model
  , Effects.none
  ];

export const restore = <input, state, flags>
  ({Debuggee, flags}:Flags <input, state, flags>
  ):[Model<input, state>, Effects<Action<input, state>>] =>
  [ merge(window.application.model.value, {Debuggee, flags})
  , Effects.none
  ];


export const init = <input, state, flags>
  (flags/*:Flags<input, state, flags>*/)/*:[Model<input, state>, Effects<Action<input, state>>]*/ =>
  transact(initTools(flags));

export const update = <input, state>
  ( model/*:Model<input, state>*/
  , action/*:Action<input, state>*/
  )/*:[Model<input, state>, Effects<Action<input, state>>]*/ =>
  transact(updateTools(model, action));


export const render = <model, action>
  ( model/*:Model<model, action>*/
  , address/*:Address<Action<model, action>>*/
  )/*:DOM*/ =>
  html.main
  ( { className: "devtools"
    }
  , [ ( model.debuggee == null
      ? ""
      : model.Debuggee.view(model.debuggee, forward(address, tagDebuggee))
      )
    , ( model.record == null
      ? ""
      : Record.view(model.record, forward(address, tagRecord))
      )
    , ( model.replay == null
      ? ""
      : Replay.view(model.replay, forward(address, tagReplay))
      )
    , ( model.log == null
      ? ""
      : Log.view(model.log, forward(address, tagLog))
      )
    ]
  )

export const view = <model, action>
  ( model/*:Model<model, action>*/
  , address/*:Address<Action<model, action>>*/
  )/*:DOM*/ =>
  thunk
  ( 'Devtools'
  , render
  , model
  , address
  )
