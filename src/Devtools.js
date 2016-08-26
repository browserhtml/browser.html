/* @flow */

import {Effects, Task, thunk, html, forward} from "reflex"
import {merge, nofx} from "./Common/Prelude"
import {cursor} from "./Common/Cursor"
import {ok, error} from "./Common/Result"
import * as Runtime from "./Common/Runtime"
import * as Unknown from "./Common/Unknown"
import * as Replay from "./Devtools/Replay"
import * as Record from "./Devtools/Record"
import * as Log from "./Devtools/Log"


import type {Address, Never, DOM, Init, Update, View, AdvancedConfiguration} from "reflex"
import type {Result} from "./Common/Result"

export type Model <model, action> =
  { record: ?Record.Model<model, action>
  , replay: ?Replay.Model<model, action>
  , log: ?Log.Model<model, action>

  , Debuggee: Debuggee<model, action>
  , debuggee: ?model
  }

export type Action <model, action> =
  | { type: "Debuggee", debuggee: action }
  | { type: "Record", record: Record.Action<model, action> }
  | { type: "Replay", replay: Replay.Action<model, action> }
  | { type: "Log", log: Log.Action<model, action> }
  | { type: "ReplayDebuggee", model: model }
  | { type: "Persist" }



export type Debuggee <model, action> =
  { init: Init<model, action, any>
  , update: Update<model, action>
  , view: View<model, action>
  }

export type Step <model, action> =
  [Model<model, action>, Effects<Action<model, action>>]

type Options <model, action, flags> =
  { Debuggee: Debuggee<model, action>
  , flags: flags
  }


const TagRecord = <model, action>
  (action:Record.Action<model, action>):Action<model, action> =>
  ( { type: "Record"
    , record: action
    }
  );

const TagLog = <model, action>
  (action:Log.Action<model, action>):Action<model, action> =>
  ( { type: "Log"
    , log: action
    }
  );

const TagReplay = <model, action>
  (action:Replay.Action<model, action>):Action<model, action> =>
  ( action.type === "Replay"
  ? { type: "ReplayDebuggee"
    , model: action.replay
    }
  : { type: "Replay"
    , replay: action
    }
  );

const TagDebuggee = <model, action>
  (action:action):Action<model, action> =>
  ( action == null
  ? { type: "Debuggee"
    , debuggee: action
    }
  : /*::typeof(action) === "object" && action != null && */
    action.type === "PrintSnapshot"
  ? TagRecord(action)
  : /*::typeof(action) === "object" && action != null && */
    action.type === "PublishSnapshot"
  ? TagRecord(action)
  : { type: "Debuggee"
    , debuggee: action
    }
  )

export const Persist = { type: "Persist" }

export const persist = <model, action, flags>
  ( model:Model<model, action>
  ):Step<model, action> =>
  [ model
  , Effects.none
  ];

export const restore = <model, action, flags>
  ({Debuggee, flags}:Options<model, action, flags>
  ):Step<model, action> =>
  [ merge(window.application.model.value, {Debuggee, flags})
  , Effects.none
  ];

export const init = <model, action, flags>
  ({Debuggee, flags}:Options<model, action, flags>):Step<model, action> => {
    const disable = [null, Effects.none]

    const [record, recordFX] =
      ( Runtime.env.record == null
      ? disable
      : Record.init(flags)
      );

    const [replay, replayFX] =
      ( Runtime.env.replay == null
      ? disable
      : Replay.init(flags)
      );

    const [log, logFX] =
      ( Runtime.env.log == null
      ? disable
      : Log.init(flags)
      );

    const [debuggee, debuggeeFX] = Debuggee.init(flags);

    const model =
      { record
      , replay
      , log
      , debuggee
      , Debuggee
      , flags
      }

    const fx = Effects.batch
      ( [ recordFX.map(TagRecord)
        , replayFX.map(TagReplay)
        , logFX.map(TagLog)
        , debuggeeFX.map(TagDebuggee)
        ]
      )

    return [model, fx]
  }

