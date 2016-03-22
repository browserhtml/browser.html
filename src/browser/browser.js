/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {version} from "../../package.json";
import * as Config from "../../browserhtml.json";
import {Effects, html, forward, thunk} from "reflex";

import * as Shell from "./shell";
import * as Input from "./input";
import * as Assistant from "./assistant";
import * as Sidebar from './sidebar';
import * as WebViews from "./web-views";
import * as Overlay from './overlay';

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
  const [input, inputFx] = Input.init(false, false, "");
  const [shell, shellFx] = Shell.init();
  const [webViews, webViewsFx] = WebViews.init();
  const [sidebar, sidebarFx] = Sidebar.init();
  const [assistant, assistantFx] = Assistant.init();
  const [overlay, overlayFx] = Overlay.init(false, false);

  const model =
    { version
    , mode: 'create-web-view'
    , shell
    , input
    , assistant
    , webViews
    , sidebar
    , overlay
    , devtools

    , display: { rightOffset: 0 }
    , isExpanded: true
    };

  const fx =
    Effects.batch
    ( [ devtoolsFx.map(DevtoolsAction)
      , inputFx.map(InputAction)
      , shellFx.map(ShellAction)
      , webViewsFx.map(WebViewsAction)
      , sidebarFx.map(SidebarAction)
      , assistantFx.map(AssistantAction)
      , overlayFx.map(OverlayAction)
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

const OverlayAction = action =>
  ( action.type === "Click"
  ? OverlayClicked
  : { type: "Overlay"
    , action
    }
  );


const InputAction = action =>
  ( action.type === 'Submit'
  ? SubmitInput
  : action.type === 'Abort'
  ? ExitInput
  : action.type === 'Blur'
  ? BlurInput
  : action.type === 'Query'
  ? Query(action.source)
  : action.type === 'SuggestNext'
  ? SuggestNext
  : action.type === 'SuggestPrevious'
  ? SuggestPrevious
  : tagged('Input', action)
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

const AssistantAction =
  action =>
  ( action.type === 'Suggest'
  ? Suggest(action.source)
  : tagged('Assistant', action)
  );

const updateInput = cursor({
  get: model => model.input,
  set: (model, input) => merge(model, {input}),
  update: Input.update,
  tag: InputAction
});

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

const updateAssistant = cursor({
  get: model => model.assistant,
  set: (model, assistant) => merge(model, {assistant}),
  update: Assistant.update,
  tag: AssistantAction
});

const updateSidebar = cursor({
  get: model => model.sidebar,
  set: (model, sidebar) => merge(model, {sidebar}),
  tag: SidebarAction,
  update: Sidebar.update
});

const updateOverlay = cursor({
  get: model => model.overlay,
  set: (model, overlay) => merge(model, {overlay}),
  tag: OverlayAction,
  update: Overlay.update
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

export const OpenWebView/*:type.OpenWebView*/ =
  { type: 'OpenWebView'
  };

export const AttachSidebar/*:type.AttachSidebar*/ =
  { type: "AttachSidebar"
  , source: Sidebar.Attach
  };

export const DetachSidebar/*:type.DetachSidebar*/ =
  { type: "DetachSidebar"
  , source: Sidebar.Detach
  };

export const OverlayClicked/*:type.OverlayClicked*/ =
  { type: "OverlayClicked"
  };

export const SubmitInput/*:type.SubmitInput*/ =
  { type: 'SubmitInput'
  };

export const ExitInput/*:type.ExitInput*/ =
  { type: 'ExitInput'
  , source: Input.Abort
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

export const BlurInput =
  { type: 'BlurInput'
  , source: Input.Blur
  };

// ## Resize actions

export const SuggestNext = tagged('SuggestNext');
export const SuggestPrevious = tagged('SuggestPrevious');
export const Suggest = tag('Suggest');
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
const Query = tag('Query');

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

const ShowInput = InputAction(Input.Show);
const HideInput = InputAction(Input.Hide);
const EnterInput = InputAction(Input.Enter);
const EnterInputSelection = compose(InputAction, Input.EnterSelection);
export const FocusInput = InputAction(Input.Focus);

const OpenAssistant = AssistantAction(Assistant.Open);
const CloseAssistant = AssistantAction(Assistant.Close);
const ExpandAssistant = AssistantAction(Assistant.Expand);
const QueryAssistant = compose(AssistantAction, Assistant.Query);

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

const HideOverlay = OverlayAction(Overlay.Hide);
const ShowOverlay = OverlayAction(Overlay.Show);
const FadeOverlay = OverlayAction(Overlay.Fade);

export const LiveReload =
  { type: 'LiveReload'
  };

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
  , [ HideInput
    , CloseAssistant
    , CloseSidebar
    , HideOverlay
    , FoldWebViews
    , FocusWebView
    ]
  );

const createWebView = model =>
  batch
  ( update
  , merge(model, {mode: 'create-web-view'})
  , [ ShowInput
    , ExpandAssistant
    , CloseSidebar
    , HideOverlay
    , FoldWebViews
    , EnterInput
    ]
  );

const editWebView = model =>
  batch
  ( update
  , merge(model, {mode: 'edit-web-view'})
  , [ ShowInput
    , OpenAssistant
    , CloseSidebar
    , ShowOverlay
    , FoldWebViews
    , EnterInputSelection(WebViews.getActiveURI(model.webViews, ''))
    ]
  );

const showTabs = model =>
  batch
  ( update
  , merge(model, {mode: 'show-tabs'})
  , [ HideInput
    , CloseAssistant
    , OpenSidebar
    , ShowOverlay
    , UnfoldWebViews
    ]
  );


const selectWebView = (model, action) =>
  batch
  ( update
  , merge(model, {mode: 'select-web-view'})
  , [ HideInput
    , CloseAssistant
    , OpenSidebar
    , UnfoldWebViews
    , FadeOverlay
    ]
  );


const submitInput = model =>
  update(model, NavigateTo(URI.read(model.input.value)));

const openWebView = model =>
  update
  ( model
  , Open
    ( { uri: URI.read(model.input.value)
      , inBackground: false
      , name: ''
      , features: ''
      }
    )
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

const exitInput = model =>
  batch
  ( update
  , model
  , [ CloseAssistant
    , FocusWebView
    ]
  );


const attachSidebar = model =>
  batch
  ( update
  , merge(model, {mode: 'show-web-view'})
  , [ DockSidebar
    , Shrink
    , CloseSidebar
    , HideOverlay
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


const updateQuery =
  (model, action) =>
  updateAssistant
  ( model
  , Assistant.Query(model.input.value)
  );

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
  ( action.type === 'SubmitInput'
  ? submitInput(model)
  : action.type === 'OpenWebView'
  ? openWebView(model)
  : action.type === 'OpenURL'
  ? openURL(model, action.uri)
  : action.type === 'ReceiveOpenURLNotification'
  ? reciveOpenURLNotification(model)
  : action.type === 'ExitInput'
  ? exitInput(model)
  : action.type === 'CreateWebView'
  ? createWebView(model)
  : action.type === 'EditWebView'
  ? editWebView(model)
  : action.type === 'ShowWebView'
  ? showWebView(model)
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
  : action.type === 'Input'
  ? updateInput(model, action.source)
  : action.type === 'Suggest'
  ? updateInput
    ( model
    , Input.Suggest
      ( { query: model.assistant.query
        , match: action.source.match
        , hint: action.source.hint
        }
      )
    )

  : action.type === 'BlurInput'
  ? updateInput(model, action.source)

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

  // Assistant
  : action.type === 'Assistant'
  ? updateAssistant(model, action.source)
  : action.type === 'Query'
  ? updateQuery(model)
  : action.type === 'SuggestNext'
  ? updateAssistant(model, Assistant.SuggestNext)
  : action.type === 'SuggestPrevious'
  ? updateAssistant(model, Assistant.SuggestPrevious)

  : action.type === 'Devtools'
  ? updateDevtools(model, action.action)
  : action.type === 'Sidebar'
  ? updateSidebar(model, action.action)
  : action.type === 'Overlay'
  ? updateOverlay(model, action.action)

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
    // @WORKAROUND Use percent, not vw and vh to work around
    // https://github.com/servo/servo/issues/8754
    width: '100%',
    height: '100%',
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
          , model.overlay
          , forward(address, OverlayAction))
        , thunk
          ( 'assistant'
          , Assistant.view
          , model.assistant
          , forward(address, AssistantAction)
          )
        , thunk
          ( 'input'
          , Input.view
          , model.input
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
