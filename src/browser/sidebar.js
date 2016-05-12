/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, thunk, forward, Effects} from 'reflex';
import * as Style from '../common/style';
import * as Toolbar from "./sidebar/toolbar";
import * as Tabs from "./sidebar/tabs";
import {merge, always} from "../common/prelude";
import {cursor} from "../common/cursor";
import * as Unknown from "../common/unknown";
import * as Stopwatch from "../common/stopwatch";
import * as Easing from "eased";
import * as Display from "./sidebar/display";


/*::
import type {Integer, Float} from "../common/prelude"
import type {Address, DOM} from "reflex"
import type {ID} from "./sidebar/tabs"
import * as Navigators from "./navigator-deck/deck"

export type Action =
  | { type: "CreateWebView" }
  | { type: "Attach" }
  | { type: "Detach" }
  | { type: "Open" }
  | { type: "Close" }
  | { type: "Activate" }
  | { type: "Animation"
    , action: Stopwatch.Action
    }
  | { type: "AnimationEnd" }
  | { type: "CloseTab"
    , id: Tabs.ID
    }
  | { type: "ActivateTab"
    , id: Tabs.ID
    }
  | { type: "Tabs"
    , source: Tabs.Action
    }
  | { type: "Toolbar"
    , source: Toolbar.Action
    }
*/





export class Model {
  /*::
  isAttached: boolean;
  isOpen: boolean;
  animation: Stopwatch.Model;
  display: Display.Model;
  toolbar: Toolbar.Model;
  */
  constructor(
    isAttached/*: boolean*/
  , isOpen/*: boolean*/
  , animation/*: Stopwatch.Model*/
  , display/*: Display.Model*/
  , toolbar/*: Toolbar.Model*/
  ) {
    this.isAttached = isAttached
    this.isOpen = isOpen
    this.animation = animation
    this.display = display
    this.toolbar = toolbar
  }
}


const styleSheet = Style.createSheet({
  base:
  { backgroundColor: '#272822'
  , height: '100%'
  , position: 'absolute'
  , right: 0
  , top: 0
  , width: '320px'
  , boxSizing: 'border-box'
  , zIndex: 2 // @TODO This is a hack to avoid resizing new tab / edit tab views.
  }
});


export const init = ()/*:[Model, Effects<Action>]*/ => {
  const [toolbar, fx] = Toolbar.init();
  const display = Display.closed;
  const model = new Model
  ( false
  , false
  , null
  , display
  , toolbar
  );

  return [model, fx.map(ToolbarAction)]
}

export const CreateWebView/*:Action*/ =
  { type: 'CreateWebView'
  };

export const Attach/*:Action*/ =
  {
    type: "Attach"
  };

export const Detach/*:Action*/ =
  { type: "Detach"
  };

export const Open/*:Action*/ = {type: "Open"};
export const Close/*:Action*/ = {type: "Close"};
export const Activate/*:Action*/ = {type: "Activate"};
export const CloseTab/*:(id:ID) => Action*/ =
  id =>
  ({type: "CloseTab", id});
export const ActivateTab/*:(id:ID) => Action*/ =
  id =>
  ({type: "ActivateTab", id});

const TabsAction = action =>
  (  action.type === "Close"
  ? CloseTab(action.id)
  : action.type === "Activate"
  ? ActivateTab(action.id)
  : { type: "Tabs"
    , source: action
    }
  );


const AnimationAction = action => ({type: "Animation", action});
const AnimationEnd = always({type: "AnimationEnd"});

const ToolbarAction = action =>
  ( action.type === "Attach"
  ? Attach
  : action.type === "Detach"
  ? Detach
  : action.type === "CreateWebView"
  ? CreateWebView
  : { type: "Toolbar"
    , source: action
    , action
    }
  );



const updateToolbar = cursor({
  get: model => model.toolbar,
  set: (model, toolbar) => merge(model, {toolbar}),
  tag: ToolbarAction,
  update: Toolbar.update
});

const updateStopwatch = cursor({
  tag: AnimationAction,
  get: model => model.animation,
  set: (model, animation) => merge(model, {animation}),
  update: Stopwatch.update
});

