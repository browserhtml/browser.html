/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {version} from "../../package.json";
import * as Config from "../../browserhtml.json";
import {Effects, html, forward, thunk} from "reflex";

import * as Shell from "./shell";
import * as Assistant from "./assistant";
import * as Sidebar from './sidebar';
import * as WebView from "./web-view";
import * as WebViews from "./web-views";
import * as Overlay from './overlay';
import * as Input from "./input";
import * as Devtools from "../common/devtools";
import * as Runtime from "../common/runtime";
import * as URI from '../common/url-helper';
import * as Unknown from "../common/unknown";
import * as Focusable from "../common/focusable";
import * as OS from '../common/os';
import * as Keyboard from '../common/keyboard';
import * as Stopwatch from "../common/stopwatch";
import * as Easing from "eased";
import {merge, always, batch, tag, tagged} from "../common/prelude";
import {cursor} from "../common/cursor";
import {Style, StyleSheet} from '../common/style';

import {identity, compose} from "../lang/functional";

import {onWindow} from "driver";

/*:: import * as type from "../../type/browser/browser" */

export const init/*:type.init*/ = () => {
  const [devtools, devtoolsFx] = Devtools.init({isActive: Config.devtools});
  const [shell, shellFx] = Shell.init();
  const [webViews, webViewsFx] = WebViews.initWithWebView
    // @TODO in future we should read about:newtab closer to the iframe
    ( { uri: URI.read('about:newtab')
      , name: ''
      , features: ''
      , inBackground: false
      }
    );
  const [sidebar, sidebarFx] = Sidebar.init();

  const model =
    { version
    , mode: 'create-web-view'
    , shell
    , webViews
    , sidebar
    , devtools

    , display: { rightOffset: 0 }
    , isExpanded: true
    };

  const fx =
    Effects.batch
    ( [ devtoolsFx.map(DevtoolsAction)
      , shellFx.map(ShellAction)
      , webViewsFx.map(WebViewsAction)
      , sidebarFx.map(SidebarAction)
      , Effects.receive(CreateWebView)
      , Effects
        .task(Runtime.receive('mozbrowseropenwindow'))
        .map(OpenURL)
      ]
    );

  return [model, fx];
}

const SidebarAction = action =>
  ( action.type === "CreateWebView"
  ? CreateWebView
  : action.type === "ActivateTab"
  ? ActivateWebViewByID(action.id)
  : action.type === "CloseTab"
  ? CloseWebViewByID(action.id)
  : action.type === "Tabs"
  ? WebViewActionByID(action.source.id, action.source)
  : action.type === "Attach"
  ? AttachSidebar
  : action.type === "Detach"
  ? DetachSidebar
  : { type: "Sidebar"
    , action
    }
  );

const WebViewsAction = action =>
  ( action.type === "ShowTabs"
  ? ShowTabs
  : action.type === "Create"
  ? CreateWebView
  : action.type === "Edit"
  ? EditWebView
  : action.type === "SelectRelative"
  ? { type: "SelectTab"
    , source: action
    }
  : action.type === "ActivateSelected"
  ? { type: "ActivateTab"
    , source: action
    }
  : action.type === "ActivateByID"
  ? { type: "ActivateTabByID"
    , source: action
    }
  : { type: 'WebViews'
    , source: action
    }
  );

const ShellAction = action =>
  ( action.type === 'Focus'
  ? { type: 'Focus'
    , source: action
    }
  : { type: 'Shell'
    , source: action
    }
  );

const DevtoolsAction = action =>
  ( { type: 'Devtools'
    , action
    }
  );

const updateWebViews = cursor({
  get: model => model.webViews,
  set: (model, webViews) => merge(model, {webViews}),
  update: WebViews.update,
  tag: WebViewsAction
});

const updateShell = cursor({
  get: model => model.shell,
  set: (model, shell) => merge(model, {shell}),
  update: Shell.update,
  tag: ShellAction
});

const updateDevtools = cursor({
  get: model => model.devtools,
  set: (model, devtools) => merge(model, {devtools}),
  update: Devtools.update,
  tag: DevtoolsAction
});

const updateSidebar = cursor({
  get: model => model.sidebar,
  set: (model, sidebar) => merge(model, {sidebar}),
  tag: SidebarAction,
  update: Sidebar.update
});

const Reloaded =
  { type: "Reloaded"
  };

const Failure = error =>
  ( { type: "Failure"
    , error: error
    }
  );


// ### Mode changes


export const CreateWebView/*:type.CreateWebView*/ =
  { type: 'CreateWebView'
  };

