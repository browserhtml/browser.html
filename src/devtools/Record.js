/* @flow */

import {Effects, Task, html, thunk, forward} from "reflex"
import {merge, always} from "../common/prelude"
import {ok, error} from "../common/result"
import * as IO from "../common/IO"
import * as Console from "../common/Console"
import * as Runtime from "../common/runtime"
import * as Unknown from "../common/unknown"
import * as Style from "../common/style"
import * as Clip from "./Record/Clip"
import * as Menu from "./Record/Menu"
import * as Player from "./Replay/Player"

/*::
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
  | { type: "ToggleRecording" }
  | { type: "CaptureSnapshot" }
  | { type: "Print" }
  | { type: "Printed" }
  | { type: "Publish" }
  | { type: "UploadedClip", uploadedClip: Gist }
  | { type: "UploadFailed", uploadFailed: Error }
  | { type: "#menu", menu: Menu.Action }
  | { type: "#player", player: Player.Action<input, state>}
*/

const NoOp = always({type: "NoOp"})
const CaptureSnapshot = { type: "CaptureSnapshot" }
const ToggleRecording = { type: "ToggleRecording" }
const StartRecording = { type: "StartRecording" }
const StopRecording = { type: "StopRecording" }
const Print = { type: "Print" }
const Printed = { type: "Printed" }
const Publish = { type: "Publish" }

const UploadFailed = /*::<input, state>*/
  ( error/*:Error*/ )/*:Action<input, state>*/ =>
  ( { type: "UploadFailed"
    , uploadFailed: error
    }
  );

const UploadedClip = /*::<input, state>*/
  ( gist/*:Gist*/ )/*:Action<input, state>*/ =>
  ( { type: "UploadedClip"
    , uploadedClip: gist
    }
  );


export class Model /*::<input, state>*/ {
  /*::
  isUploading: boolean;
  isRecording: boolean;
  clip: ?Clip.Model<input, state>;
  player: ?Player.Model<input, state>;
  menu: Menu.Model;
  io: IO.Model;
  */
  constructor(
    isUploading/*:boolean*/
  , isRecording/*:boolean*/
  , clip/*:?Clip.Model<input, state>*/
  , player/*:?Player.Model<input, state>*/
  , menu/*:Menu.Model*/
  , io/*:IO.Model*/
  ) {
    this.isUploading = isUploading
    this.isRecording = isRecording
    this.clip = clip
    this.player = player
    this.menu = menu
    this.io = io
  }
}

export const init = /*::<input, state>*/
  ( isUploading/*:boolean*/=false
  , isRecording/*:boolean*/=false
  , clip/*:?Clip.Model<input, state>*/=null
  , player/*:?Player.Model<input, state>*/=null
  , menu/*:Menu.Model*/=Menu.init()
  , io/*:IO.Model*/=IO.init()
  )/*:Model<input, state>*/ =>
  new Model
  ( isUploading
  , isRecording
  , clip
  , player
  , menu
  , io
  )

const createClip = /*::<input, state>*/
  (time/*:Time*/)/*:Clip.Model<input, state>*/ =>
  Clip.init
  ( window.application.model.value.debuggee
  , time
  )

export const captureSnapshot = /*::<input, state>*/
  ( model/*:Model<input, state>*/ )/*:Model<input, state>*/ =>
  new Model
  ( model.isUploading
  , model.isRecording
  , createClip(performance.now())
  , null
  , Menu.captureSnapshot(model.menu)
  , model.io
  )


const updateMenu = /*::<input, state>*/
  ( model/*:Model<input, state>*/
  , action/*:Menu.Action*/
  )/*:Model<input, state>*/ =>
  new Model
  ( model.isUploading
  , model.isRecording
  , model.clip
  , model.player
  , Menu.update(model.menu, action)
  , model.io
  )

const updatePlayer = /*::<input, state>*/
  ( model/*:Model<input, state>*/
  , action/*:Player.Action<input, state>*/
  )/*:Model<input, state>*/ =>
  ( model.player == null
  ? model
  : new Model
    ( model.isUploading
    , model.isRecording
    , model.clip
    , Player.update(model.player, action)
    , model.menu
    , model.io
    )
  )



const publish = /*::<input, state>*/
  ( model/*:Model<input, state>*/ )/*:Model<input, state>*/ =>
  ( model.clip == null
  ? model
  : model.isPublishing
  ? model
  : publishClip(model, model.clip)
  )

const publishClip = /*::<input, state>*/
  ( model/*:Model<input, state>*/
  , clip/*:Clip.Model<input, state>*/
  )/*:Model<input, state>*/ =>
  new Model
  ( true
  , model.isRecording
  , model.clip
  , model.player
  , Menu.publishing(model.menu)
  , model.io.perform
    ( upload(JSON.stringify(Clip.encode(clip)))
      .map(UploadedClip)
      .capture(error => Task.succeed(UploadFailed(error)))
    )
  )

const published = /*::<input, state>*/
  ( model/*:Model<input, state>*/, gist/*:Gist*/ )/*:Model<input, state>*/ =>
  new Model
  ( false
  , false
  , null
  , null
  , Menu.published(model.menu)
  , model.io.perform(Console.log(`Record was published to  ${gist.url}`))
  )


const print = /*::<input, state>*/
  (model/*:Model<input, state>*/)/*:Model<input, state>*/ =>
  ( model.clip != null
  ? new Model
    ( model.isUploading
    , model.isRecording
    , model.clip
    , model.player
    , Menu.printing(model.menu)
    , model.io
      .perform(Console.log(`\n\n\n${JSON.stringify(model.clip ? Clip.encode(model.clip) : model.clip)}\n\n\n`))
      .perform(Task.sleep(100).map(always(Printed)))
    )
  : model
  )

