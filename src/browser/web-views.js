/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*:: import * as type from "../../type/browser/web-views" */

import {html, thunk, Effects, forward} from "reflex";
import * as Driver from "driver";
import {merge, setIn, remove, always, batch} from "../common/prelude";
import {cursor} from "../common/cursor";
import {indexOfOffset} from "../common/selector";
import * as WebView from "../browser/web-view";
import * as Unknown from "../common/unknown";
import * as Stopwatch from "../common/stopwatch";
import * as Easing from "eased";
import {Style, StyleSheet} from "../common/style";


// Model

// Returns true if model currently has no open web-views.
const isEmpty = model =>
  model.order.length === 0;


// # Actions

// ### Navigate WebView

export const NavigateTo/*:type.NavigateTo*/ = uri =>
  ({type: "NavigateTo", uri});

// ### Open WebView

export const Open/*:type.Open*/ = ({uri, inBackground, name, features}) =>
  ( { type: "Open"
    , options:
      { uri
      , inBackground: Boolean(inBackground)
      , name: name == null ? '' : name
      , features: features == null ? '' : features
      }
    }
  );


// ### Close WebView

export const CloseActive/*:type.CloseActive*/ =
  { type: "CloseActive"
  };

export const CloseByID/*:type.CloseByID*/ = id =>
  ( { type: "CloseByID"
    , id
    }
  );

const Closed/*:type.Closed*/ = id =>
  ( { type: "Closed"
    , id
    }
  );

// ### Select WebView

export const SelectByID/*:type.SelectByID*/ = id =>
  ( { type: "SelectByID"
    , id
    }
  );

const SelectRelative/*:type.SelectRelative*/ = offset =>
  ( { type: "SelectRelative"
    , offset
    }
  );

export const SelectNext = SelectRelative(1);
export const SelectPrevious = SelectRelative(-1);


const Selected/*:type.Selected*/ = id =>
  ( { type: "Selected"
    , id
    }
  );

// ### Activate WebView

export const ActivateSelected/*:type.ActivateSelected*/ =
  { type: "ActivateSelected"
  };

export const ActivateByID/*:type.ActivateByID*/ = id =>
  ( { type: "ActivateByID"
    , id
    }
  );

const Activated/*:type.Activated*/ = id =>
  ( { type: "Activated"
    , id
    }
  );


// ### Switch mode

export const Fold/*:type.Fold*/ = {type: "Fold"};
export const Folded/*:type.Folded*/ = {type: "Folded"};
export const Unfold/*:type.Unfold*/ = {type: "Unfold"};
export const Unfolded/*:type.Unfolded*/ = {type: "Unfolded"};

// ### Tag WebView Action

// Anotates `action` to target Active WebView
const ActiveWebViewAction = action =>
  ( { type: "ActiveWebView"
    , action
    }
  );

// Anotates `action` to target WebView with a given `id`. Some actions are
// not anotated instead they produce special actions recognized by this module.
const WebViewAction = (id, action) =>
  ( action.type === "Open!WithMyIFrameAndInTheCurrentTick"
  ? action
  : action.type === "Selected"
  ? Selected(id)
  : action.type === "Activated"
  ? Activated(id)
  : action.type === "Closed"
  ? Closed(id)
  : action.type === "Pushed"
  ? action
  : action.type === "ShowTabs"
  ? ShowTabs
  : action.type === "Create"
  ? Create
  : action.type === "Edit"
  ? Edit
  : { type: "WebView"
    , id
    , action
    }
  );

export const ActionByID = WebViewAction;


// Utility function for anotating specific actions to target a WebView with a
// give `id`.
const ByID =
  id =>
  action =>
  WebViewAction(id, action);


// Animation

const FoldAnimationAction = action =>
  ( { type: "FoldAnimation"
    , action
    }
  );


// Set of exposed actions that embedders can use to trigger certain actions.
// Note: Instead of defining action specifically for them we just anotate
// WebView actions to tagret active WebView to reduce a boilerplate.

export const ZoomIn = ActiveWebViewAction(WebView.ZoomIn);
export const ZoomOut = ActiveWebViewAction(WebView.ZoomOut);
export const ResetZoom = ActiveWebViewAction(WebView.ResetZoom);