export const EditWebView/*:type.EditWebView*/ =
  { type: 'EditWebView'
  };

export const ShowWebView/*:type.ShowWebView*/ =
  { type: 'ShowWebView'
  };

export const ShowTabs/*:type.ShowTabs*/ =
  { type: 'ShowTabs'
  };

export const SelectWebView/*:type.SelectWebView*/ =
  { type: 'SelectWebView'
  };

// ### Actions that affect multilpe sub-components

export const AttachSidebar/*:type.AttachSidebar*/ =
  { type: "AttachSidebar"
  , source: Sidebar.Attach
  };

export const DetachSidebar/*:type.DetachSidebar*/ =
  { type: "DetachSidebar"
  , source: Sidebar.Detach
  };

export const Escape/*:type.Escape*/ =
  { type: 'Escape'
  };


export const Unload/*:type.Unload*/ =
  { type: 'Unload'
  };

export const ReloadRuntime/*:type.ReloadRuntime*/ =
  { type: 'ReloadRuntime'
  };

// ## Resize actions

export const Expand/*:type.Expand*/ = {type: "Expand"};
export const Expanded/*:type.Expanded*/ = {type: "Expanded"};
export const Shrink/*:type.Shrink*/ = {type: "Shrink"};
export const Shrinked/*:type.Shrinked*/ = {type: "Shrinked"};


// Following Browser actions directly delegate to a `WebViews` module, there for
// they are just tagged versions of `WebViews` actions, but that is Just an
// implementation detail.
export const ZoomIn = WebViewsAction(WebViews.ZoomIn);
export const ZoomOut = WebViewsAction(WebViews.ZoomOut);
export const ResetZoom = WebViewsAction(WebViews.ResetZoom);
export const Reload = WebViewsAction(WebViews.Reload);
export const CloseWebView = WebViewsAction(WebViews.CloseActive);
export const GoBack = WebViewsAction(WebViews.GoBack);
export const GoForward = WebViewsAction(WebViews.GoForward);
export const SelectNext = WebViewsAction(WebViews.SelectNext);
export const SelectPrevious = WebViewsAction(WebViews.SelectPrevious);
export const ActivateSeleted = WebViewsAction(WebViews.ActivateSelected);
export const FocusWebView = WebViewsAction(WebViews.Focus);
export const NavigateTo = compose(WebViewsAction, WebViews.NavigateTo);
const UnfoldWebViews = WebViewsAction(WebViews.Unfold);
const FoldWebViews = WebViewsAction(WebViews.Fold);
const Open = compose(WebViewsAction, WebViews.Open);
const ReceiveOpenURLNotification =
  { type: "ReceiveOpenURLNotification"
  };

const OpenURL = ({url}) =>
  ( { type: "OpenURL"
    , uri: url
    }
  );

export const ActivateWebViewByID =
  compose(WebViewsAction, WebViews.ActivateByID);
const WebViewActionByID =
  compose(WebViewsAction, WebViews.ActionByID);

const CloseWebViewByID =
  compose(WebViewsAction, WebViews.CloseByID);

// Following browser actions directly delegate to one of the existing modules
// there for we define them by just wrapping actions from that module to avoid
// additional wiring (which is implementation detail that may change).
export const ToggleDevtools = DevtoolsAction(Devtools.Toggle);
export const Blur = ShellAction(Shell.Blur);
export const Focus = ShellAction(Shell.Focus);

const OpenSidebar = SidebarAction(Sidebar.Open);
const CloseSidebar = SidebarAction(Sidebar.Close);

const DockSidebar =
  { type: "Sidebar"
  , action: Sidebar.Attach
  };

const UndockSidebar =
  { type: "Sidebar"
  , action: Sidebar.Detach
  };

export const LiveReload =
  { type: 'LiveReload'
  };

const OverlayAction =
  compose(WebViewsAction, WebViews.ActiveWebViewAction, WebView.OverlayAction);
const InputAction =
  compose(WebViewsAction, WebViews.ActiveWebViewAction, WebView.InputAction);
const AssistantAction =
  compose(WebViewsAction, WebViews.ActiveWebViewAction, WebView.AssistantAction);

export const FocusInput =
  InputAction(Input.Focus);

// Animation

const ResizeAnimationAction = action =>
  ( { type: "ResizeAnimation"
    , action
    }
  );