export const update = <model, action, flags>
  ( model:Model<model, action>
  , action:Action<model, action>
  ):Step<model, action> =>
  ( action.type === "Record"
  ? ( model.record == null
    ? nofx(model)
    : updateRecord(model, action.record)
    )
  : action.type === "Replay"
  ? ( model.replay == null
    ? nofx(model)
    : updateReply(model, action.replay)
    )
  : action.type === "Log"
  ? ( model.log == null
    ? nofx(model)
    : updateLog(model, action.log)
    )
  : action.type === "Debuggee"
  ? ( model.debuggee == null
    ? nofx(model)
    : updateDebuggee(model, action.debuggee)
    )
  : action.type === "ReplayDebuggee"
  ? replayDebuggee(model, action.model)

  : action.type === "Persist"
  ? persist(model)

  : Unknown.update(model, action)
  )

const updateRecord = <model, action>
  ( model:Model<model, action>
  , action:Record.Action<model, action>
  ):Step<model, action> => {
    const ignore = [null, Effects.none]
    const [record, fx] =
      ( model.record == null
      ? ignore
      : Record.update(model.record, action)
      )
    return [merge(model, {record}), fx.map(TagRecord)]
  }


const updateReply = <model, action>
  ( model:Model<model, action>
  , action:Replay.Action<model, action>
  ):Step<model, action> => {
    const ignore = [null, Effects.none]
    const [replay, fx] =
      ( model.replay == null
      ? ignore
      : Replay.update(model.replay, action)
      )
    return [merge(model, {replay}), fx.map(TagReplay)]
  }

const updateLog = <model, action>
  ( model:Model<model, action>
  , action:Log.Action<model, action>
  ):Step<model, action> => {
    const ignore = [null, Effects.none]
    const [log, fx] =
      ( model.log == null
      ? ignore
      : Log.update(model.log, action)
      )
    return [merge(model, {log}), fx.map(TagLog)]
  }


const updateDebuggee = <model, action>
  ( model:Model<model, action>
  , action:action
  ):Step<model, action> => {
    const {Debuggee} = model
    const ignore = [null, Effects.none]

    const [record, recordFX] =
      ( model.record == null
      ? ignore
      : Record.update(model.record, {type: "Debuggee", debuggee: action})
      );

    const [replay, replayFX] =
      ( model.replay == null
      ? ignore
      : Replay.update(model.replay, {type: "Debuggee", debuggee: action})
      );

    const [log, logFX] =
      ( model.log == null
      ? ignore
      : Log.update(model.log, {type: "Debuggee", debuggee: action})
      );



    const [debuggee, debuggeeFX] =
      ( model.debuggee == null
      ? ignore
      : Debuggee.update(model.debuggee, action)
      )

    const fx = Effects.batch
      ( [ recordFX.map(TagRecord)
        , replayFX.map(TagReplay)
        , logFX.map(TagLog)
        , debuggeeFX.map(TagDebuggee)
        ]
      )

    const next = merge
      ( model
      , { record
        , replay
        , log
        , debuggee
        }
      )

    return [next, fx]
  }

const replayDebuggee = <model, action>
  (model:Model<model, action>, debuggee:model):Step<model, action> =>
  nofx(merge(model, {debuggee}))

export const render = <model, action>
  ( model:Model<model, action>
  , address:Address<Action<model, action>>
  ):DOM =>
  html.main
  ( { className: "devtools"
    }
  , [ ( model.debuggee == null
      ? ""
      : model.Debuggee.view(model.debuggee, forward(address, TagDebuggee))
      )
    , ( model.record == null
      ? ""
      : Record.view(model.record, forward(address, TagRecord))
      )
    , ( model.replay == null
      ? ""
      : Replay.view(model.replay, forward(address, TagReplay))
      )
    , ( model.log == null
      ? ""
      : Log.view(model.log, forward(address, TagLog))
      )
    ]
  )

export const view = <model, action>
  ( model:Model<model, action>
  , address:Address<Action<model, action>>
  ):DOM =>
  thunk
  ( 'Devtools'
  , render
  , model
  , address
  )