export const Stop = ActiveWebViewAction(WebView.Stop);
export const Reload = ActiveWebViewAction(WebView.Reload);
export const GoBack = ActiveWebViewAction(WebView.GoBack);
export const GoForward = ActiveWebViewAction(WebView.GoForward);

export const Focus = ActiveWebViewAction(WebView.Focus);

export const ShowTabs = WebView.ShowTabs;
export const Create = WebView.Create;
export const Edit = WebView.Edit;


// # Update


export const init/*:type.init*/ = () =>
  [ { nextID: 0
    , selector: null
    , order: []
    , entries: {}
    , display: { depth: 0 }

    , resizeAnimation: null

    , foldAnimation: null
    , isFolded: true
    }
  , Effects.none
  ];


const updateByID = (model, id, action) => {
  if ( model.order.indexOf(id) < 0) {
    return (
      [ model
      , Effects.task(Unknown.error(`WebView with id: ${id} is not found`))
      ]
    );
  }
  else {
    const [entry, fx] = WebView.update(model.entries[id], action);
    return (
      [ merge(model, {entries: merge(model.entries, {[id]: entry})})
      , fx.map(ByID(id))
      ]
    );
  }
}

const updateActive = (model, action) =>
  ( isEmpty(model)
  ? [ model, Effects.none ]
  // Note: This case should never happen as there should be no active only
  // if there are no open WebViews. But we still handle and log error if
  // end up in such a broken state.
  : model.selector == null
  ? [ model
    , Effects.task(Unknown.error(`Can not update non-existing active WebView`))
    ]
  : updateByID(model, model.selector.active, action)
  );

// ### Navigate

const navigateTo = (model, uri) =>
  ( isEmpty(model)
  // If there are 0 web-views open we open a first one.
  ? open
    ( model
    , {uri, inBackground: false, name: '', features: '' }
    , false
    )
  // Otherwise we load given `uri` into active one.
  : load(model, uri)
  );

// ### Load

const load = (model, uri) =>
  updateActive(model, WebView.Load(uri));

// ### Open WebView

const open = (model, options, isForced=false) => {
  const id = model.nextID;
  const [ entry, initFX ] = WebView.init(id, options);

  // Create a intermidate state where new WebView entry is opened,
  // but selector has not being updated yet.
  const intermidate = merge
    ( model
    , { nextID: model.nextID + 1
      , order: [id, ...model.order]
      , entries: merge(model.entries, {[id]: entry})
      }
    );

  // Next state is a resulting state which matches intermidate state
  // cumputed earlier or it's a version with selection changes.
  const [ next, activateFX ] =
    ( options.inBackground
    ? [ intermidate, Effects.none ]
    : activateByID(intermidate, id)
    );

  return (
    [ next
    , Effects.batch
      ( [ initFX.map(ByID(id))
        , activateFX
        , ( isForced
          ? Driver.force
          : Effects.none
          )
        ]
      )
    ]
  )
};

// ### Close WebView

const closeActive = model =>
  ( isEmpty(model)
  ? [ model, Effects.none ]
  : model.selector == null
  ? [ model
    , Effects.task(Unknown.error(`Unable to close active WebView if none is Active`))
    ]
  : closeByID(model, model.selector.active)
  );

const closeByID = (model, id) =>
  ( isEmpty(model)
  ? [ model
    , Effects.task(Unknown.error(`Can not close by id: ${id} since there are 0 WebViews open`))
    ]
  : model.selector == null
  ? updateByID(model, id, WebView.Close)

  // If web-view being closed is currently active then we perform batch of
  // updates:
  // - Activate previous / next entry (next if it's first entry otheriwise
  //   previous).
  // - Delegate `WebView.Close` action to entry with a given `id`.
  // Note entry is not removed yet as we allow `WebView` module to perform
  // some tasks (like close animation) after which we expect `WebView.Closed`
  // action which is when we actually remove the entry.
  : model.selector.active === id
  ? batch
    ( update
    , model
    , [ ActivateByID
        ( model.order[0] === id
        ? model.order[1]
        : model.order[model.order.indexOf(id) - 1]
        )
      , WebViewAction(id, WebView.Close)
      ]
    )
  // If different WebView is being closed just delegate to it.
  : updateByID(model, id, WebView.Close)
  );

