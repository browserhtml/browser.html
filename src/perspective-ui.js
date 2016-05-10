/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, Task} from 'reflex';
import {merge, batch} from './common/prelude';
import * as Browser from './browser';
import * as Unknown from "./common/unknown";

/*::
import type {Address, DOM} from "reflex"
import type {Model, Action} from "./perspective-ui"
*/


export const LiveReload = Browser.LiveReload;

export const init = Browser.init

export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ =>
  ( model.mode === 'create-web-view'
  ? ( action.type === 'ExitInput'
    ? ( model.webViews.order.length > 0
      ? Browser.update(model, Browser.ShowWebView)
      : [ model, Effects.none ]
      )
    // If uri is submitted in create-web-view mode then
    // opne new web-view.
    : action.type === 'SubmitInput'
    ? batch
      ( Browser.update
      , model
      , [ Browser.OpenWebView
        , Browser.ShowWebView
        ]
      )
    // Focus input when window regains focuse in create mode.
    : action.type === 'Focus'
    ? batch
      ( Browser.update
      , model
      , [ action
        , Browser.FocusInput
        ]
      )

    // @TODO: Retaining a focus is little tricky (see #803)
    // Prevent input lost focus in create-web-view mode set it back.
    // : action.type === 'BlurInput'
    // ? [ model, Effects.perform(Task.requestAnimationFrame().map(_ => Browser.FocusInput)) ]

    // On ever other action just delegate.
    : Browser.update(model, action)
  )
  : model.mode === 'edit-web-view'
  ? ( action.type === 'ExitInput'
    ? Browser.update(model, Browser.ShowWebView)
    // When overlay is clicked show web-view.
    : action.type === 'OverlayClicked'
    ? Browser.update(model, Browser.ShowWebView)
    // When input is submitted delegate & show web-view.
    : action.type === 'SubmitInput'
    ? batch
      ( Browser.update
      , model
      , [ action
        , Browser.ShowWebView
        ]
      )
    // Focus input when window regains focus in edit mode.
    : action.type === 'Focus'
    ? batch
      ( Browser.update
      , model
      , [ action
        , Browser.FocusInput
        ]
      )
    // One every other action just delegate.
    : Browser.update(model, action)
    )
  : model.mode === 'show-web-view'
    // On escape key in show-web-view mode switch to show-tabs mode.
  ? ( action.type === 'Escape'
    ? Browser.update(model, Browser.ShowTabs)
    // When tab is selected in show-web-view mode activate
    // select-web-view mode & delegate original action.
    : action.type === 'SelectTab'
    ? batch
      ( Browser.update
      , model
      , [ action
        , Browser.SelectWebView
        ]
      )
    : action.type === 'Focus'
    ? batch
      ( Browser.update
      , model
      , [ action
        , Browser.FocusWebView
        ]
      )
    // On anything else just delegate.
    : Browser.update(model, action)
    )
  : model.mode === 'show-tabs'
  ? ( action.type === 'Escape'
    ? Browser.update(model, Browser.ShowWebView)
    : action.type === 'FocusWebView'
    ? Browser.update(model, Browser.ShowWebView)
    : action.type === 'OverlayClicked'
    ? Browser.update(model, Browser.ShowWebView)
    : action.type === 'ActivateTabByID'
    ? batch
      ( Browser.update
      , model
      , [ action
        , Browser.ShowWebView
        ]
      )
    : action.type === 'SelectTab'
    ? batch
      ( Browser.update
      , model
      , [ action
        , Browser.SelectWebView
        ]
      )
    : Browser.update(model, action)
    )
  : model.mode === 'select-web-view'
  ? ( action.type === 'ActivateTab'
    ? batch
      ( Browser.update
      , model
      , [ action
        , Browser.ShowWebView
        ]
      )
    : Browser.update(model, action)
    )
  : Unknown.update(model, action)
  );


export const view = Browser.view;
