/* @flow */

import {Effects, Task, html, thunk, forward} from "reflex"
import {merge, always} from "../common/prelude"
import {ok, error} from "../common/result"
import {lens, Lens} from "../common/lens"
import * as IO from "../common/IO"
import * as Console from "../common/Console"
import * as Runtime from "../common/runtime"
import * as Unknown from "../common/unknown"
import * as Style from "../common/style"
import * as Clip from "./Record/Clip"
import * as Menu from "./Record/Menu"

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
  | { type: "Upload" }
  | { type: "UploadedClip", uploadedClip: Gist }
  | { type: "UploadFailed", uploadFailed: Error }
  | { type: "Menu", menu: Menu.Action }
*/

const CaptureSnapshot = { type: "CaptureSnapshot" }
const ToggleRecording = { type: "ToggleRecording" }
const StartRecording = { type: "StartRecording" }
const StopRecording = { type: "StopRecording" }

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
  menu: Menu.Model;
  io: IO.Model;
  mutable: boolean;
  */
  constructor(
    isUploading/*:boolean*/
  , isRecording/*:boolean*/
  , clip/*:?Clip.Model<input, state>*/
  , menu/*:Menu.Model*/
  , io/*:IO.Model*/
  , mutable/*:boolean*/
  )/*:Model<input, state>*/ {
    this.isUploading = isUploading
    this.isRecording = isRecording
    this.clip = clip
    this.menu = menu
    this.io = io
    this.mutable = mutable

    return this
  }
  set /*::<to>*/ (lens/*:Lens<Model<input, state>, to>*/, value/*:to*/)/*:Model<input, state>*/ {
    return lens.set(this, value)
  }
  get /*::<to>*/(lens/*:Lens<Model<input, state>, to>*/)/*:to*/ {
    return lens.get(this)
  }
  swap /*::<to, context>*/(lens/*:Lens<Model<input, state>, to>*/, update/*:(a:to, context:context) => to*/, context/*:context*/)/*:Model<input, state>*/ {
    return lens.swap(update, this, context)
  }
  map(f/*:<a:Model<input, state>>(input:a)=>a*/)/*:Model<input, state>*/ {
    return f(this)
  }
  modify(
    isUploading/*:boolean*/
  , isRecording/*:boolean*/
  , clip/*:?Clip.Model<input, state>*/
  , menu/*:Menu.Model*/
  , io/*:IO.Model*/
  )/*:Model<input, state>*/ {
    const model =
      ( this.mutable
      ? this.constructor
        ( isUploading
        , isRecording
        , clip
        , menu
        , io
        , this.mutable
        )
      : new this.constructor
        ( isUploading
        , isRecording
        , clip
        , menu
        , io
        , this.mutable
        )
      )

    return model
  }
  asMutable()/*:Model<input, state>*/ {
    const model =
      ( this.mutable
      ? this
      : new this.constructor
        ( this.isUploading
        , this.isRecording
        , this.clip
        , this.menu
        , this.io
        , true
        )
      )
    return model
  }
  asImmutable()/*:Model<input, state>*/ {
    this.mutable = false
    return this
  }
}

export const init = /*::<input, state>*/
  ( isUploading/*:boolean*/=false
  , isRecording/*:boolean*/=false
  , clip/*:?Clip.Model<input, state>*/=null
  , menu/*:Menu.Model*/=Menu.init()
  , io/*:IO.Model*/=IO.init()
  )/*:Model<input, state>*/ =>
  new Model
  ( isUploading
  , isRecording
  , clip
  , menu
  , io
  , false
  )

const createClip = /*::<input, state>*/
  ( model/*:Model<input, state>*/ )/*:Model<input, state>*/ =>
  model
  .set
  ( clip
  , Clip.init
    ( window.application.model.value.debuggee
    , performance.now()
    )
  )

export const captureSnapshot = /*::<input, state>*/
  ( model/*:Model<input, state>*/ )/*:Model<input, state>*/ =>
  model
  .asMutable()
  .swap(menu, Menu.captureSnapshot)
  .map(createClip)
  .asImmutable()