// @TODO: Properly handle edge case that may occur if close was requested but
// while closed action is received given web-view is activated back.
const removeByID = (model, id) =>
  [ merge
    ( model
    , { entries: merge(model.entries, {[id]: void(0)})
      , order: remove(model.order, model.order.indexOf(id))
      }
    )
  , ( model.order.length === 1
    ? Effects.receive(Create)
    : Effects.none
    )
  ];


// ### Activate WebView


const activateSelected = model =>
  ( isEmpty(model)
  ? [ model, Effects.none ]
  : model.selector == null
  ? [ model
    , Effects.task(Unknown.error(`Unable to activate selected WebView if no WebView is selected`))
    ]
  : activateByID(model, model.selector.selected)
  );

const activateByID = (model, id) =>
  ( isEmpty(model)
  ? [ model
    , Effects.task(Unknown.warn(`Can not activate web-view by id: ${id} since there are 0 web-views`))
    ]
  // If there was no selection we create new one and just delegate to an
  // appropriate web-view `WebView.Activate` action. Please not that in this
  // case there is no `WebView.Select`, `WebView.Unselect` or
  // `WebView.Deactivate` actions handled as selection did not existed before.
  // This is a case for the very first WebView that is opened, so for WebView
  // also is not going to get `WebView.Select` action.
  : model.selector == null
  ? updateByID
    ( merge(model, {selector: {selected: id, active: id}})
    , id
    , WebView.Activate
    )
  // If WebView being activated is already active still attempt to select
  // it in case seleciton was in the intermidate state.
  : model.selector.active === id
  ? selectByID(model, id)
  // If different WebView was active then we do batch of updates:
  // - Update selected WebView to match the WebView being activated (note that
  //   may do nothing if selected WebView already matches it or will cause
  //   update previously selected WebView with `WebView.Unselect` and will
  //   update WebView with given `id` with `WebView.Select`.
  // - Update active WebView with `WebView.Deactivate`.
  // - Update WebView with given `id` with `WebView.Activate`.
  : batch
    ( update
    , merge(model, {selector: merge(model.selector, {active: id})})
    , [ SelectByID(id)
      , WebViewAction(id, WebView.Activate)
      , WebViewAction(model.selector.active, WebView.Deactivate)
      ]
    )
  );


// ### Select WebView

const selectByOffset = (model, offset) =>
  ( isEmpty(model)
  ? [ model, Effects.none ]
  : model.selector == null
  ? [ model
    , Effects.task(Unknown.error(`Unable to change selected WebView if no WebView is seleted`))
    ]
  : selectByID
    ( model
    , model.order
      [ indexOfOffset
        ( model.order.indexOf(model.selector.selected)
        , offset
        , model.order.length
        , true
        )
      ]
    )
  );

const selectByID = (model, id) =>
  ( model.selector == null
  ? update
    ( merge(model, {selector: { selected: id, active: id } })
    , WebViewAction(id, WebView.Select)
    )
  : model.selector.selected !== id
  ? batch
    ( update
    , merge(model, { selector: merge(model.selector, { selected: id }) })
    , [ WebViewAction(id, WebView.Select)
      , WebViewAction(model.selector.selected, WebView.Unselect)
      ]
    )
  : [ model, Effects.none ]
  );

// Animations

const push = (model) =>
  ( model.isFolded
  // If model is folded, we should forward this action up a level.
  ? [ model, Effects.receive(ShowTabs) ]
  : [ model, Effects.none ]
  );

const fold = model =>
  ( model.isFolded
  ? [ model, Effects.none ]
  : startFoldAnimation(merge(model, {isFolded: true}))
  );

const unfold = model =>
  ( model.isFolded
  ? startFoldAnimation(merge(model, {isFolded: false}))
  : [ model, Effects.none ]
  );

const startFoldAnimation = model => {
  if (model.foldAnimation != null) {
    return (
      [ merge
        ( model
        , { foldAnimation: merge(model.foldAnimation, {elapsed: 0}) }
        )
      , Effects.none
      ]
    );
  }
  const [foldAnimation, fx] =
    Stopwatch.update(model.foldAnimation, Stopwatch.Start);
  return [merge(model, {foldAnimation}), fx.map(FoldAnimationAction)];
};

