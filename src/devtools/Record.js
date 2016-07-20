/* @flow */

import {Effects, Task, html, thunk, forward} from "reflex"
import {merge, always} from "../common/prelude"
import {ok, error} from "../common/result"
import {Lens, lens} from "../common/lens"
import * as IO from "../common/IO"
import * as Console from "../common/Console"
import * as Runtime from "../common/runtime"
import * as Unknown from "../common/unknown"
import * as Style from "../common/style"
import * as Clip from "./Record/Clip"
import * as Menu from "./Record/Menu"
import * as Player from "./Replay/Player"
import {performance} from "../common/performance"
import type {Address, Never, DOM, Init, Update, View, AdvancedConfiguration} from "reflex"
import type {Result} from "../common/result"
import type {URI, ID} from "../common/prelude"

export type Time = number

export type Gist =
  { id: ID
  , url: URI
  , description: String
  , public: boolean
  , files:
    { "snapshot.json":
      { size: number
      , raw_url: URI
      , type: "application/json"
      , language: "JSON"
      , truncated: boolean
      , "content": JSON
      }
    }
  , html_url: URI
  , created_at: String
  , updated_at: String
  }

export type Event <action> =
  { time: Time
  , action: action
  }

export type Action <input, state> =
  | { type: "NoOp" }
  | { type: "Debuggee", debuggee: input }
  | { type: "StartRecording" }
  | { type: "StopRecording" }
  | { type: "AnimationFrame", time: Time }
  | { type: "ToggleRecording" }
  | { type: "CaptureSnapshot" }
  | { type: "Print" }
  | { type: "Printed" }
  | { type: "Publish" }
  | { type: "UploadedClip", uploadedClip: Gist }
  | { type: "UploadFailed", uploadFailed: Error }
  | { type: "menu", menu: Menu.Action }
  | { type: "player", player: Player.Action<input, state>}


const NoOp = always({type: "NoOp"})
export const CaptureSnapshot = { type: "CaptureSnapshot" }
const ToggleRecording = { type: "ToggleRecording" }
export const StartRecording = { type: "StartRecording" }
export const StopRecording = { type: "StopRecording" }
export const Print = { type: "Print" }
const Printed = { type: "Printed" }
export const Publish = { type: "Publish" }

const UploadFailed = <input, state>
  ( error:Error ):Action<input, state> =>
  ( { type: "UploadFailed"
    , uploadFailed: error
    }
  );

const UploadedClip = <input, state>
  ( gist:Gist ):Action<input, state> =>
  ( { type: "UploadedClip"
    , uploadedClip: gist
    }
  );

const AnimationFrame = <input, state>
  ( time:Time ):Action<input, state> =>
  ( { type: "AnimationFrame"
    , time
    }
  );


export class Model <input, state> {
  isUploading: boolean;
  isRecording: boolean;
  clip: ?Clip.Model<input, state>;
  player: ?Player.Model<input, state>;
  menu: Menu.Model;
  io: IO.Model;
  isMutable: boolean;

  constructor(
    isUploading:boolean
  , isRecording:boolean
  , clip:?Clip.Model<input, state>
  , player:?Player.Model<input, state>
  , menu:Menu.Model
  , io:IO.Model
  , isMutable:boolean
  ) {
    this.isUploading = isUploading
    this.isRecording = isRecording
    this.clip = clip
    this.player = player
    this.menu = menu
    this.io = io
    this.isMutable = isMutable
  }
  modify(
    isUploading:boolean
  , isRecording:boolean
  , clip:?Clip.Model<input, state>
  , player:?Player.Model<input, state>
  , menu:Menu.Model
  , io:IO.Model
  ):Model<input, state> {
    if (this.isMutable) {
      this.isUploading = isUploading
      this.isRecording = isRecording
      this.clip = clip
      this.player = player
      this.menu = menu
      this.io = io
      return this
    }
    else {
      const model = new Model
      ( isUploading
      , isRecording
      , clip
      , player
      , menu
      , io
      , false
      )

      return model
    }
  }
  asMutable():Model<input, state> {
    const model =
      ( this.isMutable
      ? this
      : new Model
        ( this.isUploading
        , this.isRecording
        , this.clip
        , this.player
        , this.menu
        , this.io
        , true
        )
      )

    return model
  }

  asImmutable():Model<input, state> {
    this.isMutable = false
    return this
  }

  swap <inner, context>(
    lens:Lens<*, inner>
  , f:(value:inner, context:context) => inner
  , context:context
  ):Model<input, state> {
    return lens.set(this, f(lens.get(this), context))
  }

  set <inner>(
    lens:Lens<*, *>
  , value:inner
  ):Model<input, state> {
    return lens.set(this, value)
  }
}


export const init = <input, state>
  ( isUploading:boolean=false
  , isRecording:boolean=false
  , clip:?Clip.Model<input, state>=null
  , player:?Player.Model<input, state>=null
  , menu:Menu.Model=Menu.init()
  , io:IO.Model=IO.init()
  , isMutable:boolean=false
  ):Model<input, state> =>
  new Model
  ( isUploading
  , isRecording
  , clip
  , player
  , menu
  , io
  , isMutable
  )