const modifier = OS.platform() == 'linux' ? 'alt' : 'accel';
const decodeKeyDown = Keyboard.bindings({
  'accel l': always(EditWebView),
  'accel t': always(CreateWebView),
  'accel 0': always(ResetZoom),
  'accel -': always(ZoomOut),
  'accel =': always(ZoomIn),
  'accel shift =': always(ZoomIn),
  'accel w': always(CloseWebView),
  'accel shift ]': always(SelectNext),
  'accel shift [': always(SelectPrevious),
  'control tab': always(SelectNext),
  'control shift tab': always(SelectPrevious),
  // 'accel shift backspace':  always(ResetBrowserSession),
  // 'accel shift s': always(SaveBrowserSession),
  'accel r': always(Reload),
  'escape': always(Escape),
  [`${modifier} left`]: always(GoBack),
  [`${modifier} right`]: always(GoForward),

  // TODO: `meta alt i` generates `accel alt i` on OSX we need to look
  // more closely into this but so declaring both shortcuts should do it.
  'accel alt i': always(ToggleDevtools),
  'accel alt ˆ': always(ToggleDevtools),
  'F12': always(ToggleDevtools),
  'F5': always(ReloadRuntime),
  'meta control r': always(ReloadRuntime)
});

const decodeKeyUp = Keyboard.bindings({
  'control': always(ActivateSeleted),
  'accel': always(ActivateSeleted)
});

const showWebView = model =>
  batch
  ( update
  , merge(model, {mode: 'show-web-view'})
  , [ CloseSidebar
    , FoldWebViews
    , FocusWebView
    ]
  );

const createWebView = model =>
  openURL(model, URI.read('about:newtab'));

const showTabs = model =>
  batch
  ( update
  , merge(model, {mode: 'show-tabs'})
  , [ OpenSidebar
    , UnfoldWebViews
    ]
  );


const selectWebView = (model, action) =>
  batch
  ( update
  , merge(model, {mode: 'select-web-view'})
  , [ OpenSidebar
    , UnfoldWebViews
    ]
  );

const openURL = (model, uri) =>
  batch
  ( update
  , model
  , [ Open
      ( { uri
        , inBackground: false
        , name: ''
        , features: ''
        }
      )
    , ShowWebView
    , ReceiveOpenURLNotification
    ]
  );

const reciveOpenURLNotification = model =>
  [ model
  , Effects
    .task(Runtime.receive('mozbrowseropenwindow'))
    .map(OpenURL)
  ];


const focusWebView = model =>
  update(model, FocusWebView)

const attachSidebar = model =>
  batch
  ( update
  , merge(model, {mode: 'show-web-view'})
  , [ DockSidebar
    , Shrink
    , CloseSidebar
    , FoldWebViews
    , FocusWebView
    ]
  );

const detachSidebar = model =>
  batch
  ( update
  , model
  , [ UndockSidebar
    , Expand
    ]
  );

const reloadRuntime = model =>
  [ model
  , Effects
    .task(Runtime.reload)
    .map(Reloaded)
  ];

// Animations

const expand = model =>
  ( model.isExpanded
  ? [ model, Effects.none ]
  : startResizeAnimation(merge(model, {isExpanded: true}))
  );

const shrink = model =>
  ( model.isExpanded
  ? startResizeAnimation(merge(model, {isExpanded: false}))
  : [ model, Effects.none ]
  );


const startResizeAnimation = model => {
  const [resizeAnimation, fx] =
    Stopwatch.update(model.resizeAnimation, Stopwatch.Start);
  return [ merge(model, {resizeAnimation}), fx.map(ResizeAnimationAction) ];
}

const endResizeAnimation = model => {
  const [resizeAnimation, fx] =
    Stopwatch.update(model.resizeAnimation, Stopwatch.End);

  return [ merge(model, {resizeAnimation}), Effects.none ];
}

const shrinked = endResizeAnimation;
const expanded = endResizeAnimation;

const updateResizeAnimation = (model, action) => {
  const [resizeAnimation, fx] =
    Stopwatch.update(model.resizeAnimation, action);
  const duration = 200;

  const [begin, end] =
    ( model.isExpanded
    ? [50, 0]
    : [0, 50]
    );

  const result =
    ( duration > resizeAnimation.elapsed
    ? [ merge
        ( model
        , { resizeAnimation
          , display:
              merge
              ( model.display
              , { rightOffset
                  : Easing.ease
                    ( Easing.easeOutCubic
                    , Easing.float
                    , begin
                    , end
                    , duration
                    , resizeAnimation.elapsed
                    )
                }
              )
          }
        )
      , fx.map(ResizeAnimationAction)
      ]
    : [ merge
        ( model
        , { resizeAnimation
          , display: merge(model.display, { rightOffset: end })
          }
        )
      , Effects.receive
        ( model.isExpanded
        ? Expanded
        : Shrinked
        )
      ]
    );

  return result;
}