const endFoldAnimation = model => {
  const [foldAnimation, fx] =
    Stopwatch.update(model.foldAnimation, Stopwatch.End);

  return [ merge(model, {foldAnimation}), Effects.none ];
}

const folded = endFoldAnimation;
const unfolded = endFoldAnimation;

const updateFoldAnimation = (model, action) => {
  const [foldAnimation, fx] =
    Stopwatch.update(model.foldAnimation, action);

  const [begin, end, duration] =
    ( model.isFolded
    ? [ -200, 0, 200 ]
    : [ 0, -200, 500 ]
    );

  const result =
    ( duration > foldAnimation.elapsed
    ? [ merge
        ( model
        , { foldAnimation
          , display:
              merge
              ( model.display
              , { depth:
                  Easing.ease
                  ( Easing.easeOutCubic
                  , Easing.float
                  , begin
                  , end
                  , duration
                  , foldAnimation.elapsed
                  )
                }
              )
          }
        )
      , fx.map(FoldAnimationAction)
      ]
    : [ merge
        ( model
        , { foldAnimation
          , display: merge(model.display, {depth: end})
          }
        )
      , Effects.receive
        ( model.isFolded
        ? Folded
        : Unfolded
        )
      ]
    );

  return result;
}


export const update/*:type.update*/ = (model, action) =>
  ( action.type === "NavigateTo"
  ? navigateTo(model, action.uri)

  // Open web-view

  : action.type === "Open"
  ? open(model, action.options, false)
  : action.type === "Open!WithMyIFrameAndInTheCurrentTick"
  ? open(model, action.options, true)

  // Close web-view
  : action.type === "CloseActive"
  ? closeActive(model)

  : action.type === "CloseByID"
  ? closeByID(model, action.id)

  : action.type === "Closed"
  ? removeByID(model, action.id)

  : action.type === "Pushed"
  ? push(model)

  // Change activate web-view
  : action.type === "ActivateSelected"
  ? activateSelected(model)

  : action.type === "ActivateByID"
  ? activateByID(model, action.id)

  : action.type === "Activated"
  ? [ model, Effects.none ]

  // Change selected web-view
  : action.type === "SelectRelative"
  ? selectByOffset(model, action.offset)

  : action.type === "SelectByID"
  ? selectByID(model, action.id)

  // Currently we do nothing when selection has finished.
  : action.type === "Selected"
  ? [ model, Effects.none ]


  // Fold / Unfold animations
  : action.type === "Fold"
  ? fold(model)
  : action.type === "Unfold"
  ? unfold(model)
  : action.type === "FoldAnimation"
  ? updateFoldAnimation(model, action.action)
  : action.type === "Folded"
  ? folded(model)
  : action.type === "Unfolded"
  ? unfolded(model)

  // Delegate tagged action to one of the update functions.
  : action.type === "ActiveWebView"
  ? updateActive(model, action.action)

  : action.type === "WebView"
  ? updateByID(model, action.id, action.action)

  : Unknown.update(model, action)
  );



export const getActiveURI/*:type.getActiveURI*/ = (model, fallback=null) =>
  ( model.selector == null
  ? fallback
  : model.entries[model.selector.active] == null
  ? fallback
  : model.entries[model.selector.active].navigation.currentURI
  )


const styleSheet = StyleSheet.create({
  base: {
    // @TODO box shadow slows down animations significantly (Gecko)
    // boxShadow: '0 50px 80px rgba(0,0,0,0.25)',
    height: '100vh',
    width: '100vw',
    left: 0,
    overflow: 'hidden', // necessary to clip the radius
    position: 'absolute', // to position webviews relatively to stack
    top: 0,
    willChange: 'transform',
    transformOrigin: 'left center'
    // WARNING: will slow down animations! (Gecko)
    // xBorderRadius: '4px',
  }
});

export const view/*:type.view*/ = (model, address) =>
  html.div
  ( { className: 'webviews-stack'
    , style:
        Style
        ( styleSheet.base
        , { transform: `translate3d(0, 0, ${model.display.depth}px)`
          }
        )
    }
  , model
      .order
      .map(id =>
        thunk
        ( String(id)
        , WebView.view
        , model.entries[id]
        , forward(address, ByID(id)))));
