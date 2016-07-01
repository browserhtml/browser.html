/* @flow */

import {Effects, Task, html, thunk, forward} from "reflex"
import {merge} from "../common/prelude"
import * as Runtime from "../common/runtime"
import * as Unknown from "../common/unknown"
import * as Style from "../common/style"
import * as Clip from "./Record/Clip"
import * as Debug from "./Debug"
import * as IO from "../common/IO"
import * as Console from "../common/Console"
import type {Address, DOM} from "reflex"


export type Action <input, state> =
  | { type: "Debuggee", debuggee: input }
  | { type: "Fetch" }
  | { type: "Failure", failure: Error }
  | { type: "Fetched", fetched: Clip.EncodedClip<input, state> }
  | { type: "Debug", debug: Debug.Command<input, state> }


export class Model <input, state> {
  clipURI: string;
  error: ?Error;
  clip: ?Clip.Model<input, state>;
  io: IO.Model<Action<input, state>>;

  constructor(
    clipURI:string
  , error:?Error
  , clip:?Clip.Model<input, state>
  , io:IO.Model<Action<input, state>>
  ) {
    this.clipURI = clipURI
    this.error = error
    this.clip = clip
    this.io = io
  }
}

const tagDebug = <input, state>
  (command:Debug.Command<input, state>):Action<input, state> =>
  ( { type: "Debug"
    , debug: command
    }
  )

const Fetch = { type: "Fetch" }
const Fetched = <input, state>
  ( clip:Clip.EncodedClip<input, state> ):Action<input, state> =>
  ( { type: "Fetched"
    , fetched: clip
    }
  )

const Failure = <input, state>
  ( error:Error):Action<input, state> =>
  ( { type: "Failure"
    , failure: error
    }
  )

export const init = <input, state, flags>
  (flags:flags):Model<input, state> =>
  new Model
  ( String(Runtime.env.replay)
  , null
  , null
  , IO.perform
    ( IO.init()
    , Task.succeed(Fetch)
    )
  )

export const update = <input, state>
  ( model:Model<input, state>
  , action:Action<input, state>
  ):Model<input, state> => {
    switch (action.type) {
      case "Fetch":
        return fetch(model);
      case "Fetched":
        return fetched(model, action.fetched);
      case "Failure":
        return failure(model, action.failure);
      case "Debuggee":
        return model;
      default:
        return panic(model, action);
      }
  }


const fetched = <input, state>
  ( model:Model<input, state>
  , clip:Clip.EncodedClip<input, state>
  ):Model<input, state> =>
  load
  ( model
  , Clip.decode(clip)
  )

const load = <input, state>
  ( model:Model<input, state>
  , clip:Clip.Model<input, state>
  ):Model<input, state> =>
  new Model
  ( model.clipURI
  , null
  , clip
  , IO.perform
    ( model.io
    , Debug
      .reset((clip.state:state))
      .map(tagDebug)
    )
  )

const failure = <input, state>
  ( model:Model<input, state>
  , error:Error
  ):Model<input, state> =>
  new Model
  ( model.clipURI
  , error
  , model.clip
  , model.io
  )

const panic = <message, input, state>
  (model:Model<input, state>, message:message):Model<input, state> =>
  new Model
  ( model.clipURI
  , model.error
  , model.clip
  , IO.perform
    ( model.io
    , Console.error(`Panic! Unsupported action was received`, message)
    )
  )

const fetch = <input, state>
  ( model:Model<input, state> ):Model<input, state> =>
  new Model
  ( model.clipURI
  , model.error
  , model.clip
  , IO.perform
    ( model.io
    , fetchJSON(model.clipURI)
      .map(Fetched)
      .capture(error => Task.succeed(Failure(error)))
    )
  );

const fetchJSON = <input, state>
  (uri:string):Task<Error, Clip.EncodedClip<input, state>> =>
  new Task((succeed, fail) => {
    const request = new XMLHttpRequest({mozSystem: true});
    request.open
    ( 'GET'
    , uri
    , true
    );


    request.overrideMimeType('application/json');
    request.responseType = 'json';
    request.send();


    request.onerror =
      event =>
      fail(Error(`Failed to fetch ${uri} : ${request.statusText}`))

    request.onload =
      () =>
      ( request.status === 200
      ? succeed(request.response)
      : request.status === 0
      ? succeed(request.response)
      : fail(Error(`Failed to fetch ${uri} : ${request.statusText}`))
      )

  });

export const fx = <input, state>
  (model:Model<input, state>):Effects<Action<input, state>> =>
  model.io

export const transact = <input, state>
  ( model:Model<input, state>
  ):[Model<input, state>, Effects<Action<input, state>>] =>
  [ model, fx(model) ]


export const render = <model, action>
  ( model:Model<model, action>
  , address:Address<Action<model, action>>
  ):DOM =>
  html.dialog
  ( { id: "replay"
    , style: Style.mix
      ( styleSheet.base
      , ( model.clip == null
        ? styleSheet.loading
        : styleSheet.loaded
        )
      )
    , open: true
    }
  , [ html.h1
      ( null
      , [ ( model.error != null
          ? String(model.error)
          : model.clip == null
          ? `Loading snapshot from ${model.clipURI}`
          : ""
          )
        ]
      )
    ]
  );

export const view = <model, action>
  ( model:Model<model, action>
  , address:Address<Action<model, action>>
  ):DOM =>
  thunk
  ( 'replay'
  , render
  , model
  , address
  );


const styleSheet = Style.createSheet
  ( { base:
      { position: "absolute"
      , pointerEvents: "none"
      , background: "fff"
      , height: "100%"
      , width: "100%"
      , textAlign: "center"
      , lineHeight: "100vh"
      , textOverflow: "ellipsis"
      , whiteSpace: "nowrap"
      }
    , loaded:
      { opacity: 0
      }
    , loading:
      { opaticy: 1
      }
    }
  );
