/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, thunk, forward, Effects} from 'reflex';
import * as Style from '../common/style';
import * as Toolbar from "./Sidebar/Toolbar";
import * as Tabs from "./Sidebar/Tabs";
import {merge, always} from "../common/prelude";
import {cursor} from "../common/cursor";
import * as Unknown from "../common/unknown";
import * as Easing from "eased";
import * as Display from "./Sidebar/Display";
import * as Animation from "../common/Animation";


/*::
import type {Integer, Float} from "../common/prelude"
import type {Address, DOM} from "reflex"
import type {ID} from "./Sidebar/Tabs"
import * as Navigator from "./Navigators/Navigator"
import * as Deck from "../common/Deck"

export type Action =
  | { type: "CreateWebView" }
  | { type: "Attach" }
  | { type: "Detach" }
  | { type: "Expand" }
  | { type: "Collapse" }
  | { type: "Activate" }
  | { type: "Animation", animation: Animation.Action }
  | { type: "Tabs", tabs: Tabs.Action }
  | { type: "Toolbar", toolbar: Toolbar.Action }
*/





export class Model {
  
  isAttached: boolean;
  isExpanded: boolean;
  animation: Animation.Model<Display.Model>;
  toolbar: Toolbar.Model;
  
  constructor(
    isAttached: boolean
  , isExpanded: boolean
  , toolbar: Toolbar.Model
  , animation: Animation.Model<Display.Model>
  ) {
    this.isAttached = isAttached
    this.isExpanded = isExpanded
    this.animation = animation
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
  , overflow: 'hidden'
  }
});


export const init =
  ( isAttached:boolean = false
  , isExpanded:boolean = false
  ):[Model, Effects<Action>] => {
    const display =
      ( isExpanded
      ? Display.expanded
      : isAttached
      ? Display.attached
      : Display.collapsed
      );

    const [toolbar, $toolbar] = Toolbar.init();
    const [animation, $animation] = Animation.init(display, null);

    const model = new Model
    ( isAttached
    , isExpanded
    , toolbar
    , animation
    );

    const fx = Effects.batch
    ( [ $toolbar.map(tagToolbar)
      , $animation.map(tagAnimation)
      ]
    )

    return [model, fx]
  }

export const CreateWebView:Action =
  { type: 'CreateWebView'
  };

export const Attach:Action =
  {
    type: "Attach"
  };

export const Detach:Action =
  { type: "Detach"
  };

export const Expand:Action = {type: "Expand"};
export const Collapse:Action = {type: "Collapse"};

const tagTabs =
  action => {
    switch (action.type) {
      default:
        return {
          type: "Tabs"
        , tabs: action
        }
    }
  };


const tagToolbar =
  action => {
    switch (action.type) {
      case "Attach":
        return Attach;
      case "Detach":
        return Detach;
      case "CreateWebView":
        return CreateWebView;
      default:
        return {
          type: "Toolbar"
        , toolbar: action
        , action
        }
    }
  };

const tagAnimation =
  action =>
  ( { type: "Animation"
    , animation: action
    }
  );

const animate =
  (animation, action) =>
  Animation.updateWith
  ( Easing.easeOutCubic
  , Display.interpolate
  , animation
  , action
  )


const updateToolbar = cursor
  ( { get: model => model.toolbar
    , set:
      (model, toolbar) => new Model
      ( model.isAttached
      , model.isExpanded
      , toolbar
      , model.animation
      )
    , tag: tagToolbar
    , update: Toolbar.update
    }
  );

const updateAnimation = cursor
  ( { get: model => model.animation
    , set:
      (model, animation) =>
      new Model
      ( model.isAttached
      , model.isExpanded
      , model.toolbar
      , animation
      )
    , tag: tagAnimation
    , update: animate
    }
  )

const nofx = /*::<model, action>*/
  (model:model):[model, Effects<action>] =>
  [ model
  , Effects.none
  ]

const startAnimation =
  (isAttached, isExpanded, toolbar, [animation, fx]) =>
  [ new Model
    ( isAttached
    , isExpanded
    , toolbar
    , animation
    )
  , fx.map(tagAnimation)
  ]


const expand =
  ( model ) =>
  ( model.isExpanded
  ? nofx(model)
  : startAnimation
    ( model.isAttached
    , true
    , model.toolbar
    , Animation.transition
      ( model.animation
      , Display.expanded
      , 550
      )
    )
  );

const collapse =
  (model:Model) =>
  ( !model.isExpanded
  ? nofx(model)
  : startAnimation
    ( model.isAttached
    , false
    , model.toolbar
    , Animation.transition
      ( model.animation
      , ( model.isAttached
        ? Display.attached
        : Display.collapsed
        )
      , 200
      )
    )
  );

const attach =
  ( model ) =>
  ( model.isAttached
  ? nofx(model)
  : assemble
    ( true
    , false
    , Toolbar.update(model.toolbar, Toolbar.Attach)
    , Animation.transition
      ( model.animation
      , Display.attached
      , ( model.isExpanded
        ? 200
        : 100
        )
      )
    )
  )

const detach =
  ( model ) =>
  ( !model.isAttached
  ? nofx(model)
  : assemble
    ( false
    , model.isExpanded
    , Toolbar.update(model.toolbar, Toolbar.Detach)
    , ( model.isExpanded
      ? nofx(model.animation)
      : Animation.transition
        ( model.animation
        , Display.collapsed
        , ( model.isExpanded
          ? 200
          : 100
          )
        )
      )
    )
  );

const assemble =
  ( isAttached
  , isExpanded
  , [toolbar, $toolbar]
  , [animation, $animation]
  ) =>
  [ new Model
    ( isAttached
    , isExpanded
    , toolbar
    , animation
    )
  , Effects.batch
    ( [ $toolbar.map(tagToolbar)
      , $animation.map(tagAnimation)
      ]
    )
  ]

export const update =
  (model:Model, action:Action):[Model, Effects<Action>] => {
    switch (action.type) {
      case "Expand":
        return expand(model);
      case "Collapse":
        return collapse(model);
      case "Attach":
        return attach(model);
      case "Detach":
        return detach(model);

      case "Animation":
        return updateAnimation(model, action.animation);
      case "Toolbar":
        return updateToolbar(model, action.toolbar);

      default:
        return Unknown.update(model, action);
    }
  };


export const render =
  ( model:Model
  , navigators:Deck.Model<Navigator.Model>
  , address:Address<Action>
  ):DOM =>
  html.menu
  ( { key: 'sidebar'
    , className: 'sidebar'
    , style: Style.mix
      ( styleSheet.base
      , styleAnimation(model.animation.state)
      )
    }
  , [ Tabs.view
      ( navigators
      , forward(address, tagTabs)
      , model.animation.state
      )
    , thunk
      ( 'sidebar-toolbar'
      , Toolbar.view
      , model.toolbar
      , forward(address, tagToolbar)
      , model.animation.state
      )
    ]
  );

export const view =
  ( model:Model
  , navigators:Deck.Model<Navigator.Model>
  , address:Address<Action>
  ):DOM =>
  thunk
  ( 'Browser/Sidebar'
  , render
  , model
  , navigators
  , address
  );

const styleAnimation =
  ({x, shadow, spacing}) =>
  ( { transform: `translateX(${x}px)`
    , boxShadow: `rgba(0, 0, 0, ${shadow}) -50px 0 80px`
    , paddingLeft: `${spacing}px`
    , paddingRight: `${spacing}px`
    }
  )
