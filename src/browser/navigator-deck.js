/* @flow */

import * as Deck from "./navigator-deck/deck"
import * as Animation from "../common/animation"
import * as Unknown from "../common/unknown"
import * as Display from "./navigator-deck/display"
import {Effects, html, forward, thunk} from "reflex"
import {cursor} from "../common/cursor"
import {always} from "../common/prelude"
import * as Style from "../common/style"
import * as Easing from "eased"
import * as Overlay from "./navigator-deck/Overlay"

/*::
import {performance} from "../common/performance"
import type {Address, DOM} from "reflex"

export type Action =
  | { type: "Expose" }
  | { type: "Focus" }
  | { type: "Shrink" }
  | { type: "Expand" }
  | { type: "ShowTabs" }
  | { type: "ShowWebView" }
  | { type: "GoBack" }
  | { type: "GoForward" }
  | { type: "Reload" }
  | { type: "ZoomIn" }
  | { type: "ZoomOut" }
  | { type: "ResetZoom" }
  | { type: "Animation", animation: Animation.Action }
  | { type: "Deck", deck: Deck.Action }
*/

export const Expose = { type: "Expose" }
export const Focus = { type: "Focus" }
export const Expand = { type: "Expand" }
export const Shrink = { type: "Shrink" }
export const ShowTabs = { type: "ShowTabs" }
export const ShowWebView = { type: "ShowWebView" }
export const GoBack = { type: "GoBack" }
export const GoForward = { type: "GoForward" }
export const Reload = { type: "Reload" }
export const ZoomOut = { type: "ZoomOut" }
export const ZoomIn = { type: "ZoomIn" }
export const ResetZoom = { type: "ResetZoom" }


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
  action => {
    switch (action.type) {
      case "ShowTabs":
        return ShowTabs;
      default:
        return { type: "Deck", deck: action };
    }
  }

const tagAnimation =
  action =>
  ( { type: "Animation"
    , animation: action
    }
  );

const tagOverlay = always(ShowWebView);


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
      case "ShowTabs":
        return updateDeck(model, Deck.ShowTabs);
      case "GoBack":
        return updateDeck(model, Deck.GoBack);
      case "GoForward":
        return updateDeck(model, Deck.GoForward);
      case "Reload":
        return updateDeck(model, Deck.Reload);
      case "ZoomIn":
        return updateDeck(model, Deck.ZoomIn);
      case "ZoomOut":
        return updateDeck(model, Deck.ZoomOut);
      case "ResetZoom":
        return updateDeck(model, Deck.ResetZoom);
      case "Focus":
        return focus(model, performance.now());
      case "Expose":
        return expose(model, performance.now());
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

const focus =
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

const expose =
  ( model, now ) =>
  ( model.zoom
  ? startAnimation
    ( false
    , model.shrink
    , model.deck
    , Animation.transition
      ( model.animation
      , ( model.shrink
        ? Display.exposeShrinked
        : Display.expose
        )
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
  : startAnimation
    ( true
    , true
    , model.deck
    , Animation.transition
      ( model.animation
      , Display.shrinked
      , 200
      , now
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
  ( { className: 'navigator-deck'
    , style:
        Style.mix
        ( styleSheet.base
        , { borderRight: `solid transparent ${model.animation.state.rightOffset}px`
          , transform: `translate3d(0, 0, ${model.animation.state.depth}px)`
          }
        )
    }
  , [ Overlay.view
      ( model.zoom === false
      , forward(address, tagOverlay)
      )
    ].concat
    ( Deck.renderCards
      ( model.deck
      , forward(address, tagDeck)
      )
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
      , height: '100%'
      , width: '100%'
      , willChange: 'transform, border-right'
      , top: 0
      , left: 0
      , overflow: 'hidden'
      , transformOrigin: 'left center'
      , boxSizing: 'border-box'
      }
    }
  )
