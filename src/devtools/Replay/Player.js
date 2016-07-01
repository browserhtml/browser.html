/* @flow */

import {html, thunk, forward} from "reflex"
import * as Clip from "../Record/Clip"
import * as IO from "../../common/IO"
import * as Console from "../../common/Console"

/*::
import type { Time, Version } from "../Record/Clip"
import type {DOM, Address} from "reflex"

export type Action <input, state> =
  | { type: "NoOp" }
  | { type: "Zoom", zoom: number }
  | { type: "Slide", slide: number }
  | { type: "UpdataClip", clip: Clip.Model<input, state> }
*/

const NoOp = { type: "NoOp" }
const Zoom =
  ( deltaY ) =>
  ( { type: "Zoom"
    , zoom: deltaY
    }
  );
const Slide =
  ( deltaX ) =>
  ( { type: "Slide"
    , slide: deltaX
    }
  );

export class Model <input, state> {
  /*::
  clip: Clip.Model<input, state>;
  position: Time;
  zoom: number;
  io: IO.Model;
  */
  constructor(
    clip/*:Clip.Model<input, state>*/
  , position/*:number*/
  , zoom/*:number*/
  , io/*:IO.Model*/
  ) {
    this.clip = clip
    this.position = position
    this.zoom = zoom
    this.io = io
  }
}

export const init = <input, state>
  ( clip/*:Clip.Model<input, state>*/
  , position/*:Time*/=clip.duration
  , zoom/*:number*/=1
  , io/*:IO.Model*/=IO.init()
  )/*:Model<input, state>*/ =>
  new Model
  ( clip
  , position
  , zoom
  , io
  )

export const update = <input, state>
  ( model/*:Model<input, state>*/
  , action/*:Action<input, state>*/
  )/*:Model<input, state>*/ => {
    switch (action.type) {
      case "Zoom":
        return updateZoom(model, action.zoom)
      case "Slide":
        return updatePosition(model, action.slide)
      case "UpdateClip":
        return updateClip(model, action.clip)
      default:
        return panic(model, action)
    }
  }

const MIN_ZOOM = 0.001;
const MAX_ZOOM = 10;
const MIN_DURATION = 1 * 1000;

export const updatePosition = <input, state>
  ( model/*:Model<input, state>*/
  , delta/*:number*/
  )/*:Model<input, state>*/ =>
  setPosition
  ( model
  , Math.max(0, Math.min(model.clip.duration, model.position + (delta / model.zoom)))
  )

export const setPosition = <input, state>
  ( model/*:Model<input, state>*/
  , position/*:Time*/
  )/*:Model<input, state>*/ =>
  ( model.position === position
  ? model
  : new Model
    ( model.clip
    , position
    , model.zoom
    , model.io
    )
  )

export const updateZoom = <input, state>
  ( model/*:Model<input, state>*/
  , delta/*:number*/
  )/*:Model<input, state>*/ =>
  setZoom
  ( model
  , Math.max
    ( 300 / model.clip.duration / MS2PX // should be at least 300px length
    , Math.min
      ( MAX_ZOOM
      , model.zoom + (delta / 200)
      )
    )
  )

const setZoom = <input, state>
  ( model/*:Model<input, state>*/
  , zoom/*:number*/
  )/*:Model<input, state>*/ =>
  ( model.zoom === zoom
  ? model
  : new Model
    ( model.clip
    , model.position
    , zoom
    , model.io
    )
  )

export const updateClip = <input, state>
  ( model/*:Model<input, state>*/
  , clip/*:Clip.Model<input, state>*/
  )/*:Model<input, state>*/ =>
  new Model
  ( clip
  , ( model.position === model.clip.duration
    ? clip.duration
    : model.position
    )
  , model.zoom
  , model.io
  )

const panic = <message, input, state>
  (model/*:Model<input, state>*/, message/*:message*/)/*:Model<input, state>*/ =>
  new Model
  ( model.clip
  , model.position
  , model.zoom
  , IO.perform
    ( model.io
    , Console.error(`Panic! Unsupported action was received`, message)
    )
  )


const MS2PX = 1

const renderTimeFrame =
  (index/*:number*/, time/*:number*/, size/*:number*/)/*:DOM*/ =>
  html.div
  ( { style:
      { height: '100%'
      , width: `${size}px`
      , position: 'absolute'
      , top: 0
      , borderRight: `1px dotted darkgray`
      , transform: `translateX(${index * size}px)`
      }
    }
  , [ html.time
      ( { style:
          { paddingLeft: `5px`
          , color: "darkgray"
          }
        }
      , [formatTime(index * time)]
      )
    ]
  )

const viewTimeFrame =
  (index/*:number*/, time/*:number*/, size/*:number*/)/*:DOM*/ =>
  thunk
  ( `${index}`
  , renderTimeFrame
  , index
  , time
  , size
  )


const closest = (n, step) => {
  let value = 1;
  let diff = Math.abs(n - value);

  while (true) {
    let nextValue = value * step;
    let nextDiff = Math.abs(n - nextValue);

    if (nextDiff > diff) {
      break;
    }

    diff = nextDiff;
    value = nextValue;
  }

  return value
}

