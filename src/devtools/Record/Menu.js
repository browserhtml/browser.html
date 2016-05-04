/* @flow */

import {Effects, html, thunk, forward} from "reflex"
import {lens, Lens} from "../../common/lens"
import * as Style from "../../common/style"
import * as IO from "../../common/IO"
import * as Console from "../../common/Console"

import * as Clip from "./Menu/Clip"
import * as Snapshot from "./Menu/Snapshot"
import * as Publish from "./Menu/Publish"
import * as Print from "./Menu/Print"

/*::
export type Time = number
export type Version = number

import type {Address, DOM} from "reflex"
import {performance} from "../../common/performance"

export type Action =
  | { type: "#Clip", clip: Clip.Action }
  | { type: "#Snapshot", snapshot: Snapshot.Action }
  | { type: "#Print", print: Print.Action }
  | { type: "#Publish", publish: Publish.Action }
  | { type: "Printing" }
  | { type: "Printed" }
  | { type: "Publishing" }
  | { type: "Published" }
  | { type: "ToggleRecording" }
  | { type: "StartRecording" }
  | { type: "StopRecording" }
  | { type: "CaptureSnapshot" }
*/

export class Model {
  /*::
  clip: Clip.Model;
  snapshot: Snapshot.Model;
  print: Print.Model;
  publish: Publish.Model;
  io: IO.Model;
  */
  constructor(clip, snapshot, print, publish, io) {
    this.clip = clip
    this.snapshot = snapshot
    this.print = print
    this.publish = publish
    this.io = io
  }
  swap /*::<state, input>*/ (
    lens/*:Lens<Model, state>*/
  , modify/*:(state:state, input:input) => state*/
  , input/*:input*/
  )/*:Model*/ {
    return lens.swap(modify, this, input)
  }
}

const tagSnapshot =
  ( action ) =>
  ( action.type === "Press"
  ? CaptureSnapshot
  : { type: "#Snapshot"
    , snapshot: action
    }
  )

const tagClip =
  ( action ) =>
  ( action.type === "Toggle"
  ? ToggleRecording
  : { type: "#Clip"
    , clip: action
    }
  )

const tagPrint =
  ( action ) =>
  ( action.type === "Toggle"
  ? Printing
  : { type: "#Print"
    , print: action
    }
  )

const tagPublish =
  ( action ) =>
  ( action.type === "Toggle"
  ? Publishing
  : { type: "#Publish"
    , publish: action
    }
  )


const snapshot = lens
  ( ( {snapshot} ) => snapshot
  , ( model, snapshot ) =>
    ( model.snapshot === snapshot
    ? model
    : new Model
      ( model.clip
      , snapshot
      , model.print
      , model.publish
      , model.io
      )
    )
  )

const clip = lens
  ( ( {clip} ) => clip
  , ( model, clip ) =>
    ( model.clip === clip
    ? model
    : new Model
      ( clip
      , model.snapshot
      , model.print
      , model.publish
      , model.io
      )
    )
  )

const print = lens
  ( ( {print} ) => print
  , ( model, print ) =>
    ( model.print === print
    ? model
    : new Model
      ( model.clip
      , model.snapshot
      , print
      , model.publish
      , model.io
      )
    )
  )

const publish = lens
  ( ( {publish} ) => publish
  , ( model, publish ) =>
    ( model.publish === publish
    ? model
    : new Model
      ( model.clip
      , model.snapshot
      , model.print
      , publish
      , model.io
      )
    )
  )

const CaptureSnapshot = { type: "CaptureSnapshot" }
const ToggleRecording = { type: "ToggleRecording" }
const StartRecording = { type: "StartRecording" }
const StopRecording = { type: "StopRecording" }
const Printing = { type: "Printing" }
const Printed = { type: "Printed" }
const Publishing = { type: "Publishing" }
const Published = { type: "Published" }


