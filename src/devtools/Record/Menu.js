/* @flow */

import {Effects, html, thunk, forward} from "reflex"
import {lens} from "../../common/lens"
import * as Style from "../../common/style"
import * as IO from "../../common/IO"
import * as Console from "../../common/Console"
import * as ClipButton from "./Menu/ClipButton"
import * as SnapshotButton from "./Menu/SnapshotButton"

/*::
export type Time = number
export type Version = number

import type {Address, DOM} from "reflex"
import {performance} from "../../common/performance"

export type Action =
  | { type: "Clip", clip: ClipButton.Action }
  | { type: "Snapshot", snapshot: SnapshotButton.Action }
  | { type: "ToggleRecording" }
  | { type: "StartRecording" }
  | { type: "StopRecording" }
  | { type: "CaptureSnapshot" }
*/

export class Model {
  /*::
  clipButton: ClipButton.Model;
  snapshotButton: SnapshotButton.Model;
  io: IO.Model;
  */
  constructor(clipButton, snapshotButton, io) {
    this.clipButton = clipButton
    this.snapshotButton = snapshotButton
    this.io = io
  }
}

const tagSnapshot =
  ( action ) =>
  ( action.type === "Press"
  ? CaptureSnapshot
  : { type: "Snapshot"
    , snapshot: action
    }
  )

const tagClip =
  ( action ) =>
  ( action.type === "Toggle"
  ? ToggleRecording
  : { type: "Clip"
    , clip: action
    }
  )

const snapshot = lens
  ( ( {snapshotButton} ) => snapshotButton
  , ( model, snapshotButton ) =>
    ( model.snapshotButton === snapshotButton
    ? model
    : new Model
      ( model.clipButton
      , snapshotButton
      , model.io
      )
    )
  )

const clip = lens
  ( ( {clipButton} ) => clipButton
  , ( model, clipButton ) =>
    ( model.clipButton === clipButton
    ? model
    : new Model
      ( clipButton
      , model.snapshotButton
      , model.io
      )
    )
  )


const CaptureSnapshot = { type: "CaptureSnapshot" }
const ToggleRecording = { type: "ToggleRecording" }
const StartRecording = { type: "StartRecording" }
const StopRecording = { type: "StopRecording" }


export const init =
  ()/*:Model*/ =>
  new Model
  ( ClipButton.init("\uf03d")
  , SnapshotButton.init("\uf030")
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
  : action.type === "Clip"
  ? clip.swap(ClipButton.update, model, action.clip)
  : action.type === "Snapshot"
  ? snapshot.swap(SnapshotButton.update, model, action.snapshot)
  : panic(model, action)
  )

export const panic = /*::<action>*/
  (model/*:Model*/, action/*:action*/)/*:Model*/ =>
  new Model
  ( model.clipButton
  , model.snapshotButton
  , IO.perform
    ( model.io
    , Console.error(`Panic! Unknown action was passed to update`, action)
    )
  )

export const startRecording =
  (model/*:Model*/)/*:Model*/ =>
  clip.swap(ClipButton.check, model)

export const stopRecording =
  (model/*:Model*/)/*:Model*/ =>
  clip.swap(ClipButton.uncheck, model)

export const toggleRecording =
  (model/*:Model*/)/*:Model*/ =>
  clip.swap(ClipButton.toggle, model)

export const captureSnapshot =
  (model/*:Model*/)/*:Model*/ =>
  snapshot.swap(SnapshotButton.press, model)

export const fx =
  (model/*:Model*/)/*:Effects<Action>*/ =>
  Effects.batch
  ( [ IO.fx(model.io)
    , ClipButton.fx(model.clipButton).map(tagClip)
    , SnapshotButton.fx(model.snapshotButton).map(tagSnapshot)
    ]
  )


export const render =
  ( model/*:Model*/
  , address/*:Address<Action>*/
  )/*:DOM*/ =>
  html.menu
  ( { style: styleSheet.base }
  , [ SnapshotButton.view(model.snapshotButton, forward(address, tagSnapshot))
    , ClipButton.view(model.clipButton, forward(address, tagClip))
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
