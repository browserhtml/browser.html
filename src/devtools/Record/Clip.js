/* @flow */

/*::
export type Time = number
export type Version = number

import {performance} from "../../common/performance"

export type EncodedClip <input, model> =
  { version: number
  , time: Time
  , state: model
  , timeline: Array<Time>
  , input: Array<number>
  , index: Array<input>
  }
*/

export class Model /*::<input, state>*/ {
  /*::
  version: Version;
  time: Time;
  state: state;

  timeline: Array<Time>;
  input: Array<input>;
  */
  constructor(
    state/*:state*/
  , time/*:Time*/
  , version/*:Version*/
  , timeline/*:Array<Time>*/
  , input/*:Array<input>*/
  ) {
    this.version = version;
    this.time = time;
    this.state = state;

    this.timeline = timeline;
    this.input = input;
  }
}

export const init = /*::<input, state>*/
  ( state/*:state*/
  , time/*:Time*/=performance.now()
  , version/*:Version*/=0.1
  )/*:Model<input, state>*/ =>
  new Model
  ( state
  , time
  , version
  , []
  , []
  )

export const write = /*::<input, state>*/
  ( model/*:Model<input, state>*/
  , input/*:input*/
  )/*:Model<input, state>*/ =>
  new Model
  ( model.state
  , model.time
  , model.version
  , [...model.timeline, performance.now() - model.time]
  , [...model.input, input]
  );

export const encode = /*::<input, state>*/
  ( model/*:Model<input, state>*/ )/*:EncodedClip<input, state>*/ => {
    const index = [];
    const lookup = [];
    const input = [];

    for (let value of model.input) {
      // @TODO: We should serialize actions in chunks instead. To reduce size of
      // the record even further.
      const hash = JSON.stringify(value);
      const address = lookup.indexOf(hash);
      if (address < 0) {
        lookup.push(hash);
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
      , timeline: model.timeline
      , input: input
      , state: model.state
      , index: index
      };

    return clip
  }

export const decode = /*::<input, state>*/
  ( clip/*:EncodedClip<input, state>*/ )/*:Model<input, state>*/ => {
    const input = []
    for (let address of clip.input) {
      input.push(clip.index[address]);
    }

    const model = new Model
      ( clip.state
      , clip.time
      , clip.version
      , clip.timeline
      , input
      );

    return model;
  }