export const init =
  ()/*:Model*/ =>
  new Model
  ( Clip.init("\uf03d")
  , Snapshot.init("\uf030")
  , Print.init("\uf02f")
  , Publish.init("\uf0ee")
  , IO.init()
  )

export const update =
  ( model/*:Model*/
  , action/*:Action*/
  )/*:Model*/ =>
  ( action.type === "CaptureSnapshot"
  ? captureSnapshot(model)
  : action.type === "StartRecording"
  ? startRecording(model)
  : action.type === "StopRecording"
  ? stopRecording(model)
  : action.type === "ToggleRecording"
  ? toggleRecording(model)
  : action.type === "Printing"
  ? printing(model)
  : action.type === "Printed"
  ? printed(model)
  : action.type === "Publishing"
  ? publishing(model)
  : action.type === "Published"
  ? published(model)
  : action.type === "#Clip"
  ? model.swap(clip, Clip.update, action.clip)
  : action.type === "#Snapshot"
  ? model.swap(snapshot, Snapshot.update, action.snapshot)
  : action.type === "#Print"
  ? model.swap(print, Print.update, action.print)
  : action.type === "#Publish"
  ? model.swap(publish, Publish.update, action.publish)
  : panic(model, action)
  )

export const panic = /*::<action>*/
  (model/*:Model*/, action/*:action*/)/*:Model*/ =>
  new Model
  ( model.clip
  , model.snapshot
  , model.print
  , model.publish
  , IO.perform
    ( model.io
    , Console.error(`Panic! Unknown action was passed to update`, action)
    )
  )

export const startRecording =
  (model/*:Model*/)/*:Model*/ =>
  model.swap(clip, Clip.check)

export const stopRecording =
  (model/*:Model*/)/*:Model*/ =>
  model.swap(clip, Clip.uncheck)

export const toggleRecording =
  (model/*:Model*/)/*:Model*/ =>
  model.swap(clip, Clip.toggle)

export const captureSnapshot =
  (model/*:Model*/)/*:Model*/ =>
  model.swap(snapshot, Snapshot.press)

export const printing =
  (model/*:Model*/)/*:Model*/ =>
  model.swap(print, Print.check)

export const printed =
  (model/*:Model*/)/*:Model*/ =>
  model.swap(print, Print.uncheck)

export const publishing =
  (model/*:Model*/)/*:Model*/ =>
  model.swap(publish, Publish.check)

export const published =
  (model/*:Model*/)/*:Model*/ =>
  model.swap(publish, Publish.uncheck)

export const fx =
  (model/*:Model*/)/*:Effects<Action>*/ =>
  Effects.batch
  ( [ model.io
    , Clip.fx(model.clip).map(tagClip)
    , Snapshot.fx(model.snapshot).map(tagSnapshot)
    , Print.fx(model.print).map(tagPrint)
    , Publish.fx(model.publish).map(tagPublish)
    ]
  )


export const render =
  ( model/*:Model*/
  , address/*:Address<Action>*/
  )/*:DOM*/ =>
  html.menu
  ( { style: styleSheet.base }
  , [ Snapshot.view(model.snapshot, forward(address, tagSnapshot))
    , Clip.view(model.clip, forward(address, tagClip))
    , Print.view(model.print, forward(address, tagPrint))
    , Publish.view(model.publish, forward(address, tagPublish))
    ]
  );

export const view =
  ( model/*:Model*/
  , address/*:Address<Action>*/
  )/*:DOM*/ =>
  thunk
  ( "Devtools/Record/Menu"
  , render
  , model
  , address
  );

const styleSheet = Style.createSheet
  ( { base:
      { fontFamily: "FontAwesome"
      , pointerEvents: "all"
      , lineHeight: "initial"
      , listStyle: "none"
      , background: "rgba(0, 0, 0, 0.2)"
      , left: '0px'
      , top: '50px'
      , padding: '5px 0'
      , position: 'absolute'
      , borderRadius: '0 5px 5px 0'
      }
    }
  );
