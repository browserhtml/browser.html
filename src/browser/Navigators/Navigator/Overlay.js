/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, html, thunk, forward} from "reflex";
import {merge, always, nofx} from "../../../common/prelude";
import {cursor} from "../../../common/cursor";
import * as Style from "../../../common/style";
import * as Easing from "eased";
import * as Animation from "../../../common/Animation"
import * as Unknown from "../../../common/unknown";
import * as Display from "./Overlay/Display"


import type {Address, DOM} from "reflex"
import type {Time} from "../../../common/prelude"

export type Flags = boolean

export type Action =
  | { type: "Click" }
  | { type: "Show" }
  | { type: "Hide" }
  | { type: "Animation", animation: Animation.Action }


export class Model {
  
  animation: Animation.Model<Display.Model>;
  isVisible: boolean;
  
  constructor(
    isVisible:boolean
  , animation:Animation.Model<Display.Model>
  ) {
    this.isVisible = isVisible;
    this.animation = animation;
  }
}

const Click = always({type: "Click"})
export const Show = {type: "Show"}
export const Hide = {type: "Hide"}

const tagAnimation =
  action =>
  ( { type: "Animation"
    , animation: action
    }
  );

export const init =
  ( isVisible:boolean=false
  ):[Model, Effects<Action>] => {
    const display =
      ( isVisible
      ? Display.visible
      : Display.invisible
      )
    const [animation, $animation] =
      Animation.init(display)

    const model = new Model
      ( isVisible
      , animation
      )

    const fx =
      $animation
      .map(tagAnimation)

    return [model, fx]
  }


export const update =
  (model:Model, action:Action):[Model, Effects<Action>] => {
    switch (action.type) {
      case "Animation":
        return updateAnimation(model, action.animation)
      case "Show":
        return show(model)
      case "Hide":
        return hide(model)
      case "Click":
        return nofx(model)
      default:
        return Unknown.update(model, action)
    }
  };

const show =
  ( model ) =>
  ( model.isVisible
  ? nofx(model)
  : startAnimation
    ( true
    , Animation.transition
      ( model.animation
      , Display.visible
      , 300
      )
    )
  )

const hide =
  ( model ) =>
  ( !model.isVisible
  ? nofx(model)
  : startAnimation
    ( false
    , Animation.transition
      ( model.animation
      , Display.invisible
      , 300
      )
    )
  )

const animate =
  (animation, action) =>
  Animation.updateWith
  ( Easing.easeOutQuad
  , Display.interpolate
  , animation
  , action
  )


const updateAnimation = cursor
  ( { get: model => model.animation
    , set:
      (model, animation) =>
      new Model
      ( model.isVisible
      , animation
      )
    , tag: tagAnimation
    , update: animate
    }
  )

const startAnimation =
  (isVisible, [animation, fx]) =>
  [ new Model
    ( isVisible
    , animation
    )
  , fx.map(tagAnimation)
  ]

export const render =
  ( model:Model
  , address:Address<Action>
  ):DOM =>
  html.div
  ( { className: 'overlay'
    , style: Style.mix
      ( styleSheet.base
      , ( model.isVisible
        ? styleSheet.visible
        : styleSheet.invisible
        )
      , { opacity: model.animation.state.opacity
        }
      )
    , onClick: forward(address, Click)
    }
  );


export const view =
  ( model:Model
  , address:Address<Action>
  ):DOM =>
  thunk
  ( 'Browser/NavigatorDeck/Navigator/Overaly'
  , render
  , model
  , address
  );

const styleSheet = Style.createSheet
  ( { base:
      { background: 'rgb(0, 0, 0)'
      , position: 'absolute'
      , width: '100vw'
      , height: '100vh'
      }
    , visible: null
    , invisible:
      { zIndex: -1
      }
    }
  )
