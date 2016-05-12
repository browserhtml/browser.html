/* @flow */

import * as Unknown from "./unknown"
import {Task, Effects} from "reflex"
import {ease} from "eased"

/*::
export type Time = number
export type Action =
  | { type: "Tick", time: Time }

import type {Interpolation, Easing} from "eased"
*/

class Transition /*::<model>*/ {
  /*::
  duration: Time;
  now: Time;
  elapsed: Time;
  from: model;
  to: model;
  */
  constructor(
    from/*:model*/
  , to/*:model*/
  , now/*:Time*/
  , elapsed/*:Time*/
  , duration/*:Time*/
  ) {
    this.from = from
    this.to = to
    this.now = now
    this.elapsed = elapsed
    this.duration = duration
  }
}

export class Model /*::<model>*/ {
  /*::
  state: model;
  transition: ?Transition<model>;
  */
  constructor(
    state/*:model*/
  , transition/*:?Transition<model>*/
  ) {
    this.state = state
    this.transition = transition
  }
}

export const transition = /*::<action, model>*/
  ( model/*:Model<model>*/
  , to/*:model*/
  , duration/*:Time*/
  , now/*:Time*/
  )/*:[Model<model>, Effects<Action>]*/ =>
  ( model.transition == null
  ? fx
    ( startTranstion
      ( model.state
      , to
      , 0
      , duration
      , now
      )
    )
  : model.transition.to === to
  ? nofx(model)
  : fx
    ( startTranstion
      ( model.state
      , to
      , duration - (duration * model.transition.elapsed / model.transition.duration)
      , duration
      , now
      )
    )
  )

const nofx = /*::<model, action>*/
  (model/*:model*/)/*:[model, Effects<action>]*/ =>
  [model, Effects.none]

const fx = /*::<model>*/
  (model/*:model*/)/*:[model, Effects<Action>]*/ =>
  [ model
  , ( model.transition == null
    ? Effects.none
    : Effects.perform
      (Task.requestAnimationFrame().map(Tick))
    )
  ]

const Tick =
  time =>
  ( { type: "Tick"
    , time
    }
  );


const startTranstion = /*::<model>*/
  ( from/*:model*/
  , to/*:model*/
  , elapsed/*:Time*/
  , duration/*:Time*/
  , now/*:Time*/
  )/*:Model<model>*/ =>
  new Model
  ( from
  , new Transition
    ( from
    , to
    , now
    , elapsed
    , duration
    , now
    )
  )

const endTransition = /*::<model>*/
  ( model/*:Model<model>*/
  )/*:Model<model>*/ =>
  new Model
  ( model.state
  , null
  );

const tickTransitionWith = /*::<model>*/
  ( easing/*:Easing*/
  , interpolation/*:Interpolation<model>*/
  , model/*:Model<model>*/
  , now/*Time*/
  )/*:Model<model>*/ =>
  ( model.transition == null
  ? model
  : interpolateTransitionWith
    ( easing
    , interpolation
    , model.transition
    , now - model.transition.now + model.transition.elapsed
    , now
    )
  )

const interpolateTransitionWith = /*::<model>*/
  ( easing/*:Easing*/
  , interpolation/*:Interpolation<model>*/
  , transition/*:Transition<model>*/
  , elapsed/*:Time*/
  , now/*:Time*/
  )/*:Model<model>*/ =>
  ( elapsed >= transition.duration
  ? new Model(transition.to, null)
  : new Model
    ( ease
      ( easing
      , interpolation
      , transition.from
      , transition.to
      , transition.duration
      , elapsed
      )
    , new Transition
      ( transition.from
      , transition.to
      , now
      , elapsed
      , transition.duration
      )
    )
  )

export const updateWith = /*::<model>*/
  ( easing/*:Easing*/
  , interpolation/*:Interpolation<model>*/
  , model/*:Model<model>*/
  , action/*:Action*/
  )/*:[Model<model>, Effects<Action>]*/ => {
    switch (action.type) {
      case "Tick":
        return fx(tickTransitionWith(easing, interpolation, model, action.time));
      default:
        return Unknown.update(model, action);
    }
  }

export const init = /*::<model>*/
  ( state/*:model*/ )/*:[Model<model>, Effects<Action>]*/ =>
  nofx(new Model(state, null))