// Unbox For actions and route them to their location.
export const update/*:type.update*/ = (model, action) =>
  ( action.type === 'OpenURL'
  ? openURL(model, action.uri)
  : action.type === 'ReceiveOpenURLNotification'
  ? reciveOpenURLNotification(model)
  : action.type === 'CreateWebView'
  ? createWebView(model)
  : action.type === 'ShowTabs'
  ? showTabs(model)
  : action.type === 'SelectWebView'
  ? selectWebView(model)
  // @TODO Change this to toggle tabs instead.
  : action.type === 'Escape'
  ? showTabs(model)
  : action.type === 'AttachSidebar'
  ? attachSidebar(model)
  : action.type === 'DetachSidebar'
  ? detachSidebar(model)
  : action.type === 'ReloadRuntime'
  ? reloadRuntime(model)

  // Expand / Shrink animations
  : action.type === "Expand"
  ? expand(model)
  : action.type === "Shrink"
  ? shrink(model)
  : action.type === "ResizeAnimation"
  ? updateResizeAnimation(model, action.action)
  : action.type === "Expanded"
  ? expanded(model)
  : action.type === "Shrinked"
  ? shrinked(model)

  // Delegate to the appropriate module

  : action.type === 'WebViews'
  ? updateWebViews(model, action.source)
  : action.type === 'SelectTab'
  ? updateWebViews(model, action.source)
  : action.type === 'ActivateTabByID'
  ? updateWebViews(model, action.source)
  : action.type === 'ActivateTab'
  ? updateWebViews(model, action.source)

  : action.type === 'Shell'
  ? updateShell(model, action.source)
  : action.type === 'Focus'
  ? updateShell(model, action.source)

  : action.type === 'Devtools'
  ? updateDevtools(model, action.action)
  : action.type === 'Sidebar'
  ? updateSidebar(model, action.action)

  : action.type === 'Failure'
  ? [ model
    , Effects.task(Unknown.error(action.error))
    ]

  // Ignore some actions.
  : action.type === 'Reloaded'
  ? [model, Effects.none]
  // TODO: Delegate to modules that need to do cleanup.
  : action.type === 'LiveReload'
  ? [model, Effects.none]

  : Unknown.update(model, action)
  );

const styleSheet = StyleSheet.create({
  root: {
    background: '#171814',
    perspective: '1000px',
    // These styles prevent scrolling with the arrow keys in the root window
    // when elements move outside of viewport.
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    position: 'absolute',
    MozWindowDragging: 'drag',
  },
  content: {
    position: 'absolute',
    perspective: '1000px',
    height: '100%',
    width: '100%'
  }
});

export const view/*:type.view*/ = (model, address) =>
  html.div
  ( { className: 'root'
    , style: styleSheet.root
    , tabIndex: 1
    , onKeyDown: onWindow(address, decodeKeyDown)
    , onKeyUp: onWindow(address, decodeKeyUp)
    , onBlur: onWindow(address, always(Blur))
    , onFocus: onWindow(address, always(Focus))
    , onUnload: onWindow(address, always(Unload))
    }
  , [ html.div
      ( { className: 'browser-content'
        , style:
          Style
          ( styleSheet.content
          , { width: `calc(100% - ${model.display.rightOffset}px)`
            }
          )
        }
      , [ thunk
          ( 'web-views'
          , WebViews.view
          , model.webViews
          , forward(address, WebViewsAction)
          )
        , thunk
          ( 'overlay'
          , Overlay.view
          , WebViews.getActive(model.webViews).overlay
          , forward(address, OverlayAction))
        , thunk
          ( 'assistant'
          , Assistant.view
          , WebViews.getActive(model.webViews).assistant
          , forward(address, AssistantAction)
          )
        , thunk
          ( 'input'
          , Input.view
          , WebViews.getActive(model.webViews).input
          , forward(address, InputAction)
          )
        , thunk
          ( 'devtools'
          , Devtools.view
          , model.devtools
          , forward(address, DevtoolsAction)
          )
        ]
      )
      , thunk
      ( 'sidebar'
      , Sidebar.view
      , model.sidebar
      , model.webViews
      , forward(address, SidebarAction)
      )

    , thunk
      ( 'shell'
      , Shell.view
      , model.shell
      , forward(address, ShellAction)
      )
    ]
  );
