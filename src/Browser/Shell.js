/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, Task, html, thunk, forward} from "reflex";
import {merge, always} from "../Common/Prelude";
import {cursor} from "../Common/Cursor";
import * as Focusable from "../Common/Focus";
import * as Target from "../Common/Target";
import * as Runtime from "../Common/Runtime";
import * as Controls from "./Shell/Controls";
import * as Unknown from "../Common/Unknown";


import type {Address, DOM} from "reflex"
import type {Result} from "../Common/Result"

export type Model =
  { isFocused: boolean
  , isMinimized: boolean
  , isMaximized: boolean
  , controls: Controls.Model
  }

export type Action =
  | { type: "Focus" }
  | { type: "Blur" }
  | { type: "Close" }
  | { type: "Minimize" }
  | { type: "ToggleFullscreen" }
  | { type: "Closed"
    , result: Result<Error, void>
    }
  | { type: "Minimized"
    , result: Result<Error, void>
    }
  | { type: "FullscreenToggled"
    , result: Result<Error, void>
    }
  | { type: "Controls"
    , source: Controls.Action
    }



// @TODO: IO stuff should probably live elsewhere.
const fetchFocus =
  new Task((succeed, fail) => succeed(document.hasFocus()));

export const init =
  ():[Model, Effects<Action>] => {
  const [controls, fx] = Controls.init(false, false, false);
  return [
    ( { isFocused: false
      , isMinimized: false
      , isMaximized: false
      , controls: controls
      }
    )
  , Effects.batch
    ( [ fx.map(ControlsAction)
      , // Check if window is actually focused
        Effects
        .perform(fetchFocus)
        .map(isFocused => isFocused ? Focus : Blur)
      ]
    )
  ]
}

export const Focus:Action =
  { type: "Focus"
  };

export const Blur:Action =
  { type: "Blur"
  };

export const Close:Action =
  { type: "Close"
  };

export const Minimize:Action =
  { type: "Minimize"
  };

export const ToggleFullscreen:Action =
  { type: "ToggleFullscreen"
  };

const Closed = result =>
  ( { type: "Closed"
    , result
    }
  )

const Minimized = result =>
  ( { type: "Minimized"
    , result
    }
  );

const FullscreenToggled = result =>
  ( { type: "FullscreenToggled"
    , result
    }
  );


const ControlsAction = action =>
  ( action.type === 'CloseWindow'
  ? Close
  : action.type === 'MinimizeWindow'
  ? Minimize
  : action.type === 'ToggleWindowFullscreen'
  ? ToggleFullscreen
  : { type: "Controls"
    , source: action
    }
  );

const updateControls = cursor
  ( { get: model => model.controls
    , set: (model, controls) => merge(model, {controls})
    , update: Controls.update
    , tag: ControlsAction
    }
  );


const focus = model =>
  updateControls
  ( merge(model, {isFocused: true, isMinimized: false})
  , Controls.Enable
  );

const blur = model =>
  updateControls
  ( merge(model, {isFocused: false})
  , Controls.Disable
  );

const minimized = (model, result) =>
  ( result.isOk
  ? [ merge(model, {isMinimized: true}), Effects.none ]
  : [ model, Effects.perform(Unknown.error(result.error)) ]
  );

const fullscreenToggled = (model, result) =>
  ( result.isOk
  ? updateControls
    ( merge(model, {isMaximized: !model.isMaximized})
    , Controls.FullscreenToggled
    )
  : [ model, Effects.perform(Unknown.error(result.error)) ]
  );

const closed = (model, result) =>
  ( result.isOk
  ? [ model, Effects.none ]
  : [ model, Effects.perform(Unknown.error(result.error)) ]
  );

const close = model =>
  [ model
  , Effects
    .perform(Runtime.quit)
    .map(Closed)
  ];

const minimize = model =>
  [ model
  , Effects
    .perform(Runtime.minimize)
    .map(Minimized)
  ];

const toggleFullscreen = model =>
  [ model
  , Effects
    .perform(Runtime.toggleFullscreen)
    .map(FullscreenToggled)
  ];


export const update =
  (model:Model, action:Action):[Model, Effects<Action>] =>
  ( action.type === "Focus"
  ? focus(model)
  : action.type === "Blur"
  ? blur(model)

  : action.type === "Minimize"
  ? minimize(model)
  : action.type === "Minimized"
  ? minimized(model, action.result)

  : action.type === "Close"
  ? close(model)
  : action.type === "Closed"
  ? closed(model, action.result)

  : action.type === "ToggleFullscreen"
  ? toggleFullscreen(model)
  : action.type === "FullscreenToggled"
  ? fullscreenToggled(model, action.result)


  : action.type === "Controls"
  ? updateControls(model, action.source)

  : Unknown.update(model, action)
  );

export const render =
  (model:Model, address:Address<Action>):DOM => {
    if (!Runtime.useNativeTitlebar()) {
      return Controls.view(model.controls, forward(address, ControlsAction));
    } else {
      return html.noscript();
    }
  }

export const view =
  (model:Model, address:Address<Action>):DOM =>
  thunk
  ( "Browser/Shell"
  , render
  , model
  , address
  );