const createClip = <input, state>
  (time:Time):Clip.Model<input, state> =>
  Clip.init
  ( window.application.model.value.debuggee
  , time
  )


export const captureSnapshot = <input, state>
  ( model:Model<input, state> ):Model<input, state> =>
  new Model
  ( model.isUploading
  , model.isRecording
  , createClip(performance.now())
  , null
  , Menu.captureSnapshot(model.menu)
  , model.io
  , model.isMutable
  )

const updateMenu = <input, state>
  ( model:Model<input, state>
  , action:Menu.Action
  ):Model<input, state> =>
  model.swap(menu, Menu.update, action)


const updatePlayer = <input, state>
  ( model:Model<input, state>
  , action:Player.Action<input, state>
  ):Model<input, state> =>
  ( model.player == null
  ? model
  : model.set(player, Player.update(model.player, action))
  )



const publish = <input, state>
  ( model:Model<input, state> ):Model<input, state> =>
  ( model.clip == null
  ? model
  : model.isPublishing
  ? model
  : publishClip(model, model.clip)
  )


const publishClip = <input, state>
  ( model:Model<input, state>
  , clip:Clip.Model<input, state>
  ):Model<input, state> =>
  model
  .asMutable()
  .set(isUploading, true)
  .swap(menu, Menu.publishing)
  .swap
    ( io
    , IO.perform
    , upload(JSON.stringify(Clip.encode(clip)))
      .map(UploadedClip)
      .capture(error => Task.succeed(UploadFailed(error)))
    )
  .asImmutable()

const published = <input, state>
  ( model:Model<input, state>, gist:Gist ):Model<input, state> =>
  model
  .asMutable()
  .swap(menu, Menu.published)
  .swap(io, IO.perform, Console.log(`Record was published to  ${gist.files["snapshot.json"].raw_url}`))
  .asImmutable()


const print = <input, state>
  (model:Model<input, state>):Model<input, state> =>
  ( model.clip == null
  ? model
  : model
    .asMutable()
    .swap(menu, Menu.printing)
    .swap
      ( io
      , IO.perform
      , Console.log(`\n\n\n${JSON.stringify(model.clip ? Clip.encode(model.clip) : model.clip)}\n\n\n`)
      )
    .swap(io, IO.perform, Task.sleep(100).map(always(Printed)))
    .asImmutable()
  )


const printed = <input, state>
  (model:Model<input, state>):Model<input, state> =>
  model.swap(menu, Menu.printed)

const panic = <message, input, state>
  (model:Model<input, state>, message:message):Model<input, state> =>
  model.swap
  ( io
  , IO.perform
  , Console.error(`Panic! Unsupported action was received`, message)
  )


const failure = <message, input, state>
  (model:Model<input, state>, message:message):Model<input, state> =>
  model.swap
  ( io
  , IO.perform
  , Console.error(`Failure! Enexpected error occured`, message)
  )


const startRecording = <input, state>
  ( model:Model<input, state>
  ):Model<input, state> => {
    const value = createClip(performance.now())
    const result =
    ( model.isRecording
    ? model
    : model
      .asMutable()
      .set(isRecording, true)
      .set(clip, value)
      .set(player, Player.init(value))
      .swap(menu, Menu.startRecording)
      .swap(io, IO.perform, requestFrame())
      .asImmutable()
    )

    return result
  }


const stopRecording = <input, state>
  (model:Model<input, state>):Model<input, state> =>
  ( model.isRecording
  ? model
    .asMutable()
    .swap(menu, Menu.stopRecording)
    .set(isRecording, false)
    .asImmutable()
  : model
  )


const updateRecording = <input, state>
  (model:Model<input, state>, time:Time):Model<input, state> =>
  ( !model.isRecording
  ? model
  : model.clip == null
  ? model
  : model
    .asMutable()
    .set
    ( clip
    , ( model.clip == null
      ? model.clip
      : Clip.updateDuration(model.clip, time)
      )
    )
    .swap(io, IO.perform, requestFrame())
    .asImmutable()
  )


const toggleRecording = <input, state>
  ( model:Model<input, state>):Model<input, state> =>
  ( model.isRecording
  ? stopRecording(model)
  : startRecording(model)
  )


const writeInput = <input, state>
  ( model:Model<input, state>
  , input:input
  ):Model<input, state> =>
  ( !model.isRecording
  ? model
  : model.set
    ( clip
    , ( model.clip == null
      ? null
      : Clip.write(model.clip, input)
      )
    )
  )


// Lens

const clip = lens
  ( <input, state>
    (model:Model<input, state>):?Clip.Model<input, state> =>
      model.clip
  , <input, state>
    ( model:Model<input, state>
    , clip:?Clip.Model<input, state>
    ):Model<input, state> =>
    model.modify
    ( model.isUploading
    , model.isRecording
    , clip
    , ( model.player == null
      ? model.player
      : clip == null
      ? null
      : Player.updateClip(model.player, clip)
      )
    , model.menu
    , model.io
    )
  )

