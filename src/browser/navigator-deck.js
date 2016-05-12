/* @flow */

import * as Deck from "./navigator-deck/deck"
import * as Animation from "../common/animation"
import * as Unknown from "../common/unknown"
import * as Display from "./navigator-deck/display"
import {Effects, html, forward, thunk} from "reflex"
import {cursor} from "../common/cursor"
import * as Style from "../common/style"
import * as Easing from "eased"

/*::
import {performance} from "../common/performance"
import type {Address, DOM} from "reflex"

export type Action =
  | { type: "ZoomOut" }
  | { type: "ZoomIn" }
  | { type: "Shrink" }
  | { type: "Expand" }
  | { type: "Animation", animation: Animation.Action }
  | { type: "Deck", deck: Deck.Action }
*/

export const ZoomOut = { type: "ZoomOut" }
export const ZoomIn = { type: "ZoomIn" }


export class Model {
  /*::
  zoom: boolean;
  shrink: boolean;
  deck: Deck.Model;
  animation: Animation.Model<Display.Model>;
  */
  constructor(
    zoom/*:boolean*/
  , shrink/*:boolean*/
  , deck/*:Deck.Model*/
  , animation/*:Animation.Model<Display.Model>*/
  ) {
    this.zoom = zoom;
    this.shrink = shrink;
    this.deck = deck;
    this.animation = animation;
  }
}

const tagDeck =
  (action) =>
  ( { type: "Deck"
    , deck: action
    }
  )

const tagAnimation =
  action =>
  ( { type: "Animation"
    , animation: action
    }
  );


export const init =
  ( zoom/*:boolean*/=true
  , shrink/*:boolean*/=false
  )/*:[Model, Effects<Action>]*/ => {
    const [deck, $deck] = Deck.initWithNewTab();
    const display =
      ( shrink
      ? Display.shrinked
      : zoom
      ? Display.normal
      : Display.expose
      )

    const [animation, $animation] = Animation.init(display);
    const model = new Model(zoom, shrink, deck, animation);
    const fx = Effects.batch
      ( [ $deck.map(tagDeck)
        , $animation.map(tagAnimation)
        ]
      )
    return [model, fx]
  }

export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ => {
    switch (action.type) {
      case "Animation":
        return updateAnimation(model, action.animation);
      case "Deck":
        return updateDeck(model, action.deck);
      case "ZoomIn":
        return zoomIn(model, performance.now());
      case "ZoomOut":
        return zoomOut(model, performance.now());
      case "Shrink":
        return shrink(model, performance.now());
      case "Expand":
        return expand(model, performance.now());
      default:
        return Unknown.update(model, action);
    }
  }

const animate =
  (animation, action) =>
  Animation.updateWith
  ( Easing.easeOutCubic
  , Display.interpolate
  , animation
  , action
  )

const updateAnimation = cursor
  ( { get: model => model.animation
    , set:
      (model, animation) =>
      new Model
      ( model.zoom
      , model.shrink
      , model.deck
      , animation
      )
    , tag: tagAnimation
    , update: animate
    }
  )


const updateDeck = cursor
  ( { get: model => model.deck
    , set:
      (model, deck) =>
      new Model
      ( model.zoom
      , model.shrink
      , deck
      , model.animation
      )
    , tag: tagDeck
    , update: Deck.update
    }
  )

const zoomIn =
  ( model, now ) =>
  ( model.zoom
  ? nofx(model)
  : startAnimation
    ( true
    , model.shrink
    , model.deck
    , Animation.transition
      ( model.animation
      , ( model.shrink
        ? Display.shrinked
        : Display.normal
        )
      , 200
      , now
      )
    )
  )

const zoomOut =
  ( model, now ) =>
  ( model.zoom
  ? startAnimation
    ( false
    , model.shrink
    , model.deck
    , Animation.transition
      ( model.animation
      , Display.expose
      , 500
      , now
      )
    )
  : nofx(model)
  )

const shrink =
  ( model, now ) =>
  ( model.shrink
  ? nofx(model)
  : model.zoom
  ? startAnimation
    ( model.zoom
    , true
    , model.deck
    , Animation.transition
      ( model.animation
      , Display.shrinked
      , 200
      , now
      )
    )
  : nofx
    ( new Model
      ( model.zoom
      , true
      , model.deck
      , model.animation
      )
    )
  )

const expand =
  ( model, now ) =>
  ( !model.shrink
  ? nofx(model)
  : model.zoom
  ? startAnimation
    ( model.zoom
    , false
    , model.deck
    , Animation.transition
      ( model.animation
      , Display.normal
      , 200
      , now
      )
    )
  : nofx
    ( new Model
      ( model.zoom
      , false
      , model.deck
      , model.animation
      )
    )
  )

const startAnimation =
  (zoom, shrink, deck, [animation, fx]) =>
  [ new Model
    ( zoom
    , shrink
    , deck
    , animation
    )
  , fx.map(tagAnimation)
  ]

const nofx =
  model =>
  [ model
  , Effects.none
  ]


export const render =
  ( model/*:Model*/
  , address/*:Address<Action>*/
  )/*:DOM*/ =>
  html.div
  ( { className: 'navigator-stack'
    , style:
        Style.mix
        ( styleSheet.base
        , { width: `calc(100vw - ${model.animation.state.rightOffset}px)`
          , transform: `translate3d(0, 0, ${model.animation.state.depth}px)`
          }
        )
    }
  , Deck.renderCards
    ( model.deck
    , forward(address, tagDeck)
    )
  )

export const view =
  ( model/*:Model*/
  , address/*:Address<Action>*/
  )/*:DOM*/ =>
  thunk
  ( 'Browser/NavigatorDeck'
  , render
  , model
  , address
  )

const styleSheet = Style.createSheet
  ( { base:
      { position: 'absolute'
      , perspective: '1000px'
      , height: '100vh'
      , width: '100vw'
      }
    }
  )
