/* @flow */

import * as Deck from "../common/Deck"
import * as Animation from "../common/Animation"
import * as Unknown from "../common/unknown"
import * as Display from "./Navigators/Display"
import {Effects, html, forward, thunk} from "reflex"
import {cursor} from "../common/cursor"
import {always} from "../common/prelude"
import * as Style from "../common/style"
import * as Easing from "eased"
import * as Overlay from "./Navigators/Overlay"
import * as Navigator from "./Navigators/Navigator"
import * as URI from "../common/url-helper";
import * as Tabs from "./Sidebar/Tabs";

/*::
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
  | { type: "Close" }
  | { type: "EditInput" }
  | { type: "OpenNewTab" }
  | { type: "SelectNext" }
  | { type: "SelectPrevious" }
  | { type: "Animation", animation: Animation.Action }
  | { type: "Tabs", tabs: Tabs.Action }
  | { type: "Deck", deck: Deck.Action<Navigator.Action, Navigator.Flags> }
*/

export const Expose = { type: "Expose" }
export const Focus = { type: "Focus" }
export const Expand = { type: "Expand" }
export const Shrink = { type: "Shrink" }
export const ShowTabs = { type: "ShowTabs" }
export const ShowWebView = { type: "ShowWebView" }
export const OpenNewTab = { type: "OpenNewTab" };
export const GoBack = { type: "GoBack" }
export const GoForward = { type: "GoForward" }
export const Reload = { type: "Reload" }
export const ZoomOut = { type: "ZoomOut" }
export const ZoomIn = { type: "ZoomIn" }
export const ResetZoom = { type: "ResetZoom" }
export const EditInput = { type: "EditInput" }
export const SelectNewTab = { type: "Select", id: "0" };
export const SelectNext = { type: "SelectNext" }
export const SelectPrevious = { type: "SelectPrevious" }
export const Close = { type: "Close" }

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

const nofx =
  model =>
  [ model
  , Effects.none
  ]

const Card =
  { init: Navigator.init
  , update: Navigator.update
  , close: Navigator.close
  , select: Navigator.select
  , deselect: Navigator.deselect
  }


const tagDeck =
  (action/*:Deck.Action<Navigator.Action, Navigator.Flags>*/)/*:Action*/ => {
    switch (action.type) {
      case "Modify":
        switch (action.modify.type) {
          case "ShowTabs":
            return ShowTabs;
          case "OpenNewTab":
            return OpenNewTab;
          case "Open":
            return {
              type: "Deck"
            , deck: action.modify
            }
          case "Select":
            return {
              type: "Deck"
            , deck:
              { type: "Select"
              , id: action.id
              }
            }
          case "Closed":
            return {
              type: "Deck"
            , deck:
              { type: "Remove"
              , id: action.id
              }
            }
        }
      default:
        return {
          type: "Deck"
        , deck: action
        };
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
    const flags =
      { input:
        { value: ''
        , isVisible: true
        , isFocused: true
        }

        , output:
        { uri: URI.read('about:newtab')
        , disposition: 'default'
        , name: 'about:newtab'
        , features: ''
        , ref: null
        , guestInstanceId: null
        }
      , assistant: true
      , overlay: true
      , isPinned: true
      , isInputEmbedded: true
      }

    const [deck, $deck] = Deck.init();
    const [deck2, $deck2] = Deck.open
      ( Card
      , deck
      , flags
      )

    const display =
      ( shrink
      ? Display.shrinked
      : zoom
      ? Display.normal
      : Display.expose
      )

    const [animation, $animation] = Animation.init(display);
    const model = new Model(zoom, shrink, deck2, animation);
    const fx = Effects.batch
      ( [ $deck.map(tagDeck)
        , $deck2.map(tagDeck)
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
      case "SelectNext":
        return selectNext(model);
      case "SelectPrevious":
        return selectPrevious(model);
      case "Close":
        return close(model);
      case "ShowTabs":
        return nofx(model);
      case "OpenNewTab":
        return openNewTab(model);
      case "GoBack":
        return updateSelected(model, Navigator.GoBack);
      case "GoForward":
        return updateSelected(model, Navigator.GoForward);
      case "Reload":
        return updateSelected(model, Navigator.Reload);
      case "ZoomIn":
        return updateSelected(model, Navigator.ZoomIn);
      case "ZoomOut":
        return updateSelected(model, Navigator.ZoomOut);
      case "ResetZoom":
        return updateSelected(model, Navigator.ResetZoom);
      case "EditInput":
        return updateSelected(model, Navigator.EditInput);
      case "Focus":
        return focus(model);
      case "Expose":
        return expose(model);
      case "Shrink":
        return shrink(model);
      case "Expand":
        return expand(model);
      case "Tabs":
        return updateTabs(model, action.tabs);
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

const openNewTab =
  model =>
  updateDeck
  ( model
  , SelectNewTab
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
    , update:
        (model, action) =>
        Deck.update(Card, model, action)
    }
  )

const updateTabs =
  (model, action) =>
  // Flow inference seems to fail here, so we just make it believe
  // that we restructured action so it will suceed inferring.
  (/*::
    action.type === "Modify"
  ? updateDeck
    ( model
    , { type: "Modify"
      , id: action.id
      , modify:
        { type: "Tab"
        , tab: action.modify.tab
        }
      }
    )
  :*/updateDeck(model, action)
  )

const selectNext =
  model =>
  updateDeck(model, SelectNext)

const selectPrevious =
  model =>
  updateDeck(model, SelectPrevious)

const updateSelected =
  (model, action) =>
  ( model.deck.selected == null
  ? nofx(model)
  : updateDeck
    ( model
    , { type: "Modify"
      , id: model.deck.selected
      , modify: action
      }
    )
  )

const close =
  (model, action) =>
  ( model.deck.selected == null
  ? nofx(model)
  : updateDeck
    ( model
    , { type: "Close"
      , id: model.deck.selected
      }
    )
  )

const focus =
  ( model ) =>
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
      )
    )
  )

const expose =
  ( model ) =>
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
      )
    )
  : nofx(model)
  )

const shrink =
  ( model ) =>
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
      )
    )
  )

const expand =
  ( model ) =>
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
      ( Navigator.render
      , model.deck
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