const clip = lens
  ( ({clip}) => clip
  , (model, clip) =>
    ( model.clip === clip
    ? model
    : model.modify
      ( model.isUploading
      , model.isRecording
      , clip
      , model.menu
      , model.io
      )
    )
  )

const isRecording = lens
  ( ({isRecording}/*:Model<any, any>*/)/*:boolean*/ => isRecording
  , (model/*:Model<any, any>*/, isRecording/*:boolean*/)/*:Model<any, any>*/ =>
    ( model.isRecording === isRecording
    ? model
    : model.modify
      ( model.isUploading
      , isRecording
      , model.clip
      , model.menu
      , model.io
      )
    )
  )

const isUploading = lens
  ( ({isUploading}) => isUploading
  , (model, isUploading) =>
    ( model.isUploading === isUploading
    ? model
    : model.modify
      ( isUploading
      , model.isRecording
      , model.clip
      , model.menu
      , model.io
      )
    )
  )

const io = lens
  ( ({io}) => io
  , (model, io) =>
    ( model.io === io
    ? model
    : model.modify
      ( model.isUploading
      , model.isRecording
      , model.clip
      , model.menu
      , io
      )
    )
  )

const menu = lens
  ( ({menu}) => menu
  , (model, menu) =>
    ( model.menu === menu
    ? model
    : model.modify
      ( model.isUploading
      , model.isRecording
      , model.clip
      , menu
      , model.io
      )
    )
  )



const publish = /*::<input, state>*/
  ( model/*:Model<input, state>*/ )/*:Model<input, state>*/ =>
  ( model.clip == null
  ? model
  : model.isPublishing
  ? model
  : model
    .asMutable()
    .set(isUploading, true)
    .swap
    ( io
    , IO.perform
    , upload(JSON.stringify(Clip.encode(model.clip)))
      .map(UploadedClip)
      // .capture(error => (Task.succeed(UploadFailed(error))/*:Task<Never, Action<action, model>>*/))
      .capture(error => Task.succeed(UploadFailed(error)))
    )
    .asImmutable()
  );

const print = /*::<input, state>*/
  (model/*:Model<input, state>*/)/*:Model<input, state>*/ =>
  ( model.clip == null
  ? model
  : model.swap
    ( io
    , IO.perform
    , Console.log(`\n\n\n${JSON.stringify(Clip.encode(model.clip))}\n\n\n`)
    )
  )

const panic = /*::<message, input, state>*/
  (model/*:Model<input, state>*/, message/*:message*/)/*:Model<input, state>*/ =>
  model.swap
  ( io
  , IO.perform
  , Console.log(`Panic! Unsupported action was received`, message)
  )

const startRecording = /*::<input, state>*/
  ( model/*:Model<input, state>*/)/*:Model<input, state>*/ =>
  ( model.isRecording
  ? model
  : model
    .asMutable()
    .set(isRecording, true)
    .swap(menu, Menu.startRecording)
    .map(createClip)
    .asImmutable()
  )

const stopRecording = /*::<input, state>*/
  (model/*:Model<input, state>*/)/*:Model<input, state>*/ =>
  ( model.isRecording
  ? model
    .asMutable()
    .set(isRecording, false)
    .swap(menu, Menu.stopRecording)
    .asImmutable()
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
  : model.swap
    ( clip
    , Clip.write
    , input
    )
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
  : { type: "Menu"
    , menu: action
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
  )/*:Model<action, model>*/ =>
  ( action.type === "NoOp"
  ? model
  : action.type === "Print"
  ? print(model)
  : action.type === "Publish"
  ? publish(model)
  : action.type === "StartRecording"
  ? startRecording(model)
  : action.type === "StopRecording"
  ? stopRecording(model)
  : action.type === "ToggleRecording"
  ? toggleRecording(model)
  : action.type === "CaptureSnapshot"
  ? captureSnapshot(model)
  : action.type === "Debuggee"
  ? writeInput(model, action.debuggee)
  : action.type === "Menu"
  ? model.swap(menu, Menu.update, action.menu)
  : panic(model, action)
  )

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