export const renderTimeline =
  (duration/*:Time*/, zoom/*:number*/)/*:DOM*/ => {
    const width = duration * zoom * MS2PX

    const frameCount = closest(width / 200, 2)
    const frameSize = width / frameCount
    const timeFrame = duration / frameCount

    const node =
      html.div
      ( { className: "time"
        , style:
          { position: 'absolute'
          , height: '100%'
          }
        }
      , new Array(frameCount)
        .fill(0)
        .reduce
        ( ({nodes, index}, _) => {
            nodes[index] = viewTimeFrame(index, timeFrame, frameSize)
            index += 1

            return {index, nodes}
          }
        , {index: 0, nodes: []}
        )
        .nodes
      )

    return node
  }

const formatTime =
  time => {
    const minutes = Math.floor(time / 1000 / 60)
    const seconds = Math.floor(time / 1000 - minutes * 60)
    const miliseconds = Math.floor(time - seconds * 1000)

    const m =
      ( minutes > 9
      ? `${minutes}`
      : `0${minutes}`
      )

    const s =
      ( seconds > 9
      ? `${seconds}`
      : `0${seconds}`
      )

    const ms =
      ( miliseconds > 99
      ? `${miliseconds}`
      : miliseconds > 9
      ? `0${miliseconds}`
      : `00${miliseconds}`
      )


    return `${m}:${s}:${ms}`
  }

const renderCaret =
  (position) =>
  html.figure
  ( { className: "caret"
    , style:
      { width: "1px"
      , height: "100%"
      , left: `calc(50% - 1px)`
      , position: 'absolute'
      , background: 'darkgray'
      , outlineWidth: '6px'
      , outlineStyle: 'solid'
      , outlineColor: 'rgba(255, 255, 255, 0.5)'
      , zIndex: 3
      }
    }
  , [ html.time
      ( { style:
          { marginLeft: '10px'
          , color: 'grey'
          , bottom: 0
          , position: 'absolute'
          }
        }
      , [ formatTime(position) ]
      )
    ]
  )


const renderTimestamp =
  (time, zoom, stamp) =>
  html.figure
  ( { style:
      { transform: `translateX(${time * zoom * MS2PX - 4}px)`
      , width: '8px'
      , height: '8px'
      , top: 'calc(50% - 4px)'
      , overflow: 'hidden'
      , display: 'inline-block'
      , background: 'gray'
      , borderRadius: '25px'
      , position: 'absolute'
      , cursor: 'pointer'
      }
    , title: JSON.stringify(stamp, null, 2)
    }
  )

const viewTimestamp =
  (time, zoom, stamp) =>
  thunk
  ( `${time}`
  , renderTimestamp
  , time
  , zoom
  , stamp
  )

const renderTimestamps =
  (zoom, clip) =>
  html.div
  ( { className: "time-stamps" }
  , clip.timeline.reduce
    ( ({index, nodes}, time) => {
        nodes[index] = viewTimestamp(time, zoom, clip.input[index])
        return {index: index + 1, nodes}
      }
    , {index: 0, nodes: []}
    )
    .nodes
  )

const viewTimestamps =
  (zoom, clip) =>
  thunk
  ( 'timestamps'
  , renderTimestamps
  , zoom
  , clip
  )


const viewClip =
  (model) => {
    const {zoom, clip, position} = model
    const duration = Math.max(MIN_DURATION, clip.duration)
    const width = duration * zoom * MS2PX
    const offset = position * zoom * MS2PX

    const node =
      html.div
      ( { className: "timeline"
        , style:
          { height: '100px'
          , position: 'absolute'
          , display: 'inline'
          , background: 'rgba(0, 0, 0, 0.1)'
          , transform: `translateX(${-offset}px)`
          , width: `${width}px`
          , left: `50%`
          , overflow: 'hidden'
          // , padding: '0 200px'
          // , marginLeft: '-200px'
          }
        }
      , [ viewTimeline(duration, zoom)
        , viewTimestamps(zoom, clip)
        ]
      )

    return node
  }

const viewCaret =
  (position/*:Time*/)/*:DOM*/ =>
  thunk
  ( "caret"
  , renderCaret
  , position
  )


const viewTimeline =
  (duration/*:Time*/, zoom/*:number*/)/*:DOM*/ =>
  thunk
  ( "timeline"
  , renderTimeline
  , duration
  , zoom
  )

export const render = <input, state>
  ( model/*:Model<input, state>*/
  , address/*:Address<Action>*/
  )/*:DOM*/ =>
  html.div
  ( { className: "clip"
    , style:
      { width: '100%'
      , height: '100px'
      , background: 'rgba(255, 255, 255, 0.9)'
      , overflow: 'hidden'
      , pointerEvents: 'all'
      , bottom: '0'
      , position: 'absolute'
      }
    , onWheel: forward(address, decodePosition)
    }
  , [ viewCaret(model.position)
    , viewClip(model)
    ]
  )

const decodePosition =
  ({deltaX, deltaY}) => {
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    const position =
      ( absDeltaX > absDeltaY
      ? Slide(deltaX)
      : ( absDeltaY > 3
        ? Zoom(deltaY)
        : NoOp
        )
      )

    return position
  }

export const view = <input, state>
  ( model/*:Model<input, state>*/
  , address/*:Address<Action>*/
  )/*:DOM*/ =>
  thunk
  ( 'player'
  , render
  , model
  , address
  )
