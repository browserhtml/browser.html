/* @flow */

import {html, thunk, forward} from "reflex"

/*::
export type Time = number
export type Version = number

import type {DOM, Address} from "reflex"
import {performance} from "../../common/performance"

export type EncodedClip <input, model> =
  { version: number
  , time: Time
  , duration: Time
  , state: model
  , timeline: Array<Time>
  , input: Array<number>
  , index: Array<input>
  }

export type Action =
  | { type: "NoOp" }
*/

export class Model <input, state> {
  /*::
  version: Version;
  time: Time;
  duration: Time;
  state: state;

  timeline: Array<Time>;
  input: Array<input>;
  */
  constructor(
    state/*:state*/
  , time/*:Time*/
  , duration/*:Time*/
  , version/*:Version*/
  , timeline/*:Array<Time>*/
  , input/*:Array<input>*/
  ) {
    this.version = version;
    this.time = time;
    this.duration = duration;
    this.state = state;

    this.timeline = timeline;
    this.input = input;
  }
}

export const init = <input, state>
  ( state/*:state*/
  , time/*:Time*/=performance.now()
  , duration/*:Time*/=0
  , version/*:Version*/=0.1
  )/*:Model<input, state>*/ =>
  new Model
  ( state
  , time
  , duration
  , version
  , []
  , []
  )

export const write = <input, state>
  ( model/*:Model<input, state>*/
  , input/*:input*/
  , time/*:Time*/=performance.now()
  )/*:Model<input, state>*/ =>
  new Model
  ( model.state
  , model.time
  , time - model.time
  , model.version
  , [...model.timeline, time - model.time]
  , [...model.input, input]
  );

export const updateDuration = <input, state>
  ( model/*:Model<input, state>*/
  , time/*:Time*/
  )/*:Model<input, state>*/ =>
  new Model
  ( model.state
  , model.time
  , time + (2 * 1000) - model.time
  , model.version
  , model.timeline
  , model.input
  );

export const encode = <input, state>
  ( model/*:Model<input, state>*/ )/*:EncodedClip<input, state>*/ => {
    const index = [];
    const input = [];
    const lookup = new Map();

    for (let value of model.input) {
      // @TODO: We should serialize actions in chunks instead. To reduce size of
      // the record even further.
      const hash = JSON.stringify(value);
      const address = lookup.get(hash);
      if (address == null) {
        lookup.set(hash, index.length);
        index.push(value);
        input.push(index.length);
      }
      else {
        input.push(address);
      }
    }

    const clip =
      { version: model.version
      , time: model.time
      , duration: model.duration
      , timeline: model.timeline
      , input: input
      , state: model.state
      , index: index
      };

    return clip
  }

export const decode = <input, state>
  ( clip/*:EncodedClip<input, state>*/ )/*:Model<input, state>*/ => {
    const input = []
    for (let address of clip.input) {
      input.push(clip.index[address]);
    }

    const model = new Model
      ( clip.state
      , clip.time
      , clip.duration
      , clip.version
      , clip.timeline
      , input
      );

    return model;
  }

const MS2PX = 1
export const render = <input, state>
  ( model/*:Model<input, state>*/
  , address/*:Address<Action>*/
  )/*:DOM*/ =>
  html.div
  ( { className: "clip"
    , style:
      { width: '100%'
      , height: '100px'
      , background: 'white'
      , overflowY: 'auto'
      , pointerEvents: 'all'
      , bottom: '0'
      , position: 'absolute'
      }
    , onWheel: event => console.log(event)
    }
  , [ html.div
      ( { className: "time-line"
        , style:
          { height: '100px'
          , position: 'absolute'
          , display: 'inline'
          , width: `${(model.timeline[model.timeline.length - 1] || 0) * MS2PX + 100}px`
          , background: 'rgba(0, 0, 0, 0.2)'
          }
        }
      , model.timeline.reduce
        ( ({index, nodes}, time) => {
            nodes[index] = html.figure
              ( { style:
                  { transform: `translateX(${time * MS2PX}px)`
                  , width: '8px'
                  , height: '8px'
                  , top: '50px'
                  , overflow: 'hidden'
                  , display: 'inline-block'
                  , background: 'red'
                  , borderRadius: '25px'
                  , position: 'absolute'
                  , cursor: 'pointer'
                  }
                , title: JSON.stringify(model.input[index], null, 2)
                }
              )

            return {index: index + 1, nodes}
          }
        , {index: 0, nodes: []}
        )
        .nodes
      )
    ]
  )