const printed = /*::<input, state>*/
  (model/*:Model<input, state>*/)/*:Model<input, state>*/ =>
  new Model
  ( model.isUploading
  , model.isRecording
  , model.clip
  , model.player
  , Menu.printed(model.menu)
  , model.io
  )

const panic = /*::<message, input, state>*/
  (model/*:Model<input, state>*/, message/*:message*/)/*:Model<input, state>*/ =>
  new Model
  ( model.isUploading
  , model.isRecording
  , model.clip
  , model.player
  , model.menu
  , IO.perform
    ( model.io
    , Console.log(`Panic! Unsupported action was received`, message)
    )
  )

const failure = /*::<message, input, state>*/
  (model/*:Model<input, state>*/, message/*:message*/)/*:Model<input, state>*/ =>
  new Model
  ( model.isUploading
  , model.isRecording
  , model.clip
  , model.player
  , model.menu
  , IO.perform
    ( model.io
    , Console.error(`Failure! Enexpected error occured`, message)
    )
  )

const startRecording = /*::<input, state>*/
  ( model/*:Model<input, state>*/
  , clip/*:Clip.Model<input, state>*/=createClip(performance.now())
  )/*:Model<input, state>*/ =>
  ( model.isRecording
  ? model
  : new Model
    ( model.isUploading
    , true
    , clip
    , Player.init(clip)
    , Menu.startRecording(model.menu)
    , model.io
    )
  )

const stopRecording = /*::<input, state>*/
  (model/*:Model<input, state>*/)/*:Model<input, state>*/ =>
  ( model.isRecording
  ? new Model
    ( model.isUploading
    , false
    , model.clip
    , model.player
    , Menu.stopRecording(model.menu)
    , model.io
    )
  : model
  )

const toggleRecording = /*::<input, state>*/
  ( model/*:Model<input, state>*/)/*:Model<input, state>*/ =>
  ( model.isRecording
  ? stopRecording(model)
  : startRecording(model)
  )

const writeInput = /*::<input, state>*/
  ( model/*:Model<input, state>*/
  , input/*:input*/
  )/*:Model<input, state>*/ =>
  ( !model.isRecording
  ? model
  : model.clip == null
  ? model
  : updateClip(model, Clip.write(model.clip, input))
  )

const updateClip = /*::<input, state>*/
  ( model/*:Model<input, state>*/
  , clip/*:Clip.Model<input, state>*/
  )/*:Model<input, state>*/ =>
  new Model
  ( model.isUploading
  , model.isRecording
  , clip
  , ( model.player == null
    ? model.player
    : Player.updateClip(model.player, clip)
    )
  , model.menu
  , model.io
  )


export const fx = /*::<input, state>*/
  (model/*:Model<input, state>*/)/*:Effects<Action<input, state>>*/ =>
  Effects.batch
  ( [ model.io
    , Menu.fx(model.menu).map(tagMenu)
    ]
  )

export const transact = /*::<input, state>*/
  ( model/*:Model<input, state>*/
  )/*:[Model<input, state>, Effects<Action<input, state>>]*/ =>
  [ model, fx(model) ]

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
  : { type: "#menu"
    , menu: action
    }
  )

const tagPlayer =
  action =>
  ( { type: "#player"
    , player: action
    }
  )


const upload =
  (content/*:string*/)/*:Task<Error, Gist>*/ =>
  new Task((succeed, fail) => {
    const request = new XMLHttpRequest({mozSystem: true});
    request.open('POST', 'https://api.github.com/gists', true);
    request.responseType = 'json';
    request.send
    ( JSON.stringify
      ( { "description": "Browser.html generated state snapshot"
        , "public": true
        , "files":
          { "snapshot.json":
            { "content": content }
          }
        }
      )
    );

    request.onload = () =>
    ( request.status === 201
    ? succeed((request.response/*:Gist*/))
    : fail(Error(`Failed to upload snapshot : ${request.statusText}`))
    )
  });

export const update = /*::<action, model>*/
  ( model/*:Model<action, model>*/
  , action/*:Action<action, model>*/
  )/*:Model<action, model>*/ => {
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
      case "ToggleRecording":
        return toggleRecording(model)
      case "CaptureSnapshot":
        return captureSnapshot(model)
      case "Debuggee":
        return writeInput(model, action.debuggee)
      case "#menu":
        return updateMenu(model, action.menu)
      case "#player":
        return updatePlayer(model, action.player)
      default:
        return panic(model, action)
    }
  }

export const render = /*::<model, action>*/
  ( model/*:Model<model, action>*/
  , address/*:Address<Action<model, action>>*/
  )/*:DOM*/ =>
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
  );

export const view = /*::<input, state>*/
  ( model/*:Model<input, state>*/
  , address/*:Address<Action<input, state>>*/
  )/*:DOM*/ =>
  thunk
  ( "record"
  , render
  , model
  , address
  );


const styleSheet = Style.createSheet
  ( { base:
      { position: "absolute"
      , pointerEvents: "none"
      , backgroundColor: "rgba(255, 255, 255, 0.1)"
      // , opacity: 0
      , height: "100%"
      , width: "100%"
      , transitionDuration: "50ms"
      // @TODO: Enable once this works properly on servo.
      // , transitionProperty: "opacity"
      , transitionTimingFunction: "ease"
      }
    , flash:
      { opacity: 0.9
      }
    , noflash: null
    }
  );