const interpolate = (from, to, progress) =>
  new Display.Model
  ( Easing.float(from.x, to.x, progress)
  , Easing.float(from.shadow, to.shadow, progress)
  , Easing.float(from.spacing, to.spacing, progress)
  , Easing.float(from.toolbarOpacity, to.toolbarOpacity, progress)
  , Easing.float(from.titleOpacity, to.titleOpacity, progress)
  , Easing.float(from.tabWidth, to.tabWidth, progress)
  )


const animationProjection = model =>
  ( model.isOpen
  ? Display.open
  : model.isAttached
  ? Display.attached
  : Display.closed
  );

const animationDuration = model =>
  ( model.isOpen
  ? 550
  : 200
  );


const updateAnimation = (model, action) => {
  const [{animation}, fx] = updateStopwatch(model, action.action)
  const duration = animationDuration(model)

  // @TODO: We should not be guessing what is the starnig point
  // that makes no sense & is likely to be incorrect at a times.
  // To fix it we need to ditch this easing library in favor of
  // something that will give us more like spring physics.
  const begin
    = !model.isOpen
    ? Display.open
    : model.isAttached
    ? Display.attached
    : Display.closed;

  const projection = animationProjection(model)


  return (animation && duration > animation.elapsed)
    ? [ new Model
        ( model.isAttached
        , model.isOpen
        , animation
        , Easing.ease
          ( Easing.easeOutCubic
          , interpolate
          , begin
          , projection
          , duration
          , animation.elapsed
          )
        , model.toolbar
        )
      , fx
      ]
    : [ new Model
        ( model.isAttached
        , model.isOpen
        , animation
        , projection
        , model.toolbar
        )
      , fx.map(AnimationEnd)
      ]
}

const open = model =>
  ( model.isOpen
  ? [ model, Effects.none ]
  : updateStopwatch(merge(model, {isOpen: true}), Stopwatch.Start)
  );

const close = model =>
  ( model.isOpen
  ? updateStopwatch(merge(model, {isOpen: false}), Stopwatch.Start)
  : [ model, Effects.none ]
  );

const attach = model =>
  ( model.isAttached
  ? [ model, Effects.none ]
  : updateToolbar(merge(model, {isAttached: true}), Toolbar.Attach)
  );

const detach = model =>
  ( model.isAttached
  ? updateToolbar(merge(model, {isAttached: false}), Toolbar.Detach)
  : [ model, Effects.none ]
  );

export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ =>
  ( action.type === "Open"
  ? open(model)
  : action.type === "Close"
  ? close(model)
  : action.type === "Attach"
  ? attach(model)
  : action.type === "Detach"
  ? detach(model)

  : action.type === "Animation"
  ? updateAnimation(model, action)
  : action.type === "AnimationEnd"
  ? updateStopwatch(model, Stopwatch.End)

  : action.type === "Toolbar"
  ? updateToolbar(model, action.source)

  : Unknown.update(model, action)
  );


export const render =
  ( model/*:Model*/
  , navigators/*:Navigators.Model*/
  , address/*:Address<Action>*/
  )/*:DOM*/ =>
  html.menu
  ( { key: 'sidebar'
    , className: 'sidebar'
    , style: Style.mix
      ( styleSheet.base
      , { transform: `translateX(${model.display.x}px)`
        , boxShadow: `rgba(0, 0, 0, ${model.display.shadow}) -50px 0 80px`
        , paddingLeft: `${model.display.spacing}px`
        , paddingRight: `${model.display.spacing}px`
        }
      )
  }, [
    Tabs.view
    ( navigators
    , forward(address, TabsAction, model.display)
    , model.display
    )
  , thunk
    ( 'sidebar-toolbar'
    , Toolbar.view
    , model.toolbar
    , forward(address, ToolbarAction)
    , model.display
    )
  ]);

export const view =
  ( model/*:Model*/
  , navigators/*:Navigators.Model*/
  , address/*:Address<Action>*/
  )/*:DOM*/ =>
  thunk
  ( 'Browser/Sidebar'
  , render
  , model
  , navigators
  , address
  );