const player = lens
  ( model => model.player
  , ( model, player ) =>
    model.modify
    ( model.isUploading
    , model.isRecording
    , model.clip
    , player
    , model.menu
    , model.io
    )
  )


const menu = lens
  ( model => model.menu
  , (model, menu) =>
    ( model.menu === menu
    ? model
    : model.modify
      ( model.isUploading
      , model.isRecording
      , model.clip
      , model.player
      , menu
      , model.io
      )
    )
  )


const io = lens
  ( model => model.io
  , ( model, io ) =>
    model.modify
    ( model.isUploading
    , model.isRecording
    , model.clip
    , model.player
    , model.menu
    , io
    )
  )


const isUploading = lens
  ( model => model.isUploading
  , ( model, isUploading) =>
    model.modify
    ( isUploading
    , model.isRecording
    , model.clip
    , model.player
    , model.menu
    , model.io
    )
  )



const isRecording = lens
  ( model => model.isRecording
  , ( model, isRecording) =>
    ( model.isRecording == isRecording
    ?  model
    : model.modify
      ( model.isUploading
      , isRecording
      , model.clip
      , model.player
      , model.menu
      , model.io
      )
    )
  )


export const fx = <input, state>
  (model:Model<input, state>):Effects<Action<input, state>> =>
  Effects.batch
  ( [ model.io
    , Menu.fx(model.menu).map(tagMenu)
    ]
  )




const tagMenu =
  action =>
  ( action.type === "ToggleRecording"
  ? ToggleRecording
  : action.type === "StartRecording"
  ? StartRecording
  : action.type === "StopRecording"
  ? StopRecording
  : action.type === "CaptureSnapshot"
  ? CaptureSnapshot
  : action.type === "Printing"
  ? Print
  : action.type === "Publishing"
  ? Publish
  : { type: "menu"
    , menu: action
    }
  )


const tagPlayer =
  action =>
  ( { type: "player"
    , player: action
    }
  )




const upload =
  (content:string):Task<Error, Gist> =>
  new Task((succeed, fail) => {
    const request = new XMLHttpRequest({mozSystem: true});
    request.open('POST', 'https://api.github.com/gists', true);
    request.responseType = 'json';
    request.send
    ( JSON.stringify
      ( { "description": "Browser.html generated state snapshot"
        , "public": true
        , "files":
          { "snapshot.json": {content}
          }
        }
      )
    )

    request.onload =
      () =>
      ( request.status === 201
      ? succeed((request.response:Gist))
      : fail(Error(`Failed to upload snapshot : ${request.statusText}`))
      )
  })


export const requestFrame = <input, state>
  ():Task<Never, Action<input, state>> =>
  Task
  .requestAnimationFrame()
  .map(AnimationFrame)

export const update = <action, model>
  ( model:Model<action, model>
  , action:Action<action, model>
  ):Model<action, model> => {
    switch (action.type) {
      case "NoOp":
        return model
      case "Print":
        return print(model)
      case "Printed":
        return printed(model)
      case "Publish":
        return publish(model)
      case "UploadedClip":
        return published(model, action.uploadedClip)
      case "UploadFailed":
        return failure(model, action.uploadFailed)
      case "StartRecording":
        return startRecording(model)
      case "StopRecording":
        return stopRecording(model)
      case "AnimationFrame":
        return updateRecording(model, action.time)
      case "ToggleRecording":
        return toggleRecording(model)
      case "CaptureSnapshot":
        return captureSnapshot(model)
      case "Debuggee":
        return writeInput(model, action.debuggee)
      case "menu":
        return updateMenu(model, action.menu)
      case "player":
        return updatePlayer(model, action.player)
      default:
        return panic(model, action)
    }
  }


export const render = <model, action>
  ( model:Model<model, action>
  , address:Address<Action<model, action>>
  ):DOM =>
  html.dialog
  ( { id: "record"
    , style: Style.mix
      ( styleSheet.base
      , ( model.isUploading
        ? styleSheet.flash
        : styleSheet.noflash
        )
      )

    , open: true
    }
  , [ Menu.view
      ( model.menu
      , forward(address, tagMenu)
      )

    , ( model.player == null
      ? ""
      : Player.view
        ( model.player
        , forward(address, tagPlayer)
        )
      )
    ]
  )

export const view = <input, state>
  ( model:Model<input, state>
  , address:Address<Action<input, state>>
  ):DOM =>
  thunk
  ( "record"
  , render
  , model
  , address
  )


const styleSheet = Style.createSheet
  ( { base:
      { position: "absolute"
      , pointerEvents: "none"
      , backgroundColor: "transparent"
      , height: "100%"
      , width: "100%"
      , transitionDuration: "50ms"
      // @TODO: Enable once this works properly on servo.
      // , transitionProperty: "opacity"
      , transitionTimingFunction: "ease"
      }
    , flash:
      { opacity: 0.9
      , backgroundColor: "rgba(255, 255, 255, 0.7)"
      }

    , noflash: null
    }
  )
